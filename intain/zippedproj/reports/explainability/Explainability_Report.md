# Explainability Report

## 1. SHAP Global Feature Importance
The top drivers for Default risk according to the XGBoost model:

| Feature                 |   SHAP Importance |
|:------------------------|------------------:|
| interest_rate           |        1.02916    |
| loan_amount             |        0.836811   |
| credit_score            |        0.116013   |
| ltv                     |        0.0234934  |
| employment_length_years |        0.0106669  |
| term_months             |        0.0101712  |
| dti                     |        0.00857376 |
| annual_income           |        0.00644626 |

## 2. Local Explainability Example (Record Index 209)

| Feature                 |          Value |   SHAP Impact |
|:------------------------|---------------:|--------------:|
| loan_amount             | 302055         |   -0.645261   |
| interest_rate           |      0.0499395 |   -1.8261     |
| term_months             |    360         |   -0.00457055 |
| credit_score            |    710         |    0.0017609  |
| dti                     |      0.54      |    0.00355042 |
| ltv                     |      0.74      |    0.0120226  |
| employment_length_years |      2         |   -0.0389537  |
| annual_income           | 382716         |   -0.00437734 |

## 3. Model Confidence / Uncertainty
- **Average Confidence Score:** 46.53% (Scale 0-1, where 1 is highest confidence)
- **Low Confidence Records (Score < 0.2):** 43

## 4. False-Positive and False-Negative Analysis (Threshold 0.5)
- **False Positives:** 0
- **False Negatives:** 100

### Average Profile of False Positives
*(Model thought they would default, but they didn't)*

```json
{}
```

### Average Profile of False Negatives
*(Model thought they were safe, but they defaulted)*

```json
{
  "loan_amount": 171880.16260368173,
  "interest_rate": 0.049422672966150855,
  "term_months": 322.8,
  "credit_score": 732.34,
  "dti": 0.3441999999999999,
  "ltv": 0.7250999999999999,
  "employment_length_years": 3.21,
  "annual_income": 195602.3774114405
}
```
