import subprocess
import sys
import time
import os
import json
import pandas as pd

def ensure_directories():
    print("Creating required directories...")
    dirs = [
        "data",
        "models",
        "outputs",
        "outputs/metrics",
        "outputs/predictions",
        "outputs/survival",
        "outputs/anomalies",
        "outputs/scenarios",
        "outputs/explainability",
        "reports",
        "logs"
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    print("Directories created.")

def run_step(step_name, script_path):
    print(f"\n========================================================")
    print(f"Executing: {step_name}")
    print(f"========================================================")
    start_time = time.time()
    
    result = subprocess.run([sys.executable, script_path])
    
    if result.returncode != 0:
        print(f"\n[ERROR] Pipeline failed at {step_name}.")
        sys.exit(1)
        
    print(f"[SUCCESS] {step_name} completed in {time.time() - start_time:.2f} seconds.")

def print_final_summary():
    print("\n\n========================================================")
    print("LOANIQ INTELLIGENCE ENGINE - FINAL PIPELINE SUMMARY")
    print("========================================================")
    
    # 1. Data Quality
    try:
        val = pd.read_csv("outputs/val.csv")
        dq = val['data_quality_score'].mean()
        print(f"Data Quality:\n - Portfolio Average DQ Score: {dq:.1f}/100")
    except Exception:
        print("Data Quality:\n - Not available")
        
    print()
    
    # Metrics
    try:
        with open("outputs/metrics/metrics.json", "r") as f:
            metrics = json.load(f)
            
        # 2. Delinquency Model
        delinq = metrics.get('next_3m_delinquency_flag_XGBoost', {})
        print(f"Delinquency Model:\n - ROC-AUC: {delinq.get('roc_auc', 'N/A')}\n - PR-AUC: {delinq.get('pr_auc', 'N/A')}")
        
        print()
        
        # 3. Default Model
        # Wait, next_12m_default was unmodeled in some constraints, print None/N/A
        dfult = metrics.get('next_12m_default_flag_XGBoost', {})
        if dfult:
            print(f"Default Model:\n - ROC-AUC: {dfult.get('roc_auc', 'N/A')}")
        else:
            print(f"Default Model:\n - Metric unavailable due to class scarcity.")
            
        print()
        
        # 4. Prepayment Model
        prep = metrics.get('next_12m_prepayment_flag_LogisticRegression', {})
        print(f"Prepayment Model (Baseline):\n - ROC-AUC: {prep.get('roc_auc', 'N/A')}\n - F1 Score: {prep.get('f1', 'N/A')}")
    except Exception:
        print("Metrics unavailable")
        
    print()
    
    # 5. Anomaly Detection
    try:
        anom = pd.read_csv("outputs/anomalies/anomaly_scores.csv")
        high_risk = len(anom[anom['composite_anomaly_score'] > 50])
        print(f"Anomaly Detection:\n - Total High-Risk Exceptions Flagged: {high_risk}")
    except Exception:
        print("Anomaly Detection:\n - Not available")
        
    print()
    
    # 6. Scenario Simulation
    try:
        scen = pd.read_csv("outputs/scenarios/scenario_summary.csv")
        print(f"Scenario Simulation:\n - Base Delinquency Prob: {scen.iloc[0]['Base_Prob']:.4f}\n - Adverse Credit Delinquency Prob: {scen.iloc[0]['Stressed_Prob']:.4f}")
    except Exception:
        print("Scenario Simulation:\n - Not available")
        
    print()
    
    # 7. Submission
    try:
        sub = pd.read_csv("submission.csv")
        print(f"Submission:\n - Total Validated Submission Rows Generated: {len(sub)}")
    except Exception:
        print("Submission:\n - Not available")
        
    print("========================================================\n")

def main():
    print("========================================================")
    print("[START] Initializing LoanIQ End-to-End Data Intelligence Pipeline")
    print("========================================================\n")
    
    ensure_directories()
    
    pipeline_steps = [
        ("1. Data Profiling", "src/profiling.py"),
        ("2. Data Validation", "src/validation.py"),
        ("3. Feature Engineering", "src/features.py"),
        ("4. Target Construction", "src/targets.py"),
        ("5. XGBoost Model Training", "src/train.py"),
        ("6. Evaluation & Metrics", "src/evaluate.py"),
        ("7. Survival / Transition Model", "src/survival.py"),
        ("8. Anomaly & Exception Detection", "src/anomaly.py"),
        ("9. Scenario Simulation", "src/scenarios.py"),
        ("10. SHAP Explainability", "src/explainability.py"),
        ("11. Final Submission Generation", "src/submission.py"),
        ("12. Copilot Reports Generation", "src/copilot.py")
    ]
    
    total_start = time.time()
    for step_name, script_path in pipeline_steps:
        if os.path.exists(script_path):
            run_step(step_name, script_path)
        else:
            print(f"[ERROR] Script {script_path} not found. Failing loudly.")
            sys.exit(1)
        
    print_final_summary()
    
    print(f"\n[DONE] Pipeline Completed Successfully in {time.time() - total_start:.2f} seconds!")
    print(f"You can now launch the dashboard by running: streamlit run dashboard/app.py\n")

if __name__ == "__main__":
    main()
