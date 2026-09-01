import pandas as pd
import numpy as np
import os
import joblib
import plotly.express as px
import plotly.graph_objects as go
import yaml
import warnings
warnings.filterwarnings('ignore')

class ScenarioEngine:
    def __init__(self):
        self.val_path = "outputs/val.csv"
        self.raw_data_path = "data/sf-loan-performance-data-sample.csv"
        self.config_path = "config/macro_scenarios.csv"
        self.model_dir = "models/"
        self.out_dir = "outputs/scenarios/"
        self.report_path = "reports/scenario_report.md"
        
        os.makedirs(self.out_dir, exist_ok=True)
        os.makedirs(os.path.dirname(self.report_path), exist_ok=True)
        
        self.features = [
            'orig_interest_rate', 'current_interest_rate', 'orig_upb', 'current_upb', 
            'orig_loan_term', 'loan_age', 'remaining_months_to_maturity', 'orig_ltv', 
            'dti', 'borrower_credit_score', 'balance_to_orig_ratio', 'interest_rate_diff', 
            'credit_score_band', 'ltv_band', 'dti_band', 'dpd', 'hist_delinquent_flag', 
            'dpd_rolling_3m_max', 'dpd_rolling_6m_max', 'max_hist_dpd', 'cum_delinquency_months', 
            'bal_change_1m', 'bal_change_3m', 'is_modified', 'cum_modifications', 
            'status_transitions', 'vintage_year', 'servicer_code', 'missing_dti', 
            'missing_ltv', 'missing_credit', 'data_quality_score', 'risk_interaction_ltv_dti', 
            'risk_interaction_cs_ltv'
        ]
        
    def load_data_and_models(self):
        print("Loading validation data and models...")
        self.df = pd.read_csv(self.val_path)
        
        # We need the 'State' column from raw data for segmentation
        raw = pd.read_csv(self.raw_data_path, sep='|', header=None, low_memory=False)
        raw_state_map = raw[[1, 30]].drop_duplicates().set_index(1)[30].to_dict()
        self.df['state'] = self.df['loan_id'].map(raw_state_map).fillna('UNKNOWN')
        
        self.scenarios = pd.read_csv(self.config_path).to_dict('records')
        
        # Load XGBoost Models (use Logistic Regression if XGBoost missing)
        self.models = {}
        for target in ['next_3m_delinquency_flag', 'next_12m_default_flag', 'next_12m_prepayment_flag']:
            xgb_path = os.path.join(self.model_dir, f"xgb_{target}.joblib")
            if os.path.exists(xgb_path):
                self.models[target] = joblib.load(xgb_path)
            else:
                lr_path = os.path.join(self.model_dir, f"lr_{target}.joblib")
                if os.path.exists(lr_path):
                    self.models[target] = joblib.load(lr_path)
                else:
                    self.models[target] = None
                    print(f"Warning: No model found for {target}")

    def run_scenarios(self):
        print("Executing stress scenarios...")
        
        self.results_df = self.df.copy()
        
        for sc in self.scenarios:
            name = sc['scenario_name']
            cs_adj = sc['credit_score_adjustment']
            ir_adj = sc['interest_rate_adjustment']
            
            # Apply adjustments to a shallow copy
            stressed_X = self.df[self.features].copy()
            stressed_X['borrower_credit_score'] += cs_adj
            stressed_X['current_interest_rate'] += ir_adj
            stressed_X['interest_rate_diff'] = stressed_X['current_interest_rate'] - stressed_X['orig_interest_rate']
            
            # Recalculate interaction features and bands
            stressed_X['credit_score_band'] = pd.cut(stressed_X['borrower_credit_score'], bins=[0, 620, 680, 740, 9999], labels=[0, 1, 2, 3]).astype(float)
            stressed_X['risk_interaction_cs_ltv'] = stressed_X['borrower_credit_score'] / (stressed_X['orig_ltv'] + 1)
            
            # Predict
            for target in ['next_3m_delinquency_flag', 'next_12m_default_flag', 'next_12m_prepayment_flag']:
                if self.models[target] is not None:
                    # Imputer in pipeline handles any newly created NaNs
                    probs = self.models[target].predict_proba(stressed_X)[:, 1]
                    self.results_df[f"{name}_{target}_prob"] = probs
                    
    def analyze_impacts(self):
        print("Calculating absolute and relative impacts...")
        
        impacts = []
        portfolio_summary = []
        
        targets = ['next_3m_delinquency_flag', 'next_12m_default_flag', 'next_12m_prepayment_flag']
        
        # Portfolio Summary
        for target in targets:
            if self.models[target] is None:
                continue
                
            base_mean = self.results_df[f"Base_{target}_prob"].mean()
            for sc in self.scenarios:
                if sc['scenario_name'] == 'Base':
                    continue
                    
                sc_name = sc['scenario_name']
                sc_mean = self.results_df[f"{sc_name}_{target}_prob"].mean()
                
                abs_change = sc_mean - base_mean
                rel_change = (abs_change / base_mean * 100) if base_mean > 0 else 0
                
                portfolio_summary.append({
                    'Scenario': sc_name,
                    'Target': target,
                    'Base_Prob': base_mean,
                    'Stressed_Prob': sc_mean,
                    'Absolute_Change': abs_change,
                    'Relative_Change_Pct': rel_change
                })
                
        self.summary_df = pd.DataFrame(portfolio_summary)
        self.summary_df.to_csv(os.path.join(self.out_dir, "scenario_summary.csv"), index=False)
        
        # Segment Impacts
        segments = ['credit_score_band', 'ltv_band', 'vintage_year', 'state', 'servicer_code']
        segment_results = []
        
        for seg in segments:
            grouped = self.results_df.groupby(seg)
            for target in targets:
                if self.models[target] is None:
                    continue
                
                for sc in self.scenarios:
                    if sc['scenario_name'] == 'Base':
                        continue
                        
                    sc_name = sc['scenario_name']
                    
                    base_mean = grouped[f"Base_{target}_prob"].mean()
                    sc_mean = grouped[f"{sc_name}_{target}_prob"].mean()
                    
                    abs_change = sc_mean - base_mean
                    
                    for idx in abs_change.index:
                        segment_results.append({
                            'Segment_Type': seg,
                            'Segment_Value': idx,
                            'Scenario': sc_name,
                            'Target': target,
                            'Absolute_Change': abs_change[idx]
                        })
                        
        self.segment_df = pd.DataFrame(segment_results)
        self.segment_df.to_csv(os.path.join(self.out_dir, "segment_impacts.csv"), index=False)
        
    def create_visualizations(self):
        print("Generating Plotly visualisations...")
        if len(self.summary_df) == 0:
            return
            
        fig = px.bar(
            self.summary_df, 
            x='Target', y='Relative_Change_Pct', color='Scenario', 
            barmode='group', title="Relative Stress Impact on Expected Probabilities (%)"
        )
        fig.write_html(os.path.join(self.out_dir, "scenario_chart.html"))
        
    def generate_report(self):
        print("Generating Scenario Report...")
        md = """# Stress Simulation & Scenario Analysis Report

> [!WARNING]
> **Stress Simulations, Not Economic Forecasts**
> The scenarios modeled below represent hypothetical macroeconomic shocks applied to the active portfolio to test resilience. They are explicitly NOT economic forecasts or predictive certainties.

## 1. Scenario Definitions
The following macroeconomic shocks were mathematically injected into the validated features:
"""
        md += pd.DataFrame(self.scenarios).to_markdown(index=False)
        
        md += """

## 2. Portfolio Scenario Summary
Comparing the portfolio-level average predicted probability of transition across scenarios:

"""
        if hasattr(self, 'summary_df') and len(self.summary_df) > 0:
            md += self.summary_df.to_markdown(index=False)
        else:
            md += "No summary data generated."
            
        md += """

## 3. Segment Sensitivities
The top 10 most severely impacted segments (Absolute Probability Change) across all scenarios:

"""
        if hasattr(self, 'segment_df') and len(self.segment_df) > 0:
            top_segments = self.segment_df.sort_values(by='Absolute_Change', ascending=False).head(10)
            md += top_segments.to_markdown(index=False)
        else:
            md += "No segment data generated."
            
        md += """

## 4. Visualizations
Interactive Plotly visualizations detailing relative percentage shifts have been exported to `outputs/scenarios/scenario_chart.html`.
"""
        with open(self.report_path, "w") as f:
            f.write(md)

    def run(self):
        self.load_data_and_models()
        self.run_scenarios()
        self.analyze_impacts()
        self.create_visualizations()
        self.generate_report()
        print("Scenario analysis complete.")

if __name__ == "__main__":
    eng = ScenarioEngine()
    eng.run()
