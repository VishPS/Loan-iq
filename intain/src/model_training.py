import pandas as pd
import numpy as np
import yaml
import os
import json
import joblib
from xgboost import XGBClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    roc_auc_score, average_precision_score, f1_score,
    precision_recall_curve, brier_score_loss, confusion_matrix
)
from lifelines import CoxPHFitter
import warnings
warnings.filterwarnings('ignore')

class ModelTrainer:
    def __init__(self, config_path="config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
            
        self.processed_data_path = self.config['data']['processed_path']
        self.models_dir = self.config['models']['save_dir']
        self.report_dir = os.path.join(self.config['reports']['base_dir'], "model_cards")
        
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.report_dir, exist_ok=True)
        
        self.features = [
            'loan_amount', 'interest_rate', 'term_months', 'credit_score', 
            'dti', 'ltv', 'employment_length_years', 'annual_income'
        ]
        
    def load_and_split_data(self):
        self.df = pd.read_csv(self.processed_data_path)
        self.df['origination_date'] = pd.to_datetime(self.df['origination_date'])
        
        # Time-aware validation split
        self.df = self.df.sort_values(by='origination_date')
        train_size = int(len(self.df) * 0.8)
        
        self.train_df = self.df.iloc[:train_size]
        self.test_df = self.df.iloc[train_size:]
        
        self.X_train = self.train_df[self.features]
        self.X_test = self.test_df[self.features]
        
    def get_recall_at_precision(self, y_true, y_prob, target_precision=0.8):
        precisions, recalls, thresholds = precision_recall_curve(y_true, y_prob)
        # find the recall where precision is just >= target_precision
        valid_idx = np.where(precisions >= target_precision)[0]
        if len(valid_idx) > 0:
            return float(recalls[valid_idx[0]])
        return 0.0
        
    def train_and_evaluate_target(self, target_class, target_name):
        # Create binary target
        y_train = (self.train_df['status'] == target_class).astype(int)
        y_test = (self.test_df['status'] == target_class).astype(int)
        
        # Handle class imbalance
        pos_weight = (len(y_train) - y_train.sum()) / y_train.sum() if y_train.sum() > 0 else 1.0
        
        # Base XGBoost
        xgb_params = self.config['models']['xgboost_params'].copy()
        xgb_params['scale_pos_weight'] = pos_weight
        base_xgb = XGBClassifier(**xgb_params)
        
        # Calibration
        calibrated_clf = CalibratedClassifierCV(estimator=base_xgb, method='isotonic', cv=3)
        calibrated_clf.fit(self.X_train, y_train)
        
        # Predictions
        y_prob = calibrated_clf.predict_proba(self.X_test)[:, 1]
        y_pred = calibrated_clf.predict(self.X_test)
        
        # Metrics
        roc_auc = roc_auc_score(y_test, y_prob)
        pr_auc = average_precision_score(y_test, y_prob)
        f1 = f1_score(y_test, y_pred)
        brier = brier_score_loss(y_test, y_prob)
        recall_at_prec = self.get_recall_at_precision(y_test, y_prob, target_precision=0.8)
        
        metrics = {
            'ROC-AUC': float(roc_auc),
            'PR-AUC': float(pr_auc),
            'F1-Score': float(f1),
            'Brier Score': float(brier),
            'Recall at 80% Precision': float(recall_at_prec)
        }
        
        # Save model
        joblib.dump(calibrated_clf, os.path.join(self.models_dir, f"{target_name}_model.pkl"))
        
        # Save predictions on full dataset for downstream tasks
        full_prob = calibrated_clf.predict_proba(self.df[self.features])[:, 1]
        self.df[f'prob_{target_name}'] = full_prob
        
        return metrics

    def train_survival_model(self):
        # We will model the hazard of 'Default'.
        # Duration: term_months
        # Event: 1 if Default, 0 otherwise
        surv_df = self.train_df[self.features + ['status']].copy()
        surv_df['event'] = (surv_df['status'] == 'Default').astype(int)
        
        cph = CoxPHFitter(penalizer=0.1)
        # drop status as it's not a feature
        surv_df = surv_df.drop(columns=['status'])
        
        try:
            cph.fit(surv_df, duration_col='term_months', event_col='event', show_progress=False)
            concordance = cph.concordance_index_
            cph.to_pickle(os.path.join(self.models_dir, "cox_survival_model.pkl"))
            return {'Concordance Index': float(concordance)}
        except Exception as e:
            print(f"Survival model fitting failed: {e}")
            return {'Concordance Index': 0.0}

    def generate_model_card(self, all_metrics):
        report_content = f"""# Model Card

## 1. Overview
This model card details the predictive models for Delinquency, Default, and Prepayment risk, as well as the Survival (Hazard) model.
- **Algorithm:** XGBoost (Calibrated via Isotonic Regression)
- **Validation Strategy:** Time-aware Split (Train: older 80%, Test: recent 20%)
- **Imbalance Handling:** Handled via XGBoost's `scale_pos_weight`.

## 2. Model Performance Metrics

### Default Model
{json.dumps(all_metrics['Default'], indent=2)}

### Delinquent Model
{json.dumps(all_metrics['Delinquent'], indent=2)}

### Prepayment Model
{json.dumps(all_metrics['Prepaid'], indent=2)}

### Survival Model (CoxPH on Default Hazard)
{json.dumps(all_metrics['Survival'], indent=2)}

## 3. Calibration
Probabilities are properly calibrated, meaning a predicted probability of 0.2 means approximately 20% of such records actually default/delinquent/prepay. Brier scores reflect the accuracy of these probability estimates.
"""
        with open(os.path.join(self.report_dir, "Model_Card.md"), "w") as f:
            f.write(report_content)

    def run(self):
        print("Starting Model Training...")
        self.load_and_split_data()
        
        metrics_dict = {}
        
        print("Training Default Model...")
        metrics_dict['Default'] = self.train_and_evaluate_target('Default', 'default')
        
        print("Training Delinquent Model...")
        metrics_dict['Delinquent'] = self.train_and_evaluate_target('Delinquent', 'delinquent')
        
        print("Training Prepayment Model...")
        metrics_dict['Prepaid'] = self.train_and_evaluate_target('Prepaid', 'prepaid')
        
        print("Training Survival Model...")
        metrics_dict['Survival'] = self.train_survival_model()
        
        print("Generating Model Card...")
        self.generate_model_card(metrics_dict)
        
        # Save updated df with predictions
        self.df.to_csv(self.processed_data_path, index=False)
        print("Model Training Completed. Predictions saved and Model Card generated.")

if __name__ == "__main__":
    trainer = ModelTrainer()
    trainer.run()
