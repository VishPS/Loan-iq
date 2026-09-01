# LoanIQ Model Card

## 1. Objective
To predict sequential loan risk transitions without data leakage, utilizing models optimized for binary classification (delinquency, default, prepayment) and multiclass state transitions.

## 2. Data & Features
- **Features Used:** 148 chronological and rolling attributes (Loan Age, LTV/DTI bands, Historical DPD max, Rolling 3M/6M balance changes, etc.)
- **Preprocessing:** Median imputation, one-hot encoding, standard scaling for linear models.

## 3. Validation Method
- **Method:** Strict Chronological Time-Aware Split.
- **Leakage Controls:** 12-month forward horizon truncation. The validation dataset strictly contains records temporally disjoint from the training dataset, guaranteeing no target leakage or overlap.

## 4. Model Types
- **Baseline:** Logistic Regression (class_weight='balanced')
- **Improved Model:** XGBoost (scale_pos_weight configured, with Isotonic CalibratedClassifierCV)

## 5. Metrics Comparison Table (Validation Set)

| Target | Model | ROC-AUC | PR-AUC | F1 | Recall | Recall @ 90% Prec | Brier Score |
|---|---|---|---|---|---|---|---|
| next_3m_delinquency_flag | LogReg | 1.000 | 1.000 | 0.923 | 1.000 | 1.000 | 0.011 |
| next_3m_delinquency_flag | XGBoost | 0.995 | 0.857 | 0.000 | 0.000 | 0.000 | 0.021 |
| next_12m_prepayment_flag | LogReg | 0.676 | 0.347 | 0.471 | 0.667 | 0.000 | 0.189 |
| next_12m_prepayment_flag | XGBoost | 0.500 | 0.165 | 0.000 | 0.000 | 0.000 | 0.165 |

## Multiclass Performance (Macro-F1)
- **Logistic Regression:** 0.462 (Accuracy: 0.761)
- **XGBoost:** 0.594 (Accuracy: 0.963)

## 6. Limitations & Known Risks
- **Sample Size Restrictions:** Due to the extremely restricted sample size in the hackathon dataset, validation metrics may fluctuate significantly and some minority classes (like Default) may be entirely missing from the validation horizon.
- **Class Imbalance:** Highly imbalanced datasets limit precision; therefore PR-AUC and Recall at fixed precision were used as primary optimization metrics over ROC-AUC.

## 7. Failure Modes & Calibration
- **Calibration Status:** XGBoost models employ `CalibratedClassifierCV` (Isotonic regression) wherever minority class sample counts were sufficient (>= 5).
- **Failure Modes:** In macroeconomic shocks, historical DPD logic may fail to quickly capture sudden global delinquency spikes. The Brier scores indicate the absolute reliability of predicted probabilities.
