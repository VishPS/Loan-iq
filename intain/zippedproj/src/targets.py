import pandas as pd
import numpy as np
import os

class TargetConstructor:
    def __init__(self, input_path="outputs/features.csv"):
        self.input_path = input_path
        self.train_out = "outputs/train.csv"
        self.val_out = "outputs/val.csv"
        os.makedirs("outputs", exist_ok=True)
        
    def load_data(self):
        print(f"Loading features from {self.input_path}...")
        self.df = pd.read_csv(self.input_path, low_memory=False)
        self.df['reporting_date_dt'] = pd.to_datetime(self.df['reporting_date_dt'])
        self.df = self.df.sort_values(by=['loan_id', 'reporting_date_dt'])
        
    def create_targets(self):
        print("Constructing predictive targets...")
        df = self.df
        grouped = df.groupby('loan_id')
        
        # 1. next_3m_delinquency_flag
        # shift backwards (shift negative) to look into the future
        # .shift(-1) looks 1 month ahead. rolling(3) looks at -1, -2, -3.
        df['future_delinq_3m'] = grouped['is_delinquent'].shift(-1)[::-1].rolling(window=3, min_periods=1).max()[::-1]
        df['next_3m_delinquency_flag'] = (df['future_delinq_3m'] > 0).astype(int)
        
        # 2. next_6m_delinquency_flag
        df['future_delinq_6m'] = grouped['is_delinquent'].shift(-1)[::-1].rolling(window=6, min_periods=1).max()[::-1]
        df['next_6m_delinquency_flag'] = (df['future_delinq_6m'] > 0).astype(int)
        
        # Define default and prepaid flags for current month
        df['is_default'] = df['zero_balance_code'].isin([3, 6, 9]).astype(int)
        df['is_prepaid'] = (df['zero_balance_code'] == 1).astype(int)
        
        # 3. next_12m_default_flag
        df['future_default_12m'] = grouped['is_default'].shift(-1)[::-1].rolling(window=12, min_periods=1).max()[::-1]
        df['next_12m_default_flag'] = (df['future_default_12m'] > 0).astype(int)
        
        # 4. next_12m_prepayment_flag
        df['future_prepay_12m'] = grouped['is_prepaid'].shift(-1)[::-1].rolling(window=12, min_periods=1).max()[::-1]
        df['next_12m_prepayment_flag'] = (df['future_prepay_12m'] > 0).astype(int)
        
        # 5. next_state (Immediate next month)
        next_delinq = grouped['is_delinquent'].shift(-1)
        next_default = grouped['is_default'].shift(-1)
        next_prepay = grouped['is_prepaid'].shift(-1)
        
        conditions = [
            next_default == 1,
            next_prepay == 1,
            next_delinq == 1
        ]
        choices = ['Default', 'Prepaid', 'Delinquent']
        df['next_state'] = np.select(conditions, choices, default='Current')
        # If last row for a loan and no termination, state is unknown (NaN)
        df.loc[grouped.tail(1).index, 'next_state'] = np.nan
        
        # 6. exception_required & 7. exception_type
        # Define a rule-based exception required framework based on current features
        exc_conditions = [
            df['dpd'] >= 90,
            df['dti'] > 65,
            df['orig_ltv'] > 150,
            df['data_quality_score'] < 80
        ]
        exc_choices = [
            'Severe Delinquency (>90 DPD)',
            'DTI Limit Exceeded (>65%)',
            'LTV Limit Exceeded (>150%)',
            'Poor Data Quality'
        ]
        df['exception_type'] = np.select(exc_conditions, exc_choices, default='None')
        df['exception_required'] = (df['exception_type'] != 'None').astype(int)
        
        self.df = df
        
    def split_data(self):
        print("Performing time-aware chronological split...")
        
        # Determine a cutoff date. We'll pick the 80th percentile of dates
        unique_dates = sorted(self.df['reporting_date_dt'].dropna().unique())
        if len(unique_dates) == 0:
            raise ValueError("No valid reporting dates found for splitting.")
            
        cutoff_idx = int(len(unique_dates) * 0.8)
        cutoff_date = unique_dates[cutoff_idx]
        
        print(f"Cutoff Date selected: {cutoff_date}")
        
        # Validation set: strictly on or after cutoff date
        val_df = self.df[self.df['reporting_date_dt'] >= cutoff_date].copy()
        
        # Train set: before cutoff date
        train_df = self.df[self.df['reporting_date_dt'] < cutoff_date].copy()
        
        # ANTI-LEAKAGE: Drop any training records whose 12-month future horizon crosses the cutoff.
        # This means drop records within 12 months before the cutoff date.
        twelve_months_prior = pd.Timestamp(cutoff_date) - pd.DateOffset(months=12)
        train_df = train_df[train_df['reporting_date_dt'] < twelve_months_prior].copy()
        
        # Handle tiny sample dataset: if train_df or val_df are empty due to truncation, gracefully fall back
        if len(train_df) == 0 or len(val_df) == 0:
            print("WARNING: Due to small dataset size and leakage prevention, one split is empty.")
            print("Falling back to standard chronological split without horizon truncation to allow execution.")
            train_df = self.df[self.df['reporting_date_dt'] < cutoff_date].copy()
            val_df = self.df[self.df['reporting_date_dt'] >= cutoff_date].copy()
            
        # Overlap Check
        train_dates = set(train_df['reporting_date_dt'].unique())
        val_dates = set(val_df['reporting_date_dt'].unique())
        overlap = train_dates.intersection(val_dates)
        
        # Print Diagnostics
        print("\n--- Diagnostics ---")
        print(f"Total Features: {len(self.df.columns)}")
        print(f"Target Prevalence (Next 3M Delinq): {self.df['next_3m_delinquency_flag'].mean():.4f}")
        print(f"Target Prevalence (Next 12M Default): {self.df['next_12m_default_flag'].mean():.4f}")
        
        print("\nTrain Set Date Range: ", train_df['reporting_date_dt'].min(), "to", train_df['reporting_date_dt'].max())
        print("Val Set Date Range:   ", val_df['reporting_date_dt'].min(), "to", val_df['reporting_date_dt'].max())
        
        print("\nTrain Unique Loans:", train_df['loan_id'].nunique())
        print("Val Unique Loans:  ", val_df['loan_id'].nunique())
        
        print("\nDate Overlap Size:", len(overlap))
        if len(overlap) > 0:
            print("WARNING: Date overlap detected. Check splitting logic.")
        else:
            print("SUCCESS: Zero overlap in observation dates between train and validation.")
            
        self.train_df = train_df
        self.val_df = val_df
        
    def save_outputs(self):
        print(f"\nSaving train set to {self.train_out} ({len(self.train_df)} rows)")
        self.train_df.to_csv(self.train_out, index=False)
        print(f"Saving val set to {self.val_out} ({len(self.val_df)} rows)")
        self.val_df.to_csv(self.val_out, index=False)
        print("Target construction and splitting complete.")
        
    def run(self):
        self.load_data()
        self.create_targets()
        self.split_data()
        self.save_outputs()

if __name__ == "__main__":
    t = TargetConstructor()
    t.run()
