import pandas as pd
import numpy as np
import yaml
import os
import joblib

class ScenarioAnalyzer:
    def __init__(self, config_path="config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
            
        self.processed_data_path = self.config['data']['processed_path']
        self.models_dir = self.config['models']['save_dir']
        self.report_dir = os.path.join(self.config['reports']['base_dir'], "scenarios")
        os.makedirs(self.report_dir, exist_ok=True)
        
        self.features = [
            'loan_amount', 'interest_rate', 'term_months', 'credit_score', 
            'dti', 'ltv', 'employment_length_years', 'annual_income'
        ]
        
    def run(self):
        print("Starting Scenario Analysis...")
        df_base = pd.read_csv(self.processed_data_path)
        
        # Load default and prepay models
        default_model = joblib.load(os.path.join(self.models_dir, "default_model.pkl"))
        prepay_model = joblib.load(os.path.join(self.models_dir, "prepaid_model.pkl"))
        
        # Scenario 1: Base
        base_default_prob = df_base['prob_default'].mean()
        base_prepay_prob = df_base['prob_prepaid'].mean()
        
        # Scenario 2: Adverse Credit (-50 points)
        df_adverse = df_base.copy()
        df_adverse['credit_score'] = np.clip(df_adverse['credit_score'] - 50, 300, 850)
        adverse_default_prob = default_model.predict_proba(df_adverse[self.features])[:, 1].mean()
        
        # Scenario 3: High Prepayment (e.g., interest rates drop across the board by 2%)
        df_high_prepay = df_base.copy()
        df_high_prepay['interest_rate'] = np.clip(df_high_prepay['interest_rate'] - 0.02, 0.01, 0.35)
        high_prepay_prob = prepay_model.predict_proba(df_high_prepay[self.features])[:, 1].mean()
        
        # Segment-level analysis (by term_months) on Base vs Adverse Default
        segment_analysis = ""
        for term in sorted(df_base['term_months'].unique()):
            mask_base = df_base['term_months'] == term
            mask_adverse = df_adverse['term_months'] == term
            
            base_mean = df_base.loc[mask_base, 'prob_default'].mean()
            adverse_mean = default_model.predict_proba(df_adverse.loc[mask_adverse, self.features])[:, 1].mean()
            
            segment_analysis += f"- **Term {term} months:** Base Default Risk = {base_mean:.2%}, Adverse Risk = {adverse_mean:.2%}\n"
        
        report_content = f"""# Scenario Analysis Report

## 1. Portfolio-Level Scenarios

| Scenario | Average Default Probability | Average Prepayment Probability |
|---|---|---|
| **Base Case** | {base_default_prob:.2%} | {base_prepay_prob:.2%} |
| **Adverse Credit** (Credit scores -50) | {adverse_default_prob:.2%} | N/A |
| **High Prepayment** (Interest rates -2%) | N/A | {high_prepay_prob:.2%} |

## 2. Segment-Level Analysis (Adverse Credit Impact by Loan Term)

{segment_analysis}
"""
        with open(os.path.join(self.report_dir, "Scenario_Report.md"), "w") as f:
            f.write(report_content)
            
        print("Scenario Analysis Completed. Report saved.")

if __name__ == "__main__":
    analyzer = ScenarioAnalyzer()
    analyzer.run()
