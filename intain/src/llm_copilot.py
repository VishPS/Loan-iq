import pandas as pd
import numpy as np
import yaml
import os
import json
from datetime import datetime
import google.generativeai as genai

class LLMCopilot:
    def __init__(self, config_path="config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
            
        self.report_dir = self.config['reports']['base_dir']
        os.makedirs(self.report_dir, exist_ok=True)
        self.log_file = os.path.join(self.report_dir, "AI_Development_Log.md")
        
        # Initialize log file with a header if it doesn't exist
        if not os.path.exists(self.log_file):
            with open(self.log_file, "w") as f:
                f.write("# AI Development & LLM Interaction Log\n\n")
        
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-pro')
            self.has_key = True
        else:
            self.has_key = False
            print("WARNING: GEMINI_API_KEY not found. Using mock LLM responses.")

    def log_interaction(self, prompt, response, model_name):
        timestamp = datetime.now().isoformat()
        log_entry = f"""
## Interaction at {timestamp}
- **Model:** {model_name}
- **Prompt:**
> {prompt.replace(chr(10), chr(10) + '> ')}
- **Response:**
{response}

---
"""
        with open(self.log_file, "a") as f:
            f.write(log_entry)
            
    def analyze_anomaly(self, anomaly_record):
        # Grounded context
        context = json.dumps(anomaly_record, indent=2)
        prompt = f"""
        You are a financial risk AI Copilot. Review the following anomalous loan record.
        Provide a brief analysis of why this record is risky based on its features.
        
        CRITICAL INSTRUCTION: Your output MUST clearly state that it is a "Recommendation Only - Not a Final Decision" and should be used by human reviewers as guidance.
        
        Record Data:
        {context}
        """
        
        if self.has_key:
            try:
                response = self.model.generate_content(prompt)
                output = response.text
                model_used = 'gemini-1.5-pro'
            except Exception as e:
                output = f"Error calling Gemini API: {str(e)}\n\n[RECOMMENDATION ONLY - NOT A DECISION]"
                model_used = 'gemini-error'
        else:
            output = "[RECOMMENDATION ONLY - NOT A DECISION]\nBased on the data, the borrower has unusual financial metrics requiring manual review."
            model_used = 'mock-llm'
            
        # Ensure policy enforcement just in case the model misses it
        if "recommendation" not in output.lower() or "decision" not in output.lower():
            output += "\n\n**Policy Enforcement:** This is a Recommendation Only - Not a Final Decision."
            
        self.log_interaction(prompt, output, model_used)
        return output
        
    def run(self):
        # For demonstration, we'll run it on the top anomaly
        anomalies_path = os.path.join(self.report_dir, "anomalies", "top_20_anomalies.csv")
        if os.path.exists(anomalies_path):
            df = pd.read_csv(anomalies_path)
            top_record = df.iloc[0].to_dict()
            print("Running LLM Copilot on top anomaly...")
            analysis = self.analyze_anomaly(top_record)
            print("LLM Copilot Analysis complete. See AI_Development_Log.md")
        else:
            print("No anomalies found to analyze.")

if __name__ == "__main__":
    copilot = LLMCopilot()
    copilot.run()
