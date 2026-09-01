import pandas as pd
import numpy as np
import os
import yaml
import json

class DataValidator:
    def __init__(self, config_path="config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
            
        self.raw_data_path = self.config['data']['raw_data_path']
        self.output_dir = "outputs/profiling"
        self.report_path = "reports/data_intelligence_report.md"
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(os.path.dirname(self.report_path), exist_ok=True)
        
    def load_data(self):
        print(f"Loading raw dataset from {self.raw_data_path}...")
        self.df = pd.read_csv(self.raw_data_path, sep='|', header=None, low_memory=False)
        
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
        
        numeric_cols = ['orig_interest_rate', 'current_interest_rate', 'orig_upb', 'current_upb', 
                        'orig_loan_term', 'loan_age', 'orig_ltv', 'dti', 'borrower_credit_score', 'zero_balance_code']
        for col in numeric_cols:
            self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
            
        # Parse dates (MMYYYY)
        self.df['orig_date_dt'] = pd.to_datetime(self.df['origination_date'].astype(str), format='%m%Y', errors='coerce')
        self.df['first_pay_dt'] = pd.to_datetime(self.df['first_payment_date'].astype(str), format='%m%Y', errors='coerce')

        # Initialize issues and DQ score
        self.df['dq_score'] = 100
        self.issues = []

    def log_issue(self, index_mask, issue_type, issue_description, penalty):
        num_issues = index_mask.sum()
        if num_issues > 0:
            self.df.loc[index_mask, 'dq_score'] -= penalty
            self.issues.append({
                'issue_type': issue_type,
                'description': issue_description,
                'count': num_issues,
                'penalty_per_record': penalty
            })
            
    def calculate_psi(self, expected, actual, buckets=10):
        # A simple Population Stability Index calculation
        def scale_range(series):
            return series.dropna()

        expected = scale_range(expected)
        actual = scale_range(actual)

        if len(expected) == 0 or len(actual) == 0:
            return np.nan

        breakpoints = np.arange(0, buckets + 1) / buckets * 100
        breakpoints = np.percentile(expected, breakpoints)
        # Drop duplicate breakpoints
        breakpoints = np.unique(breakpoints)
        if len(breakpoints) < 2:
            return 0.0

        expected_fractions = np.histogram(expected, breakpoints)[0] / len(expected)
        actual_fractions = np.histogram(actual, breakpoints)[0] / len(actual)

        # Replace 0 with small value
        expected_fractions = np.where(expected_fractions == 0, 0.0001, expected_fractions)
        actual_fractions = np.where(actual_fractions == 0, 0.0001, actual_fractions)

        psi = np.sum((actual_fractions - expected_fractions) * np.log(actual_fractions / expected_fractions))
        return psi

    def run_validations(self):
        print("Running validations...")
        
        # 1. Date Relationships
        mask_date = self.df['first_pay_dt'] < self.df['orig_date_dt']
        self.log_issue(mask_date, 'Date Relationship', 'First payment date before origination date', 10)
        
        # 2. Balance Relationships
        # Current UPB shouldn't typically exceed Orig UPB by more than 10% (negative amort)
        mask_balance = self.df['current_upb'] > (self.df['orig_upb'] * 1.1)
        self.log_issue(mask_balance, 'Balance Relationship', 'Current UPB significantly exceeds Original UPB', 10)
        
        # 3. Delinquency/Status Consistency
        mask_delinq = (self.df['zero_balance_code'] > 0) & (self.df['current_upb'] > 0)
        self.log_issue(mask_delinq, 'Consistency', 'Zero Balance Code present but Current UPB > 0', 15)
        
        # 4. Cross-column breaks
        mask_dti = self.df['dti'] > 65
        self.log_issue(mask_dti, 'Cross-Column Break', 'DTI > 65%', 5)
        
        mask_ltv = self.df['orig_ltv'] > 150
        self.log_issue(mask_ltv, 'Cross-Column Break', 'Original LTV > 150%', 5)
        
        # 5. Stale Records & Source Conflicts (Time-series checks)
        print("Running time-series validations...")
        # Sort by loan and reporting period
        ts_df = self.df.sort_values(by=['loan_id', 'reporting_period'])
        
        # Stale records: Loan age doesn't increment between months
        age_diff = ts_df.groupby('loan_id')['loan_age'].diff()
        mask_stale_age = (age_diff == 0)
        
        # Conflicting static fields: orig_upb changes across reporting periods for the same loan
        orig_upb_diff = ts_df.groupby('loan_id')['orig_upb'].diff()
        mask_conflict = (orig_upb_diff != 0) & orig_upb_diff.notnull()
        
        # Map back to original df
        stale_indices = ts_df[mask_stale_age].index
        mask_stale_full = pd.Series(False, index=self.df.index)
        mask_stale_full.loc[stale_indices] = True
        self.log_issue(mask_stale_full, 'Stale Record', 'Loan Age failed to increment', 10)
        
        conflict_indices = ts_df[mask_conflict].index
        mask_conflict_full = pd.Series(False, index=self.df.index)
        mask_conflict_full.loc[conflict_indices] = True
        self.log_issue(mask_conflict_full, 'Source Conflict', 'Original UPB changed across reporting periods', 20)

    def calculate_drift(self):
        print("Calculating PSI drift...")
        # Split by year 2010
        train_mask = self.df['orig_date_dt'] < pd.Timestamp('2010-01-01')
        test_mask = self.df['orig_date_dt'] >= pd.Timestamp('2010-01-01')
        
        drift_results = []
        for col in ['borrower_credit_score', 'dti', 'orig_ltv']:
            train_vals = self.df.loc[train_mask, col]
            test_vals = self.df.loc[test_mask, col]
            
            psi = self.calculate_psi(train_vals, test_vals)
            drift_results.append({
                'feature': col,
                'psi': psi,
                'drift_status': 'Significant Drift' if psi > 0.2 else ('Moderate Drift' if psi > 0.1 else 'No Drift')
            })
            
        self.drift_df = pd.DataFrame(drift_results)
        self.drift_df.to_csv(os.path.join(self.output_dir, "drift_report.csv"), index=False)
        
    def generate_outputs(self):
        print("Saving validation outputs...")
        
        # validation_issues.csv
        issues_df = pd.DataFrame(self.issues)
        if len(issues_df) > 0:
            issues_df.to_csv(os.path.join(self.output_dir, "validation_issues.csv"), index=False)
        else:
            pd.DataFrame({'Message': ['No issues detected']}).to_csv(os.path.join(self.output_dir, "validation_issues.csv"), index=False)
            
        # data_quality_scores.csv
        dq_scores = self.df[['loan_id', 'reporting_period', 'dq_score']]
        dq_scores.to_csv(os.path.join(self.output_dir, "data_quality_scores.csv"), index=False)
        
        # top_anomalous_records.csv (Lowest DQ scores)
        top_anomalous = self.df.sort_values(by='dq_score').head(20)
        # Drop heavy date parsing columns for clean output
        top_anomalous = top_anomalous.drop(columns=['orig_date_dt', 'first_pay_dt'])
        top_anomalous.to_csv(os.path.join(self.output_dir, "top_anomalous_records.csv"), index=False)
        
        # Generate Markdown Report
        batch_score = self.df['dq_score'].mean()
        
        markdown = f"""# LoanIQ Data Intelligence & Validation Report

## 1. Executive Summary
- **Total Time-Series Records Analyzed:** {len(self.df)}
- **Batch Data Quality Score:** {batch_score:.2f} / 100

## 2. Validation Issues Detected
"""
        if len(issues_df) > 0:
            markdown += issues_df.to_markdown(index=False)
        else:
            markdown += "No validation issues detected."
            
        markdown += "\n\n## 3. Train vs Test Drift (PSI)\n"
        markdown += self.drift_df.to_markdown(index=False)
        
        markdown += "\n\n## 4. Anomalous Records\n"
        markdown += "The top 20 problematic records (with the lowest Data Quality scores) have been exported to `outputs/profiling/top_anomalous_records.csv` for human review."
        
        with open(self.report_path, "w") as f:
            f.write(markdown)
            
    def run(self):
        self.load_data()
        self.run_validations()
        self.calculate_drift()
        self.generate_outputs()
        print(f"Validation complete. Report saved to {self.report_path}")

if __name__ == "__main__":
    validator = DataValidator()
    validator.run()
