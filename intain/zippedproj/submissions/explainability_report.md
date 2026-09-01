# Machine Learning Explainability & Audit Report

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
The module exposes an `explain_loan(loan_id)` function. Below is the exact output for loan **100023020488**:

```json
{
    "loan_id": "100023020488",
    "target": "next_3m_delinquency_flag",
    "predicted_probability": 0.011122380197048188,
    "risk_level": "Low",
    "top_5_drivers": [
        {
            "feature": "orig_ltv",
            "value": 55.0,
            "direction": "Decreases Risk (Protective)",
            "impact_magnitude": 2.009060859680176
        },
        {
            "feature": "dpd_rolling_3m_max",
            "value": 0.0,
            "direction": "Decreases Risk (Protective)",
            "impact_magnitude": 1.3144506216049194
        },
        {
            "feature": "dpd",
            "value": 0.0,
            "direction": "Decreases Risk (Protective)",
            "impact_magnitude": 1.013778805732727
        },
        {
            "feature": "borrower_credit_score",
            "value": 714.0,
            "direction": "Increases Risk",
            "impact_magnitude": 0.5750170946121216
        },
        {
            "feature": "orig_upb",
            "value": 55000.0,
            "direction": "Increases Risk",
            "impact_magnitude": 0.5270920395851135
        }
    ],
    "calibration_info": "Model Global Brier Score: 0.020136752403447197",
    "disclaimer": "DISCLAIMER: This explanation is algorithmically generated via SHAP values derived directly from the trained XGBoost model. It represents mathematical feature attribution, not a definitive human or causal decision."
}
```

> [!WARNING]
> DISCLAIMER: This explanation is algorithmically generated via SHAP values derived directly from the trained XGBoost model. It represents mathematical feature attribution, not a definitive human or causal decision.
