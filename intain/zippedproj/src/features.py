import pandas as pd
import numpy as np
import os
import yaml
from datetime import datetime

class FeatureEngineer:
    def __init__(self, config_path="config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
        
        self.raw_data_path = self.config['data']['raw_data_path']
        self.output_path = "outputs/features.csv"
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
        
    def load_data(self):
        print(f"Loading raw dataset from {self.raw_data_path}...")
        self.df = pd.read_csv(self.raw_data_path, sep='|', header=None, low_memory=False)
        
        col_map = {
            1: 'loan_id',
            2: 'reporting_period',
            3: 'seller_name',
            4: 'servicer_name',
            7: 'orig_interest_rate',
            8: 'current_interest_rate',
            9: 'orig_upb',
            10: 'current_upb',
            12: 'orig_loan_term',
            13: 'origination_date',
            14: 'first_payment_date',
            15: 'loan_age',
            16: 'remaining_months_to_maturity',
            19: 'orig_ltv',
            22: 'dti',
            23: 'borrower_credit_score',
            32: 'modification_flag',
            39: 'delinquency_status',
            43: 'zero_balance_code'
        }
        self.df = self.df.rename(columns=col_map)
        
        # Convert numeric
        numeric_cols = ['orig_interest_rate', 'current_interest_rate', 'orig_upb', 'current_upb', 
                        'orig_loan_term', 'loan_age', 'remaining_months_to_maturity', 'orig_ltv', 
                        'dti', 'borrower_credit_score', 'zero_balance_code']
        for col in numeric_cols:
            self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
            
        # Parse Dates
        self.df['reporting_date_dt'] = pd.to_datetime(self.df['reporting_period'].astype(str), format='%m%Y', errors='coerce')
        self.df['orig_date_dt'] = pd.to_datetime(self.df['origination_date'].astype(str), format='%m%Y', errors='coerce')
        
        # Sort chronologically by loan
        self.df = self.df.sort_values(by=['loan_id', 'reporting_date_dt'])
        
    def generate_features(self):
        print("Engineering features...")
        df = self.df.copy()
        
        # 1. Loan age features & 2. Remaining term features (Already somewhat present, but let's ensure clean)
        df['loan_age'] = df['loan_age'].fillna(0)
        df['remaining_months_to_maturity'] = df['remaining_months_to_maturity'].fillna(df['orig_loan_term'])
        
        # 3. Balance ratios
        df['balance_to_orig_ratio'] = np.where(df['orig_upb'] > 0, df['current_upb'] / df['orig_upb'], 0)
        
        # 4. Interest-rate features
        df['interest_rate_diff'] = df['current_interest_rate'] - df['orig_interest_rate']
        
        # 5. Numeric encoding of credit score bands
        # < 620: 0, 620-680: 1, 680-740: 2, > 740: 3
        df['credit_score_band'] = pd.cut(df['borrower_credit_score'], bins=[0, 620, 680, 740, 9999], labels=[0, 1, 2, 3]).astype(float)
        
        # 6. Numeric encoding of LTV bands
        # < 60: 0, 60-80: 1, 80-95: 2, > 95: 3
        df['ltv_band'] = pd.cut(df['orig_ltv'], bins=[-1, 60, 80, 95, 9999], labels=[0, 1, 2, 3]).astype(float)
        
        # 7. Numeric encoding of DTI bands
        # < 20: 0, 20-35: 1, 35-50: 2, > 50: 3
        df['dti_band'] = pd.cut(df['dti'], bins=[-1, 20, 35, 50, 9999], labels=[0, 1, 2, 3]).astype(float)
        
        # Parse Delinquency to DPD (Days Past Due approximation)
        # Fannie Mae maps '00' to Current, '01' to 30 days, '02' to 60 days, etc.
        def parse_dlq(val):
            val = str(val)
            if val.isdigit():
                return int(val) * 30
            return 0
            
        df['dpd'] = df['delinquency_status'].apply(parse_dlq)
        
        # Time-Series Grouped Features
        grouped = df.groupby('loan_id')
        
        # 8. Historical delinquency features (Has it ever been delinquent?)
        df['is_delinquent'] = (df['dpd'] > 0).astype(int)
        df['hist_delinquent_flag'] = grouped['is_delinquent'].cummax()
        
        # 9. Rolling 3-month and 6-month DPD statistics
        df['dpd_rolling_3m_max'] = grouped['dpd'].rolling(window=3, min_periods=1).max().reset_index(level=0, drop=True)
        df['dpd_rolling_6m_max'] = grouped['dpd'].rolling(window=6, min_periods=1).max().reset_index(level=0, drop=True)
        
        # 10. Maximum historical DPD
        df['max_hist_dpd'] = grouped['dpd'].cummax()
        
        # 11. Delinquency count (cumulative months in delinquency)
        df['cum_delinquency_months'] = grouped['is_delinquent'].cumsum()
        
        # 12. Balance change over 1 month
        df['bal_change_1m'] = df['current_upb'] - grouped['current_upb'].shift(1)
        
        # 13. Balance change over 3 months
        df['bal_change_3m'] = df['current_upb'] - grouped['current_upb'].shift(3)
        
        # 14. Modification history
        df['is_modified'] = (df['modification_flag'] == 'Y').astype(int)
        df['cum_modifications'] = grouped['is_modified'].cumsum()
        
        # 15. Status history (Number of status transitions)
        # A transition occurs if current state differs from previous state
        state_diff = (df['dpd'] != grouped['dpd'].shift(1)).astype(int)
        # ignore first row transition
        state_diff = state_diff.where(grouped['dpd'].shift(1).notnull(), 0)
        df['status_transitions'] = grouped[state_diff.name].cumsum() if hasattr(state_diff, 'name') else grouped.apply(lambda x: state_diff.loc[x.index].cumsum()).reset_index(level=0, drop=True)
        # Fix lambda issue: just calculate directly
        df['status_transitions'] = df.groupby('loan_id')['dpd'].transform(lambda x: (x != x.shift(1)).cumsum())
        
        # 16. Vintage features
        df['vintage_year'] = df['orig_date_dt'].dt.year
        
        # 17. Servicer/source features (Length of servicer name or encoded)
        # Just simple target encoding proxy or categorical code
        df['servicer_code'] = df['servicer_name'].astype('category').cat.codes
        
        # 18. Missingness indicators
        df['missing_dti'] = df['dti'].isnull().astype(int)
        df['missing_ltv'] = df['orig_ltv'].isnull().astype(int)
        df['missing_credit'] = df['borrower_credit_score'].isnull().astype(int)
        
        # 19. Data quality score (simple proxy)
        df['data_quality_score'] = 100 - (df['missing_dti']*5 + df['missing_ltv']*5 + df['missing_credit']*5)
        
        # 20. Interaction features for major risk drivers
        df['risk_interaction_ltv_dti'] = df['orig_ltv'] * df['dti']
        df['risk_interaction_cs_ltv'] = df['borrower_credit_score'] / (df['orig_ltv'] + 1)
        
        self.df = df
        
    def save_features(self):
        print(f"Saving features to {self.output_path}...")
        self.df.to_csv(self.output_path, index=False)
        print("Feature engineering complete.")
        
    def run(self):
        self.load_data()
        self.generate_features()
        self.save_features()

if __name__ == "__main__":
    eng = FeatureEngineer()
    eng.run()
