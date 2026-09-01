# Anomaly Detection Report

## 1. Overview
Used Isolation Forest to detect multivariate record-level anomalies in the processed loan dataset.

## 2. Results
- **Total Records Analyzed:** 400
- **Anomalies Detected:** 4 (Contamination set to 1%)
- **Top Exception Types:**

| exception_type                 |   count |
|:-------------------------------|--------:|
| High variance in interest_rate |       2 |
| High variance in term_months   |       1 |
| High variance in dti           |       1 |

## 3. Reviewer-Ready Examples
The top 20 most anomalous records have been extracted and saved to `top_20_anomalies.csv` for human review. Each record includes an `exception_probability` and an `exception_type` denoting the primary feature contributing to the anomaly.
