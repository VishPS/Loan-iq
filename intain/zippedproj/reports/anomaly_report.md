# LoanIQ Hybrid Anomaly & Exception Intelligence Report

## 1. Objective
To enforce rigorous data integrity and identify structural impossibilities and statistical outliers using a dual-engine approach (Deterministic Business Logic + Machine Learning Isolation Forests).

## 2. Engine Methodology
- **Deterministic Engine:** Scans exactly 9 rigid compliance and logic checks (e.g., *Current UPB > Orig UPB*, *Stale Records*, *Prepayment without Zero Balance*). Records failing these are heavily penalized and flagged as structural errors requiring immediate quarantine.
- **Machine Learning Engine:** Implements an `IsolationForest` (contamination=0.05) across standard normal transformations of primary risk drivers (DTI, LTV, Credit Score, DPD, Balance Change). ML Scores are normalized 0-100.
- **Composite Score:** `(Rule Score * 1.5) + (ML Score * 0.5)`. This ensures absolute priority is given to mathematically broken records.
- **LLM Disclaimer:** **No LLMs were used** to calculate any anomaly score, driver, or violation in this module. All calculations are deterministic math or standard scikit-learn ML.

## 3. Executive Summary
- **Total Records Analyzed:** 757
- **Exceptions Flagged (Required Review):** 17
- **Top Exception Type:** Extreme Statistical Outlier

## 4. Top 20 Anomalous Records
The top 20 problematic records ranked by composite anomaly severity are exported to `outputs/anomalies/top_20_anomalies.csv`.

