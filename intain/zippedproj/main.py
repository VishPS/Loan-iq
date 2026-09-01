import os
import subprocess
import shutil
import yaml

def load_config():
    with open("config/config.yaml", "r") as f:
        return yaml.safe_load(f)

def run_script(script_path):
    print(f"--- Running {script_path} ---")
    result = subprocess.run(["python", script_path], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error running {script_path}:")
        print(result.stderr)
        raise RuntimeError(f"Pipeline failed at {script_path}")
    else:
        print(result.stdout)

def main():
    scripts = [
        "src/data_pipeline.py",
        "src/model_training.py",
        "src/anomaly_detection.py",
        "src/scenario_analysis.py",
        "src/explainability.py",
        "src/llm_copilot.py"
    ]
    
    for script in scripts:
        run_script(script)
        
    print("--- Generating submission.csv ---")
    config = load_config()
    processed_path = config['data']['processed_path']
    submission_path = config['outputs']['submission_file']
    
    os.makedirs(os.path.dirname(submission_path), exist_ok=True)
    shutil.copy(processed_path, submission_path)
    print(f"Copied {processed_path} to {submission_path}")
    
    print("--- End-to-End Pipeline Completed ---")
    print("To view the dashboard, run: streamlit run dashboard/app.py")
    
if __name__ == "__main__":
    main()
