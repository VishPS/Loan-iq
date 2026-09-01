# LoanIQ Data Intelligence & Validation Report

## 1. Executive Summary
- **Total Time-Series Records Analyzed:** 757
- **Batch Data Quality Score:** 100.00 / 100

## 2. Validation Issues Detected
No validation issues detected.

## 3. Train vs Test Drift (PSI)
| feature               |   psi | drift_status   |
|:----------------------|------:|:---------------|
| borrower_credit_score |   nan | No Drift       |
| dti                   |   nan | No Drift       |
| orig_ltv              |   nan | No Drift       |

## 4. Anomalous Records
The top 20 problematic records (with the lowest Data Quality scores) have been exported to `outputs/profiling/top_anomalous_records.csv` for human review.