import pandas as pd
import numpy as np
import random
import uuid
from datetime import datetime, timedelta
import yaml

def load_config():
    with open("config/config.yaml", "r") as f:
        return yaml.safe_load(f)

def generate_synthetic_data(num_samples: int = 10000, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    random.seed(seed)
    
    # 1. Base Features
    loan_ids = [str(uuid.uuid4()) for _ in range(num_samples)]
    
    # Random origination dates within the last 5 years
    base_date = datetime(2021, 1, 1)
    origination_dates = [base_date + timedelta(days=random.randint(0, 1800)) for _ in range(num_samples)]
    
    loan_amounts = np.random.lognormal(mean=np.log(15000), sigma=0.5, size=num_samples)
    loan_amounts = np.clip(loan_amounts, 1000, 100000)
    
    credit_scores = np.random.normal(loc=700, scale=50, size=num_samples)
    credit_scores = np.clip(credit_scores, 300, 850).astype(int)
    
    dtis = np.random.normal(loc=0.30, scale=0.10, size=num_samples)
    dtis = np.clip(dtis, 0.05, 0.65)
    
    ltvs = np.random.normal(loc=0.80, scale=0.15, size=num_samples)
    ltvs = np.clip(ltvs, 0.20, 1.20) # Allows for slightly underwater properties
    
    terms = np.random.choice([36, 60, 120, 360], size=num_samples, p=[0.4, 0.4, 0.1, 0.1])
    
    annual_incomes = np.random.lognormal(mean=np.log(60000), sigma=0.6, size=num_samples)
    annual_incomes = np.clip(annual_incomes, 15000, 500000)
    
    employment_lengths = np.random.choice([0, 1, 2, 3, 5, 10], size=num_samples, p=[0.1, 0.1, 0.2, 0.2, 0.2, 0.2])
    
    purposes = np.random.choice(['debt_consolidation', 'credit_card', 'home_improvement', 'other', 'major_purchase'], size=num_samples)
    
    # Base Interest Rate based on Credit Score
    interest_rates = 0.20 - ((credit_scores - 300) / 550) * 0.15
    # Add noise based on term and amount
    interest_rates += (terms / 360) * 0.02 + np.random.normal(0, 0.01, size=num_samples)
    interest_rates = np.clip(interest_rates, 0.03, 0.35)
    
    # 2. Correlated Target Generation
    # Calculate hidden risk score
    risk_score = (
        (850 - credit_scores) / 550 * 0.4 +
        (dtis / 0.65) * 0.3 +
        (ltvs / 1.2) * 0.2 +
        (interest_rates / 0.35) * 0.1
    )
    
    # Base probabilities
    p_default = risk_score * 0.15
    p_delinquent = risk_score * 0.25
    p_prepay = (credit_scores / 850) * 0.1 - (interest_rates * 0.1)
    
    # Clip probabilities
    p_default = np.clip(p_default, 0.01, 0.4)
    p_delinquent = np.clip(p_delinquent, 0.02, 0.5)
    p_prepay = np.clip(p_prepay, 0.01, 0.3)
    
    # Assign Status (mutually exclusive for simplicity in this dataset)
    statuses = []
    for i in range(num_samples):
        rand_val = random.random()
        if rand_val < p_default[i]:
            statuses.append('Default')
        elif rand_val < (p_default[i] + p_delinquent[i]):
            statuses.append('Delinquent')
        elif rand_val < (p_default[i] + p_delinquent[i] + p_prepay[i]):
            statuses.append('Prepaid')
        else:
            statuses.append('Current')
            
    # 3. Create DataFrame
    df = pd.DataFrame({
        'loan_id': loan_ids,
        'origination_date': origination_dates,
        'loan_amount': loan_amounts,
        'interest_rate': interest_rates,
        'term_months': terms,
        'credit_score': credit_scores,
        'dti': dtis,
        'ltv': ltvs,
        'employment_length_years': employment_lengths,
        'annual_income': annual_incomes,
        'loan_purpose': purposes,
        'status': statuses
    })
    
    # 4. Inject Anomalies for Hackathon Requirements
    # Requirement: Missing-value analysis
    missing_indices = np.random.choice(df.index, size=int(num_samples * 0.05), replace=False)
    df.loc[missing_indices, 'employment_length_years'] = np.nan
    
    missing_indices_dti = np.random.choice(df.index, size=int(num_samples * 0.02), replace=False)
    df.loc[missing_indices_dti, 'dti'] = np.nan
    
    # Requirement: Outlier detection
    outlier_indices = np.random.choice(df.index, size=int(num_samples * 0.01), replace=False)
    df.loc[outlier_indices, 'annual_income'] = df.loc[outlier_indices, 'annual_income'] * 10
    
    # Requirement: Invalid date and cross-column relationship checks
    # Inject future dates
    future_date_indices = np.random.choice(df.index, size=int(num_samples * 0.005), replace=False)
    df.loc[future_date_indices, 'origination_date'] = datetime(2028, 1, 1)
    
    # Inject invalid cross-column: DTI > 1.0 but high credit score (logical anomaly)
    cross_col_indices = np.random.choice(df.index, size=int(num_samples * 0.005), replace=False)
    df.loc[cross_col_indices, 'dti'] = 1.5
    df.loc[cross_col_indices, 'credit_score'] = 800
    
    # Simulate Train/Test Drift Feature
    # We'll make 'interest_rate' drift over time.
    # Older loans have lower interest rates on average.
    # We will handle this naturally since dates are random, but let's artificially shift it for later dates
    recent_mask = df['origination_date'] > datetime(2024, 1, 1)
    df.loc[recent_mask, 'interest_rate'] = df.loc[recent_mask, 'interest_rate'] + 0.05
    
    return df

if __name__ == "__main__":
    import os
    config = load_config()
    os.makedirs(os.path.dirname(config['data']['synthetic_path']), exist_ok=True)
    print("Generating synthetic data...")
    df = generate_synthetic_data(num_samples=config['data']['num_samples'], seed=config['project']['seed'])
    df.to_csv(config['data']['synthetic_path'], index=False)
    print(f"Generated {len(df)} records and saved to {config['data']['synthetic_path']}")
