import pandas as pd
import numpy as np
import os
import joblib
import shap
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, brier_score_loss
from sklearn.calibration import calibration_curve
import json
import warnings
warnings.filterwarnings('ignore')

class ExplainabilityEngine:
    def __init__(self):
        self.val_path = "outputs/val.csv"
        self.model_dir = "models/"
        self.out_dir = "outputs/explainability/"
        self.report_path = "reports/explainability_report.md"
        
        os.makedirs(self.out_dir, exist_ok=True)
        os.makedirs(os.path.dirname(self.report_path), exist_ok=True)
        
        self.features = [
            'orig_interest_rate', 'current_interest_rate', 'orig_upb', 'current_upb', 
            'orig_loan_term', 'loan_age', 'remaining_months_to_maturity', 'orig_ltv', 
            'dti', 'borrower_credit_score', 'balance_to_orig_ratio', 'interest_rate_diff', 
            'credit_score_band', 'ltv_band', 'dti_band', 'dpd', 'hist_delinquent_flag', 
            'dpd_rolling_3m_max', 'dpd_rolling_6m_max', 'max_hist_dpd', 'cum_delinquency_months', 
            'bal_change_1m', 'bal_change_3m', 'is_modified', 'cum_modifications', 
            'status_transitions', 'vintage_year', 'servicer_code', 'missing_dti', 
            'missing_ltv', 'missing_credit', 'data_quality_score', 'risk_interaction_ltv_dti', 
            'risk_interaction_cs_ltv'
        ]
        self.targets = ['next_3m_delinquency_flag', 'next_12m_default_flag', 'next_12m_prepayment_flag']
        
    def load_data_and_models(self):
        print("Loading validation data and models...")
        self.df = pd.read_csv(self.val_path)
        
        self.X_val = self.df[self.features].copy()
        self.X_val_imputed = self.X_val.fillna(self.X_val.median())
        
        self.models = {}
        for target in self.targets:
            xgb_path = os.path.join(self.model_dir, f"xgb_{target}.joblib")
            if os.path.exists(xgb_path):
                model = joblib.load(xgb_path)
                self.models[target] = model
            else:
                self.models[target] = None
                
    def get_base_xgb_and_data(self, model, X):
        if hasattr(model, 'calibrated_classifiers_'):
            pipeline = model.calibrated_classifiers_[0].estimator
        else:
            pipeline = model
            
        if hasattr(pipeline, 'named_steps'):
            imputer = pipeline.named_steps['imputer']
            clf = pipeline.named_steps['clf']
            X_trans = imputer.transform(X)
            # Find which features were kept
            mask = getattr(imputer, 'indicator_', None)
            if hasattr(imputer, 'statistics_'):
                kept_features = [self.features[i] for i, stat in enumerate(imputer.statistics_) if not np.isnan(stat)]
            else:
                kept_features = self.features
            return clf, X_trans, kept_features
        return pipeline, X.values, self.features

    def run_shap_analysis(self):
        print("Running SHAP analysis...")
        self.shap_values_dict = {}
        self.explainers = {}
        self.kept_features_dict = {}
        self.X_trans_dict = {}
        
        for target in self.targets:
            if self.models[target] is None:
                continue
                
            y_true = self.df[target]
            if y_true.nunique() < 2:
                print(f"Skipping SHAP for {target} (Only 1 class in validation)")
                continue
                
            base_model, X_trans, kept_features = self.get_base_xgb_and_data(self.models[target], self.X_val)
            self.kept_features_dict[target] = kept_features
            self.X_trans_dict[target] = X_trans
            
            try:
                explainer = shap.TreeExplainer(base_model)
                shap_vals = explainer.shap_values(X_trans)
                
                self.shap_values_dict[target] = shap_vals
                self.explainers[target] = explainer
                
                # Global Feature Importance
                mean_abs_shap = np.abs(shap_vals).mean(axis=0)
                fi_df = pd.DataFrame({'Feature': kept_features, 'Mean_Abs_SHAP': mean_abs_shap})
                fi_df = fi_df.sort_values(by='Mean_Abs_SHAP', ascending=False)
                fi_df.to_csv(os.path.join(self.out_dir, f"{target}_global_importance.csv"), index=False)
                
                # SHAP Summary Plot
                plt.figure(figsize=(10, 8))
                shap.summary_plot(shap_vals, X_trans, feature_names=kept_features, show=False)
                plt.tight_layout()
                plt.savefig(os.path.join(self.out_dir, f"{target}_shap_summary.png"), dpi=300)
                plt.close()
                
            except Exception as e:
                print(f"Failed SHAP for {target}: {str(e)}")

    def run_error_analysis(self):
        print("Running Error Analysis & Calibration...")
        for target in self.targets:
            if self.models[target] is None or target not in self.shap_values_dict:
                continue
                
            y_true = self.df[target]
            y_prob = self.models[target].predict_proba(self.X_val_imputed)[:, 1]
            y_pred = (y_prob >= 0.5).astype(int)
            
            # Calibration Curve
            prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=5)
            plt.figure(figsize=(8, 6))
            plt.plot(prob_pred, prob_true, marker='o', label='XGBoost')
            plt.plot([0, 1], [0, 1], linestyle='--', label='Perfect Calibration')
            plt.title(f"Calibration Curve: {target}")
            plt.xlabel("Mean Predicted Probability")
            plt.ylabel("Fraction of Positives")
            plt.legend()
            plt.tight_layout()
            plt.savefig(os.path.join(self.out_dir, f"{target}_calibration.png"), dpi=300)
            plt.close()
            
            # FP and FN
            fp_mask = (y_true == 0) & (y_pred == 1)
            fn_mask = (y_true == 1) & (y_pred == 0)
            
            fp_df = self.df[fp_mask].copy()
            fn_df = self.df[fn_mask].copy()
            
            fp_df.to_csv(os.path.join(self.out_dir, f"{target}_false_positives.csv"), index=False)
            fn_df.to_csv(os.path.join(self.out_dir, f"{target}_false_negatives.csv"), index=False)
            
            # Error by segment
            self.df['error_type'] = 'Correct'
            self.df.loc[fp_mask, 'error_type'] = 'False Positive'
            self.df.loc[fn_mask, 'error_type'] = 'False Negative'
            
            error_segment = self.df.groupby('credit_score_band')['error_type'].value_counts(normalize=True).unstack().fillna(0)
            error_segment.to_csv(os.path.join(self.out_dir, f"{target}_error_by_credit_band.csv"))

    def explain_loan(self, loan_id, target="next_3m_delinquency_flag"):
        if self.models[target] is None or target not in self.shap_values_dict:
            return {"error": f"Model or SHAP not available for {target}"}
            
        loan_idx = self.df.index[self.df['loan_id'] == loan_id].tolist()
        if not loan_idx:
            return {"error": "Loan ID not found in validation set."}
            
        idx = loan_idx[-1] 
        
        prob = self.models[target].predict_proba(self.X_val_imputed.iloc[[idx]])[0, 1]
        shap_vals = self.shap_values_dict[target][idx]
        
        risk_level = "Low"
        if prob > 0.5:
            risk_level = "High"
        elif prob > 0.2:
            risk_level = "Medium"
            
        feature_importance = pd.DataFrame({
            'Feature': self.kept_features_dict[target],
            'SHAP_Value': shap_vals,
            'Actual_Value': self.X_trans_dict[target][idx]
        })
        
        feature_importance['Abs_SHAP'] = np.abs(feature_importance['SHAP_Value'])
        top_5 = feature_importance.sort_values(by='Abs_SHAP', ascending=False).head(5)
        
        drivers = []
        for _, row in top_5.iterrows():
            direction = "Increases Risk" if row['SHAP_Value'] > 0 else "Decreases Risk (Protective)"
            drivers.append({
                "feature": row['Feature'],
                "value": row['Actual_Value'],
                "direction": direction,
                "impact_magnitude": abs(row['SHAP_Value'])
            })
            
        y_true_all = self.df[target].dropna()
        if len(y_true_all) > 1 and len(y_true_all.unique()) > 1:
            all_probs = self.models[target].predict_proba(self.X_val_imputed)[:, 1]
            brier = brier_score_loss(y_true_all, all_probs)
        else:
            brier = "N/A"
            
        return {
            "loan_id": str(loan_id),
            "target": target,
            "predicted_probability": float(prob),
            "risk_level": risk_level,
            "top_5_drivers": drivers,
            "calibration_info": f"Model Global Brier Score: {brier}",
            "disclaimer": "DISCLAIMER: This explanation is algorithmically generated via SHAP values derived directly from the trained XGBoost model. It represents mathematical feature attribution, not a definitive human or causal decision."
        }
        
    def generate_report(self):
        print("Generating Explainability Report...")
        sample_loan = self.df['loan_id'].iloc[0]
        sample_explanation = self.explain_loan(sample_loan)
        
        md = f"""# Machine Learning Explainability & Audit Report

## 1. Objective & Methodology
To provide complete transparency into the XGBoost risk engines without relying on LLM hallucinations, this module systematically extracts the underlying estimators from the `CalibratedClassifierCV` wrappers and calculates exact **SHAP (SHapley Additive exPlanations)** values. 

## 2. Global Feature Importance
Global importance is ranked by the Mean Absolute SHAP value across the entire validation set.
- **SHAP Summary Plots:** Saved as PNGs in `outputs/explainability/` (e.g., `next_3m_delinquency_flag_shap_summary.png`). These plot the distribution of impact every feature has on the model output.

## 3. Calibration & Confidence
The models were calibrated via Isotonic Regression. 
- **Calibration Curves:** Available in `outputs/explainability/`. Perfect calibration occurs when the predicted probability exactly matches the empirical fraction of positives. 
- **Error Analysis:** We identified explicit False Positives and False Negatives, segmenting error rates by `credit_score_band` to detect any systemic bias against lower-credit borrowers.

## 4. Local Explainability (API Demonstration)
The module exposes an `explain_loan(loan_id)` function. Below is the exact output for loan **{sample_loan}**:

```json
{json.dumps(sample_explanation, indent=4)}
```

> [!WARNING]
> {sample_explanation.get('disclaimer', '')}
"""
        with open(self.report_path, "w") as f:
            f.write(md)

    def run(self):
        self.load_data_and_models()
        self.run_shap_analysis()
        self.run_error_analysis()
        self.generate_report()
        print("Explainability analysis complete.")

if __name__ == "__main__":
    eng = ExplainabilityEngine()
    eng.run()
