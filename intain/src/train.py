import pandas as pd
import numpy as np
import os
import joblib
import mlflow
import mlflow.sklearn
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.utils.class_weight import compute_class_weight
import warnings
warnings.filterwarnings('ignore')

class ModelTrainer:
    def __init__(self):
        self.train_path = "outputs/train.csv"
        self.model_dir = "models/"
        os.makedirs(self.model_dir, exist_ok=True)
        mlflow.set_tracking_uri("sqlite:///mlruns.db")
        mlflow.set_experiment("LoanIQ_Supervised_Models")
        
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
        
        self.binary_targets = [
            'next_3m_delinquency_flag',
            'next_12m_default_flag',
            'next_12m_prepayment_flag'
        ]
        self.multiclass_target = 'next_state'
        
    def load_data(self):
        print("Loading training data...")
        self.df = pd.read_csv(self.train_path)
        # Drop rows where target is NaN
        self.df_clean = self.df.dropna(subset=self.binary_targets + [self.multiclass_target])
        self.X_train = self.df_clean[self.features]
        
    def train_binary_models(self):
        print("Training Binary Classification Models...")
        for target in self.binary_targets:
            y_train = self.df_clean[target]
            
            if len(y_train.unique()) < 2:
                print(f"Skipping {target} due to only one class present in training data.")
                continue
                
            class_weights = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
            weight_dict = {i: w for i, w in zip(np.unique(y_train), class_weights)}
            pos_weight = weight_dict.get(1, 1.0) / weight_dict.get(0, 1.0)
            
            # Logistic Regression Baseline
            with mlflow.start_run(run_name=f"LogReg_{target}"):
                lr_pipeline = Pipeline([
                    ('imputer', SimpleImputer(strategy='median')),
                    ('scaler', StandardScaler()),
                    ('clf', LogisticRegression(class_weight='balanced', random_state=42, max_iter=1000))
                ])
                
                lr_pipeline.fit(self.X_train, y_train)
                
                # MLflow tracking
                mlflow.log_param("model_type", "LogisticRegression")
                mlflow.log_param("target", target)
                mlflow.log_param("features_count", len(self.features))
                
                joblib.dump(lr_pipeline, os.path.join(self.model_dir, f"lr_{target}.joblib"))
                
            # XGBoost Improved Model
            with mlflow.start_run(run_name=f"XGB_{target}"):
                xgb_pipeline = Pipeline([
                    ('imputer', SimpleImputer(strategy='median')),
                    ('clf', XGBClassifier(scale_pos_weight=pos_weight, random_state=42, n_estimators=100, max_depth=4))
                ])
                
                xgb_pipeline.fit(self.X_train, y_train)
                
                # Calibration
                # Fallback to prefit if samples are too small for CV
                min_class_samples = y_train.value_counts().min()
                if min_class_samples >= 5:
                    print(f"Calibrating XGBoost for {target} with Isotonic Regression (CV=5)...")
                    calibrated_xgb = CalibratedClassifierCV(xgb_pipeline, method='isotonic', cv=5)
                    calibrated_xgb.fit(self.X_train, y_train)
                    final_model = calibrated_xgb
                    mlflow.log_param("calibration", "isotonic_cv5")
                else:
                    print(f"Warning: Only {min_class_samples} samples for minority class in {target}. Using uncalibrated model.")
                    final_model = xgb_pipeline
                    mlflow.log_param("calibration", "none_due_to_small_sample")
                
                mlflow.log_param("model_type", "XGBoost")
                mlflow.log_param("target", target)
                
                joblib.dump(final_model, os.path.join(self.model_dir, f"xgb_{target}.joblib"))
                
    def train_multiclass_model(self):
        print(f"Training Multiclass Model for {self.multiclass_target}...")
        y_train = self.df_clean[self.multiclass_target]
        
        # Map strings to int for XGBoost
        from sklearn.preprocessing import LabelEncoder
        self.le = LabelEncoder()
        y_train_encoded = self.le.fit_transform(y_train)
        joblib.dump(self.le, os.path.join(self.model_dir, f"label_encoder_{self.multiclass_target}.joblib"))
        
        # Logistic Regression Baseline
        with mlflow.start_run(run_name=f"LogReg_{self.multiclass_target}"):
            lr_pipeline = Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler()),
                ('clf', LogisticRegression(class_weight='balanced', random_state=42, max_iter=1000, multi_class='multinomial'))
            ])
            lr_pipeline.fit(self.X_train, y_train_encoded)
            mlflow.log_param("model_type", "LogisticRegression_Multiclass")
            joblib.dump(lr_pipeline, os.path.join(self.model_dir, f"lr_{self.multiclass_target}.joblib"))
            
        # XGBoost Multiclass
        with mlflow.start_run(run_name=f"XGB_{self.multiclass_target}"):
            xgb_pipeline = Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('clf', XGBClassifier(objective='multi:softprob', num_class=len(self.le.classes_), random_state=42, n_estimators=100))
            ])
            xgb_pipeline.fit(self.X_train, y_train_encoded)
            mlflow.log_param("model_type", "XGBoost_Multiclass")
            
            # Calibration usually binary, skip explicit multicalib for hackathon unless OneVsRest
            joblib.dump(xgb_pipeline, os.path.join(self.model_dir, f"xgb_{self.multiclass_target}.joblib"))

    def run(self):
        self.load_data()
        self.train_binary_models()
        self.train_multiclass_model()
        print("Training complete. Models saved to models/")

if __name__ == "__main__":
    trainer = ModelTrainer()
    trainer.run()
