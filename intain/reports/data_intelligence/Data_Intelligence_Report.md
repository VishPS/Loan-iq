# Data Intelligence and Profiling Report

## 1. Executive Summary
- Total Records (Distinct Loans): 400
- Batch Data Quality Score: **99.12 / 100**

## 2. Missing-Value Analysis
```json
{}
```
*Action:* Missing values were imputed using column medians or rows were dropped if critical.

## 3. Outlier Detection
```json
{
  "loan_amount_outliers_count": 50
}
```
*Action:* Loan amount outliers were capped using the IQR method.

## 4. Invalid Date & Cross-Column Relationship Checks
```json
{
  "future_origination_dates": 0,
  "invalid_dti_gt_1": 0
}
```
*Action:* Future dates capped to current date. DTI capped at 1.0.

## 5. Train/Test Drift Detection
```json
{
  "interest_rate_drift": {
    "train_mean": 0.04951518246840576,
    "test_mean": 0.049831221968596046,
    "drift_detected": false
  }
}
```

## 6. Data Quality Scores
- Batch Score: 99.12
- Lowest Record Score: 80.0
- Records below 80: 0
