import pandas as pd
import numpy as np
import os
import yaml

class DataProfiler:
    def __init__(self, config_path="config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
            
        self.raw_data_path = self.config['data']['raw_data_path']
        self.output_dir = "outputs/profiling"
        os.makedirs(self.output_dir, exist_ok=True)
        
    def load_data(self):
        print(f"Loading raw dataset from {self.raw_data_path}...")
        self.df = pd.read_csv(self.raw_data_path, sep='|', header=None, low_memory=False)
        # Fannie Mae single family schema (we'll assign meaningful names to columns we care about)
        col_map = {
            1: 'loan_id',
            2: 'reporting_period',
            7: 'orig_interest_rate',
            8: 'current_interest_rate',
            9: 'orig_upb',
            10: 'current_upb',
            12: 'orig_loan_term',
            13: 'origination_date',
            14: 'first_payment_date',
            15: 'loan_age',
            19: 'orig_ltv',
            22: 'dti',
            23: 'borrower_credit_score',
            39: 'delinquency_status',
            43: 'zero_balance_code'
        }
        self.df = self.df.rename(columns=col_map)
        
        # Convert numeric columns where possible
        numeric_cols = ['orig_interest_rate', 'current_interest_rate', 'orig_upb', 'current_upb', 
                        'orig_loan_term', 'loan_age', 'orig_ltv', 'dti', 'borrower_credit_score', 'zero_balance_code']
        for col in numeric_cols:
            self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
            
    def profile_columns(self):
        print("Generating column-level profiling...")
        profile_data = []
        total_rows = len(self.df)
        
        for col in self.df.columns:
            series = self.df[col]
            missing_count = series.isnull().sum()
            
            col_info = {
                'column': col,
                'dtype': str(series.dtype),
                'unique_values': series.nunique(dropna=True),
                'missing_count': missing_count,
                'missing_percentage': (missing_count / total_rows) * 100
            }
            
            if pd.api.types.is_numeric_dtype(series):
                col_info.update({
                    'mean': series.mean(),
                    'median': series.median(),
                    'std_dev': series.std(),
                    'min': series.min(),
                    'max': series.max(),
                    'q25': series.quantile(0.25),
                    'q75': series.quantile(0.75)
                })
            else:
                col_info.update({
                    'mean': np.nan, 'median': np.nan, 'std_dev': np.nan,
                    'min': np.nan, 'max': np.nan, 'q25': np.nan, 'q75': np.nan
                })
                
            profile_data.append(col_info)
            
        profile_df = pd.DataFrame(profile_data)
        profile_df.to_csv(os.path.join(self.output_dir, "profiling_summary.csv"), index=False)
        
    def missingness_patterns(self):
        print("Detecting missing-value patterns...")
        # We can calculate the correlation matrix of missingness indicators
        missing_indicators = self.df.isnull().astype(int)
        # Only keep columns that actually have some missing values but aren't 100% missing
        cols_with_missing = missing_indicators.columns[(missing_indicators.sum() > 0) & (missing_indicators.sum() < len(self.df))]
        
        if len(cols_with_missing) > 1:
            missing_corr = missing_indicators[cols_with_missing].corr()
            missing_corr.to_csv(os.path.join(self.output_dir, "missingness.csv"))
        else:
            pd.DataFrame({"Note": ["Not enough columns with partial missingness for correlation"]}).to_csv(os.path.join(self.output_dir, "missingness.csv"), index=False)

    def detect_outliers(self):
        print("Detecting numerical outliers using IQR...")
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        outliers_data = []
        
        for col in numeric_cols:
            series = self.df[col].dropna()
            if len(series) == 0:
                continue
                
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            outlier_mask = (series < lower_bound) | (series > upper_bound)
            num_outliers = outlier_mask.sum()
            
            if num_outliers > 0:
                outliers_data.append({
                    'column': col,
                    'lower_bound': lower_bound,
                    'upper_bound': upper_bound,
                    'outlier_count': num_outliers,
                    'outlier_percentage': (num_outliers / len(self.df)) * 100
                })
                
        outliers_df = pd.DataFrame(outliers_data)
        outliers_df.to_csv(os.path.join(self.output_dir, "outliers.csv"), index=False)
        
    def run(self):
        self.load_data()
        self.profile_columns()
        self.missingness_patterns()
        self.detect_outliers()
        print(f"Profiling complete. Outputs saved to {self.output_dir}")

if __name__ == "__main__":
    profiler = DataProfiler()
    profiler.run()
