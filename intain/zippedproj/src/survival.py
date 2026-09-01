import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import yaml

class SurvivalTransitionModel:
    def __init__(self, features_path="outputs/features.csv"):
        self.features_path = features_path
        self.output_dir = "outputs/survival/"
        self.report_path = "reports/survival_report.md"
        
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(os.path.dirname(self.report_path), exist_ok=True)
        
        self.states = ['CURRENT', '30_DPD', '60_DPD', '90_PLUS', 'DEFAULT', 'PREPAID']
        
    def load_data(self):
        print(f"Loading features from {self.features_path}...")
        self.df = pd.read_csv(self.features_path, low_memory=False)
        self.df['reporting_date_dt'] = pd.to_datetime(self.df['reporting_date_dt'])
        self.df = self.df.sort_values(by=['loan_id', 'reporting_date_dt'])
        
    def define_states(self):
        print("Defining longitudinal states...")
        
        def map_state(row):
            zb_code = row['zero_balance_code']
            dpd = row['dpd']
            
            if zb_code in [3, 6, 9]:
                return 'DEFAULT'
            elif zb_code == 1:
                return 'PREPAID'
            elif dpd == 0:
                return 'CURRENT'
            elif dpd <= 30:
                return '30_DPD'
            elif dpd <= 60:
                return '60_DPD'
            else:
                return '90_PLUS'
                
        self.df['current_state'] = self.df.apply(map_state, axis=1)
        
        # Calculate next state
        grouped = self.df.groupby('loan_id')
        self.df['next_state'] = grouped['current_state'].shift(-1)
        
        # Drop rows where next_state is unknown (the last month of observation for active loans)
        # Note: Loans that transition to DEFAULT/PREPAID will naturally have their last observation 
        # dropped because there is no 'next' month, but we want the transition TO that state.
        # Actually, if a loan hits DEFAULT in month T, its current_state in T is DEFAULT. 
        # But we need transitions. 
        # Let's restructure: We care about current -> next.
        # If month T is DEFAULT, then next month T+1 is also DEFAULT (absorbing).
        
    def build_transition_matrix(self):
        print("Building empirical transition matrix...")
        
        # Filter to valid transitions
        transitions = self.df.dropna(subset=['next_state'])
        
        # Cross tabulate
        counts = pd.crosstab(transitions['current_state'], transitions['next_state'])
        
        # Ensure all states are in index and columns
        for state in self.states:
            if state not in counts.index:
                counts.loc[state] = 0
            if state not in counts.columns:
                counts[state] = 0
                
        # Reorder
        counts = counts.loc[self.states, self.states]
        
        # Force absorbing states
        counts.loc['DEFAULT', :] = 0
        counts.loc['DEFAULT', 'DEFAULT'] = 1
        
        counts.loc['PREPAID', :] = 0
        counts.loc['PREPAID', 'PREPAID'] = 1
        
        # Convert to probabilities
        self.transition_matrix = counts.div(counts.sum(axis=1), axis=0).fillna(0)
        
        # Handle zero-sum rows (if any active states had no transitions, which happens in tiny datasets)
        # Apply tiny epsilon to allow smooth projections
        for i, row in self.transition_matrix.iterrows():
            if row.sum() == 0:
                # If a state was never observed, default to staying in that state
                self.transition_matrix.loc[i, i] = 1.0
                
        print("Transition Matrix:")
        print(self.transition_matrix)
        self.transition_matrix.to_csv(os.path.join(self.output_dir, "transition_matrix.csv"))
        
    def project_portfolio(self, months=12):
        print(f"Projecting portfolio for {months} months...")
        
        # Get the latest state of each active loan
        # Active means it didn't hit an absorbing state yet
        latest = self.df.groupby('loan_id').last()
        
        # Starting distribution
        state_counts = latest['current_state'].value_counts()
        total_loans = len(latest)
        
        dist = np.array([state_counts.get(s, 0) for s in self.states], dtype=float)
        dist = dist / total_loans if total_loans > 0 else dist
        
        projections = []
        projections.append({'Month': 0, **{s: dist[i] for i, s in enumerate(self.states)}})
        
        trans_mat = self.transition_matrix.values
        
        current_dist = dist
        for m in range(1, months + 1):
            current_dist = current_dist.dot(trans_mat)
            projections.append({'Month': m, **{s: current_dist[i] for i, s in enumerate(self.states)}})
            
        self.proj_df = pd.DataFrame(projections)
        self.proj_df.to_csv(os.path.join(self.output_dir, "state_projection.csv"), index=False)
        
        # Cumulative event curves
        event_curves = self.proj_df[['Month', 'DEFAULT', 'PREPAID']]
        event_curves.to_csv(os.path.join(self.output_dir, "event_curves.csv"), index=False)
        
    def generate_report(self):
        print("Generating survival report...")
        
        md = """# Time-to-Event State Transition Approximation

## 1. Objective and Methodology
To accommodate hackathon time constraints and provide high transparency, this module implements an **empirical discrete-time Markov transition model** instead of a complex continuous-time competing risks survival package (e.g., Fine-Gray or Cox Proportional Hazards). 

The model tracks loan movement across defined delinquency buckets, extracting hazard approximations directly from the observed state-transition probabilities.

## 2. Defined States
- **CURRENT:** Zero Days Past Due (DPD)
- **30_DPD:** 1 to 30 Days Past Due
- **60_DPD:** 31 to 60 Days Past Due
- **90_PLUS:** 61+ Days Past Due
- **DEFAULT:** Terminal state (Zero Balance Codes 3, 6, 9)
- **PREPAID:** Terminal state (Zero Balance Code 1)

## 3. Transition Matrix
The empirical probabilities $P(S_{t+1} = j | S_t = i)$ calculated from the dataset:

"""
        md += self.transition_matrix.to_markdown()
        
        md += """

### Hazard Interpretation
The probabilities in the `DEFAULT` and `PREPAID` columns for non-absorbing rows explicitly represent the **monthly empirical hazard rates**. 
- `DEFAULT` and `PREPAID` are enforced as **absorbing states** (probability of remaining in them is 1.0).

## 4. Censoring Assumptions & Limitations
### Right-Censoring Assumptions
- Loans that reach the end of the observation window without hitting an absorbing state are **right-censored**. 
- **Assumption:** This transition matrix relies on the Markov property, assuming censoring is independent of the future state trajectory. Consequently, the projected long-term hazard reflects the *historical average transition rate*, which may bias extrapolations if recent unobserved macroeconomic conditions significantly differ from the training window.

### System Limitations
- **Not a Full Survival Model:** This is a localized Markov approximation. It does not control for dynamic covariates over time (e.g., changes in LTV) dynamically within the equation, nor does it yield a partial likelihood function like a traditional competing-risks survival model. 
- **Small Sample Artifacts:** In constrained datasets, missing paths (e.g., jumping from `CURRENT` directly to `DEFAULT`) will falsely register a 0.0 hazard probability.

## 5. 12-Month Portfolio Projection
Projecting the current active portfolio distribution forward 12 months using the transition matrix:

"""
        md += self.proj_df.to_markdown(index=False)
        md += "\n"
        
        with open(self.report_path, "w") as f:
            f.write(md)

    def run(self):
        self.load_data()
        self.define_states()
        self.build_transition_matrix()
        self.project_portfolio()
        self.generate_report()
        print("Survival transition modeling complete.")

if __name__ == "__main__":
    stm = SurvivalTransitionModel()
    stm.run()
