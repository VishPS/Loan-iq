import pandas as pd
import numpy as np
import yaml
import os
import json
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self, config_path="config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
            
        self.processed_data_path = self.config['data']['processed_path']
        self.report_dir = os.path.join(self.config['reports']['base_dir'], "anomalies")
        os.makedirs(self.report_dir, exist_ok=True)
        
        self.features = [
            'loan_amount', 'interest_rate', 'term_months', 'credit_score', 
            'dti', 'ltv', 'employment_length_years', 'annual_income'
        ]
        
    def run(self):
        print("Starting Anomaly Detection...")
        df = pd.read_csv(self.processed_data_path)
        X = df[self.features].copy()
        
        # Train Isolation Forest
        clf = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)
        clf.fit(X)
        
        # Predict anomalies (1 for normal, -1 for anomaly)
        preds = clf.predict(X)
        scores = clf.decision_function(X) # lower is more anomalous
        
        # Exception probability: normalize scores to 0-1 (higher is more anomalous)
        min_score = scores.min()
        max_score = scores.max()
        exception_prob = 1 - ((scores - min_score) / (max_score - min_score))
        
        df['is_anomaly'] = (preds == -1).astype(int)
        df['exception_probability'] = exception_prob
        
        # Exception types
        X_z = (X - X.mean()) / X.std()
        max_z_idx = X_z.abs().idxmax(axis=1)
        df['exception_type'] = "High variance in " + max_z_idx
        
        # Generate 20 reviewer-ready anomalies
        anomalies = df[df['is_anomaly'] == 1].sort_values(by='exception_probability', ascending=False)
        top_20 = anomalies.head(20)
        top_20.to_csv(os.path.join(self.report_dir, "top_20_anomalies.csv"), index=False)
        
        # Save anomalies report
        report_content = f"""# Anomaly Detection Report

## 1. Overview
Used Isolation Forest to detect multivariate record-level anomalies in the processed loan dataset.

## 2. Results
- **Total Records Analyzed:** {len(df)}
- **Anomalies Detected:** {len(anomalies)} (Contamination set to 1%)
- **Top Exception Types:**

{anomalies['exception_type'].value_counts().to_markdown()}

## 3. Reviewer-Ready Examples
The top 20 most anomalous records have been extracted and saved to `top_20_anomalies.csv` for human review. Each record includes an `exception_probability` and an `exception_type` denoting the primary feature contributing to the anomaly.
"""
        with open(os.path.join(self.report_dir, "Anomaly_Report.md"), "w") as f:
            f.write(report_content)
            
        df.to_csv(self.processed_data_path, index=False)
        print("Anomaly Detection Completed. Report and top 20 anomalies saved.")

if __name__ == "__main__":
    detector = AnomalyDetector()
    detector.run()
