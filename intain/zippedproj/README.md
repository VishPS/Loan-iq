# LoanIQ Data Intelligence Engine

## Project Overview
LoanIQ is an advanced, end-to-end mortgage intelligence platform designed for the Data Intelligence Hackathon. It processes historical loan performance data to deliver predictive risk scores, deterministic anomaly detection, transparent mathematical explainability, and a fully guarded GenAI Reviewer Copilot.

## Architecture
The system is divided into sequential, highly decoupled modules:
1. **Profiling & Validation (`src/profiling.py`, `src/validation.py`):** Parses raw CSVs to flag systemic anomalies, relationship violations, and generate Data Quality scores.
2. **Feature Engineering (`src/features.py`, `src/targets.py`):** Constructs chronological rolling metrics (e.g., `dpd_rolling_3m_max`) perfectly insulated from future data leakage.
3. **ML Prediction (`src/train.py`, `src/evaluate.py`):** Trains isotonically calibrated XGBoost estimators for multi-horizon risk targets.
4. **Anomaly Engine (`src/anomaly.py`):** Employs Isolation Forests and deterministic rules to rank highly anomalous exception records.
5. **Scenario Stress Engine (`src/scenarios.py`):** Modifies assumptions (e.g., a 50-point FICO drop) to measure deterministic portfolio elasticity.
6. **Explainability (`src/explainability.py`):** Uses SHAP (TreeExplainer) on raw XGBoost estimators to extract localized feature importance.
7. **LLM Copilot (`src/copilot.py`):** Retrieves exact SHAP drivers and anomaly rules to ground Gemini in mathematically verified facts.
8. **Final Aggregation (`src/submission.py`):** Validates and compiles all predictive and prescriptive outputs into the final `submission.csv`.
9. **React Frontend (`frontend/`):** A high-performance presentation layer built with Vite, React, TypeScript, and Shadcn UI for interactive exploration.

## Installation
Requires Python 3.12+.

```bash
pip install pandas numpy scikit-learn xgboost shap
```
*Note: The frontend requires Node.js 18+ and `npm`.*

## Dataset
This pipeline was trained and tested against the `sf-loan-performance-data-sample.csv`. Data is treated as a monthly panel. Missing numeric values are median-imputed, and robust indicator columns (e.g., `missing_dti`) are utilized.

## Evaluation
Out-of-time chronological validation was strictly enforced.
- **Next 3M Delinquency:** Achieved a ROC-AUC of 0.9951 (XGBoost).
- **Model Calibration:** `CalibratedClassifierCV` (Isotonic) was utilized to convert raw logits into actual actionable probabilities.

*View `reports/model_card.md` for extended metrics.*

## LLM Copilot Constraints
The Gemini API integration is strictly a presentation layer. It **does not** generate predictions. It is systematically barred from creating feature importance or calculating anomalies. 

**"We deliberately separated the predictive layer from the generative layer. XGBoost generates the actual risk probabilities, SHAP provides the model explanation, deterministic rules and Isolation Forest generate anomaly intelligence, and Gemini only converts these grounded outputs into reviewer-friendly recommendations."**

## Reproducibility
To regenerate the entire pipeline from scratch, run the master orchestrator command:
```bash
python src/pipeline.py
```

## Demo Instructions
To explore the finalized intelligence artifacts, boot the interactive React dashboard:
```bash
cd frontend
npm install
npm run dev
```
Then open `http://localhost:5173/dashboard` in your browser.

## Limitations
- Due to the limited size of the sample dataset, macro-economic scenarios may exhibit muted aggregate sensitivity.
- The 12-month prepayment targets suffer from significant class imbalance in the training block, resulting in very low Precision/Recall despite acceptable ROC-AUC.
