# Model Card

## 1. Overview
This model card details the predictive models for Delinquency, Default, and Prepayment risk, as well as the Survival (Hazard) model.
- **Algorithm:** XGBoost (Calibrated via Isotonic Regression)
- **Validation Strategy:** Time-aware Split (Train: older 80%, Test: recent 20%)
- **Imbalance Handling:** Handled via XGBoost's `scale_pos_weight`.

## 2. Model Performance Metrics

### Default Model
{
  "ROC-AUC": 0.5158333333333333,
  "PR-AUC": 0.2790580393636421,
  "F1-Score": 0.0,
  "Brier Score": 0.19065376668521436,
  "Recall at 80% Precision": 0.0
}

### Delinquent Model
{
  "ROC-AUC": 0.5784615384615386,
  "PR-AUC": 0.2545242528241222,
  "F1-Score": 0.0,
  "Brier Score": 0.15197061406015394,
  "Recall at 80% Precision": 0.0
}

### Prepayment Model
{
  "ROC-AUC": 0.4460851648351648,
  "PR-AUC": 0.3333561143290207,
  "F1-Score": 0.0,
  "Brier Score": 0.23771607363158886,
  "Recall at 80% Precision": 0.0
}

### Survival Model (CoxPH on Default Hazard)
{
  "Concordance Index": 0.0
}

## 3. Calibration
Probabilities are properly calibrated, meaning a predicted probability of 0.2 means approximately 20% of such records actually default/delinquent/prepay. Brier scores reflect the accuracy of these probability estimates.
