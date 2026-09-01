import pandas as pd
import numpy as np
import os
import yaml
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import warnings
warnings.filterwarnings('ignore')

class AnomalyEngine:
    def __init__(self, features_path="outputs/features.csv"):
        self.features_path = features_path
        self.output_dir = "outputs/anomalies/"
        self.report_path = "reports/anomaly_report.md"
        
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(os.path.dirname(self.report_path), exist_ok=True)
        
    def load_data(self):
        print(f"Loading features from {self.features_path}...")
        self.df = pd.read_csv(self.features_path, low_memory=False)
        self.df['reporting_date_dt'] = pd.to_datetime(self.df['reporting_date_dt'])
        self.df['orig_date_dt'] = pd.to_datetime(self.df['orig_date_dt'])
        
        # In case we need first_payment_date dt
        self.df['first_pay_dt'] = pd.to_datetime(self.df['first_payment_date'].astype(str), format='%m%Y', errors='coerce')
        
    def apply_deterministic_rules(self):
        print("Applying Deterministic Rules Engine...")
        df = self.df
        
        rule_scores = np.zeros(len(df))
        triggered_rules = [[] for _ in range(len(df))]
        
        def add_violation(mask, penalty, rule_name):
            rule_scores[mask] += penalty
            for idx in np.where(mask)[0]:
                triggered_rules[idx].append(rule_name)
                
        # 1. Invalid dates
        mask1 = df['first_pay_dt'] < df['orig_date_dt']
        add_violation(mask1, 20, "Invalid Date (First Pay < Orig)")
        
        # 2. Balance inconsistency
        mask2 = df['current_upb'] > (df['orig_upb'] * 1.05)
        add_violation(mask2, 15, "Balance Inconsistency (Curr > Orig)")
        
        # 3. Delinquency/status inconsistency
        # DPD > 0 but Zero balance code indicates prepaid (1)
        mask3 = (df['dpd'] > 0) & (df['zero_balance_code'] == 1)
        add_violation(mask3, 20, "Delinquency/Prepayment Conflict")
        
        # 4. Default/status conflict
        # ZBC in [3,6,9] but current_upb > 0
        mask4 = (df['zero_balance_code'].isin([3, 6, 9])) & (df['current_upb'] > 0)
        add_violation(mask4, 25, "Default without zero balance")
        
        # 5. Prepayment/status conflict
        mask5 = (df['zero_balance_code'] == 1) & (df['current_upb'] > 0)
        add_violation(mask5, 25, "Prepayment without zero balance")
        
        # 6. Stale records (age not incrementing)
        grouped = df.groupby('loan_id')
        age_diff = grouped['loan_age'].diff()
        mask6 = (age_diff == 0) & (age_diff.notnull())
        add_violation(mask6, 10, "Stale Record (Age frozen)")
        
        # 7. Source-system conflict (static fields changing)
        orig_upb_diff = grouped['orig_upb'].diff()
        mask7 = (orig_upb_diff != 0) & (orig_upb_diff.notnull())
        add_violation(mask7, 10, "Source Conflict (Static field changed)")
        
        # 8. Excessive missingness
        missing_count = df[['dti', 'orig_ltv', 'borrower_credit_score']].isnull().sum(axis=1)
        mask8 = missing_count >= 2
        add_violation(mask8, 15, "Excessive Missingness")
        
        # 9. Impossible loan age/term
        mask9 = df['loan_age'] > df['orig_loan_term']
        add_violation(mask9, 20, "Impossible Loan Age (> Term)")
        
        self.df['rule_violation_score'] = rule_scores
        self.df['triggered_rules'] = [", ".join(rules) if rules else "None" for rules in triggered_rules]

    def apply_ml_anomaly_detection(self):
        print("Applying Isolation Forest ML Anomaly Detection...")
        
        features = [
            'dti', 'orig_ltv', 'borrower_credit_score', 'bal_change_1m', 
            'interest_rate_diff', 'dpd'
        ]
        
        X = self.df[features].copy()
        
        imputer = SimpleImputer(strategy='median')
        X_imputed = imputer.fit_transform(X)
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_imputed)
        
        # Calculate z-scores for feature importance later
        self.z_scores = np.abs(X_scaled)
        
        iso = IsolationForest(contamination=0.05, random_state=42)
        iso.fit(X_scaled)
        
        # Raw anomaly scores (lower is more anomalous, ranges typically -0.5 to 0.5)
        raw_scores = iso.decision_function(X_scaled)
        
        # Invert and normalize to 0-100 (higher = more anomalous)
        # Shift so max normal is 0, and anomalous is positive
        inverted = -raw_scores
        min_val, max_val = inverted.min(), inverted.max()
        ml_scores = ((inverted - min_val) / (max_val - min_val)) * 100
        
        self.df['ml_anomaly_score'] = ml_scores
        
        # Extract drivers based on max z-score
        top_drivers = []
        for i in range(len(self.df)):
            if self.df['ml_anomaly_score'].iloc[i] > 60: # Only bother for somewhat anomalous
                max_feat_idx = np.argmax(self.z_scores[i])
                feat_name = features[max_feat_idx]
                val = X.iloc[i][feat_name]
                top_drivers.append(f"{feat_name} ({val})")
            else:
                top_drivers.append("N/A")
                
        self.df['top_drivers'] = top_drivers

    def compile_scores(self):
        print("Compiling Composite Scores and ranking...")
        
        # Composite: Rule violations heavily weighted + ML Score
        # Max composite can theoretically exceed 100 if severely broken
        self.df['composite_anomaly_score'] = self.df['rule_violation_score'] * 1.5 + self.df['ml_anomaly_score'] * 0.5
        
        # Exception Logic
        def get_exception(row):
            if row['rule_violation_score'] >= 20:
                return "Severe Data Structural Error"
            elif row['rule_violation_score'] > 0:
                return "Data Rule Violation"
            elif row['ml_anomaly_score'] >= 85:
                return "Extreme Statistical Outlier"
            return "None"
            
        self.df['exception_type'] = self.df.apply(get_exception, axis=1)
        self.df['exception_required'] = (self.df['exception_type'] != "None").astype(int)
        
        def get_action(row):
            if "Structural" in row['exception_type']:
                return "Quarantine record and notify source system."
            elif "Rule Violation" in row['exception_type']:
                return "Review record logic manually."
            elif "Statistical Outlier" in row['exception_type']:
                return "Approve manually - possible edge case."
            return "Proceed"
            
        self.df['recommended_action'] = self.df.apply(get_action, axis=1)
        
        self.df = self.df.sort_values(by='composite_anomaly_score', ascending=False)
        
    def generate_outputs(self):
        print("Saving anomaly outputs...")
        
        # Output all scores
        out_cols = [
            'loan_id', 'reporting_period', 'rule_violation_score', 'ml_anomaly_score', 
            'composite_anomaly_score', 'exception_required', 'exception_type', 
            'triggered_rules', 'top_drivers', 'recommended_action'
        ]
        self.df[out_cols].to_csv(os.path.join(self.output_dir, "anomaly_scores.csv"), index=False)
        
        # Top 20 Reviewer-ready
        top_20 = self.df[out_cols].head(20)
        top_20.to_csv(os.path.join(self.output_dir, "top_20_anomalies.csv"), index=False)
        
        # Generate Markdown Report
        md = f"""# LoanIQ Hybrid Anomaly & Exception Intelligence Report

## 1. Objective
To enforce rigorous data integrity and identify structural impossibilities and statistical outliers using a dual-engine approach (Deterministic Business Logic + Machine Learning Isolation Forests).

## 2. Engine Methodology
- **Deterministic Engine:** Scans exactly 9 rigid compliance and logic checks (e.g., *Current UPB > Orig UPB*, *Stale Records*, *Prepayment without Zero Balance*). Records failing these are heavily penalized and flagged as structural errors requiring immediate quarantine.
- **Machine Learning Engine:** Implements an `IsolationForest` (contamination=0.05) across standard normal transformations of primary risk drivers (DTI, LTV, Credit Score, DPD, Balance Change). ML Scores are normalized 0-100.
- **Composite Score:** `(Rule Score * 1.5) + (ML Score * 0.5)`. This ensures absolute priority is given to mathematically broken records.
- **LLM Disclaimer:** **No LLMs were used** to calculate any anomaly score, driver, or violation in this module. All calculations are deterministic math or standard scikit-learn ML.

## 3. Executive Summary
- **Total Records Analyzed:** {len(self.df)}
- **Exceptions Flagged (Required Review):** {self.df['exception_required'].sum()}
- **Top Exception Type:** {self.df[self.df['exception_required']==1]['exception_type'].mode().iloc[0] if self.df['exception_required'].sum() > 0 else 'None'}

## 4. Top 20 Anomalous Records
The top 20 problematic records ranked by composite anomaly severity are exported to `outputs/anomalies/top_20_anomalies.csv`.

"""
        with open(self.report_path, "w") as f:
            f.write(md)

    def run(self):
        self.load_data()
        self.apply_deterministic_rules()
        self.apply_ml_anomaly_detection()
        self.compile_scores()
        self.generate_outputs()
        print("Anomaly detection complete.")

if __name__ == "__main__":
    eng = AnomalyEngine()
    eng.run()
