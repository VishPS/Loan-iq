import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import os
import json

# Setup page configuration
st.set_page_config(
    page_title="LoanIQ Intelligence Engine",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Premium Fintech Aesthetics
st.markdown("""
<style>
    .metric-card {
        background-color: #1e1e1e;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        text-align: center;
        border: 1px solid #333;
    }
    .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: #4CAF50;
    }
    .metric-label {
        font-size: 1rem;
        color: #aaaaaa;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .warning-box {
        background-color: #ff4b4b20;
        border-left: 4px solid #ff4b4b;
        padding: 15px;
        margin-bottom: 20px;
    }
</style>
""", unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# Data Loading (Cached)
# ------------------------------------------------------------------------------
@st.cache_data
def load_data(filepath):
    if os.path.exists(filepath):
        return pd.read_csv(filepath, low_memory=False)
    return pd.DataFrame()

@st.cache_data
def read_markdown(filepath):
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            return f.read()
    return "Report not available."

# Load core datasets safely
df_val = load_data("outputs/val.csv")
df_anom = load_data("outputs/anomalies/anomaly_scores.csv")
df_top_anom = load_data("outputs/anomalies/top_20_anomalies.csv")
df_metrics = load_data("outputs/metrics/model_comparison.csv")
df_scenario_summary = load_data("outputs/scenarios/scenario_summary.csv")
df_scenario_segment = load_data("outputs/scenarios/segment_impacts.csv")

# ------------------------------------------------------------------------------
# Sidebar Navigation
# ------------------------------------------------------------------------------
st.sidebar.image("https://cdn-icons-png.flaticon.com/512/2621/2621040.png", width=60)
st.sidebar.title("LoanIQ System")
st.sidebar.markdown("---")

pages = [
    "Executive Dashboard",
    "Data Intelligence",
    "Risk Prediction",
    "Loan Explorer",
    "Anomaly Detection",
    "Scenario Analysis",
    "Explainability",
    "AI Reviewer Copilot",
    "Model Performance",
    "AI Development Log"
]
selected_page = st.sidebar.radio("Navigation", pages)
st.sidebar.markdown("---")
st.sidebar.info("Powered by XGBoost, SHAP, & Gemini")

# ------------------------------------------------------------------------------
# 1. Executive Dashboard
# ------------------------------------------------------------------------------
if selected_page == "Executive Dashboard":
    st.title("Executive Dashboard")
    st.markdown("Real-time portfolio intelligence and aggregate risk metrics.")
    
    if not df_val.empty and not df_anom.empty:
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.markdown(f'<div class="metric-card"><div class="metric-value">{len(df_val):,}</div><div class="metric-label">Total Validated Loans</div></div>', unsafe_allow_html=True)
        with col2:
            high_risk = len(df_anom[df_anom['composite_anomaly_score'] > 50])
            st.markdown(f'<div class="metric-card"><div class="metric-value" style="color: #FF5722;">{high_risk:,}</div><div class="metric-label">High-Risk / Anomalous</div></div>', unsafe_allow_html=True)
        with col3:
            avg_dq = df_val['data_quality_score'].mean() if 'data_quality_score' in df_val else 100.0
            st.markdown(f'<div class="metric-card"><div class="metric-value" style="color: #2196F3;">{avg_dq:.1f}</div><div class="metric-label">Avg Data Quality Score</div></div>', unsafe_allow_html=True)
        with col4:
            def_rate = df_val['next_12m_default_flag'].mean() * 100 if 'next_12m_default_flag' in df_val else 0.0
            st.markdown(f'<div class="metric-card"><div class="metric-value" style="color: #FF9800;">{def_rate:.2f}%</div><div class="metric-label">Projected Default Rate</div></div>', unsafe_allow_html=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        with c1:
            st.subheader("Risk Distribution")
            fig = px.pie(df_anom, names='exception_required', title="Exception Required", hole=0.4, color_discrete_sequence=['#4CAF50', '#FF5722'])
            st.plotly_chart(fig, use_container_width=True)
        with c2:
            st.subheader("Data Quality Distribution")
            if 'data_quality_score' in df_val:
                fig2 = px.histogram(df_val, x='data_quality_score', nbins=20, title="Data Quality Scores", color_discrete_sequence=['#2196F3'])
                st.plotly_chart(fig2, use_container_width=True)
            else:
                st.info("Data quality score missing.")
    else:
        st.warning("Data not available.")

# ------------------------------------------------------------------------------
# 2. Data Intelligence
# ------------------------------------------------------------------------------
elif selected_page == "Data Intelligence":
    st.title("Data Intelligence & Profiling")
    report = read_markdown("reports/data_intelligence_report.md")
    st.markdown(report)

# ------------------------------------------------------------------------------
# 3. Risk Prediction
# ------------------------------------------------------------------------------
elif selected_page == "Risk Prediction":
    st.title("Model Predictions & Risk Bands")
    
    # Check for prediction probabilities
    if os.path.exists("outputs/predictions/xgb_next_3m_delinquency_flag_val_preds.csv"):
        df_pred = pd.read_csv("outputs/predictions/xgb_next_3m_delinquency_flag_val_preds.csv")
        st.subheader("Delinquency Risk Distribution")
        fig = px.histogram(df_pred, x='predict_proba', color='actual', title="Predicted Probability vs Actual (Next 3M Delinquency)", nbins=30, barmode="overlay", opacity=0.7)
        st.plotly_chart(fig, use_container_width=True)
        
        st.subheader("Risk Bands (Delinquency)")
        df_pred['Risk Band'] = pd.cut(df_pred['predict_proba'], bins=[0, 0.2, 0.5, 1.0], labels=['Low', 'Medium', 'High'])
        band_counts = df_pred['Risk Band'].value_counts().reset_index()
        fig2 = px.bar(band_counts, x='Risk Band', y='count', title="Loans by Risk Band", color='Risk Band', color_discrete_map={'Low': '#4CAF50', 'Medium': '#FF9800', 'High': '#FF5722'})
        st.plotly_chart(fig2, use_container_width=True)
    else:
        st.warning("Prediction artifacts not found.")

# ------------------------------------------------------------------------------
# 4. Loan Explorer
# ------------------------------------------------------------------------------
elif selected_page == "Loan Explorer":
    st.title("Interactive Loan Explorer")
    if not df_anom.empty:
        loans = df_anom['loan_id'].astype(str).tolist()
        selected_loan = st.selectbox("Select Loan ID", loans)
        
        loan_anom = df_anom[df_anom['loan_id'].astype(str) == selected_loan].iloc[0]
        
        c1, c2, c3 = st.columns(3)
        c1.metric("Composite Anomaly Score", f"{loan_anom.get('composite_anomaly_score', 0):.2f}")
        c2.metric("Exception Required", str(loan_anom.get('exception_required', False)))
        c3.metric("Rule Violations", str(loan_anom.get('triggered_rules', 'None')))
        
        if not df_val.empty:
            loan_feat = df_val[df_val['loan_id'].astype(str) == selected_loan]
            if not loan_feat.empty:
                st.subheader("Raw Loan Attributes")
                st.dataframe(loan_feat.T, use_container_width=True)
                
        st.info("To generate an AI reviewer note for this loan, please visit the AI Reviewer Copilot page.")
    else:
        st.warning("Loan data not available.")

# ------------------------------------------------------------------------------
# 5. Anomaly Detection
# ------------------------------------------------------------------------------
elif selected_page == "Anomaly Detection":
    st.title("Anomaly & Exception Engine")
    report = read_markdown("reports/anomaly_report.md")
    st.markdown(report)
    
    st.subheader("Top 20 Anomalous Loans")
    if not df_top_anom.empty:
        st.dataframe(df_top_anom, use_container_width=True)
        fig = px.bar(df_top_anom, x='loan_id', y='composite_anomaly_score', title="Highest Anomaly Scores", color='composite_anomaly_score', color_continuous_scale='Reds')
        fig.update_xaxes(type='category')
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.warning("Anomaly rankings not available.")

# ------------------------------------------------------------------------------
# 6. Scenario Analysis
# ------------------------------------------------------------------------------
elif selected_page == "Scenario Analysis":
    st.title("Stress Testing & Scenario Analysis")
    report = read_markdown("reports/scenario_report.md")
    st.markdown(report)
    
    if not df_scenario_summary.empty:
        st.subheader("Portfolio Scenario Impacts")
        st.dataframe(df_scenario_summary, use_container_width=True)
        
    if not df_scenario_segment.empty:
        st.subheader("Segment Level Impacts")
        st.dataframe(df_scenario_segment, use_container_width=True)

# ------------------------------------------------------------------------------
# 7. Explainability
# ------------------------------------------------------------------------------
elif selected_page == "Explainability":
    st.title("Model Explainability (SHAP)")
    report = read_markdown("reports/explainability_report.md")
    st.markdown(report)
    
    st.subheader("Global SHAP Summaries")
    c1, c2 = st.columns(2)
    with c1:
        if os.path.exists("outputs/explainability/next_3m_delinquency_flag_shap_summary.png"):
            st.image("outputs/explainability/next_3m_delinquency_flag_shap_summary.png", caption="Delinquency Drivers")
    with c2:
        if os.path.exists("outputs/explainability/next_12m_prepayment_flag_shap_summary.png"):
            st.image("outputs/explainability/next_12m_prepayment_flag_shap_summary.png", caption="Prepayment Drivers")

# ------------------------------------------------------------------------------
# 8. AI Reviewer Copilot
# ------------------------------------------------------------------------------
elif selected_page == "AI Reviewer Copilot":
    st.title("AI Reviewer Copilot")
    st.markdown("Generates grounded natural language reviewer notes based exclusively on ML outputs.")
    
    try:
        import sys
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
        from copilot import ReviewerCopilot
        copilot = ReviewerCopilot()
        HAS_COPILOT = True
    except Exception as e:
        st.error(f"Failed to load Copilot: {e}")
        HAS_COPILOT = False

    if HAS_COPILOT and not df_anom.empty:
        loans = df_anom['loan_id'].astype(str).tolist()
        selected_loan = st.selectbox("Select Loan ID to Review", loans)
        
        if st.button("Generate Reviewer Note", type="primary"):
            with st.spinner("Analyzing ML Context & Querying Gemini..."):
                try:
                    summary = copilot.reviewer_summary(selected_loan)
                    st.markdown('<div class="warning-box">', unsafe_allow_html=True)
                    st.markdown("### Copilot Analysis")
                    st.markdown(summary)
                    st.markdown('</div>', unsafe_allow_html=True)
                except Exception as e:
                    st.error(f"Error generating note: {e}")
                    
        st.markdown("---")
        st.subheader("Lookup Field Definition")
        field = st.text_input("Enter a field name (e.g. DTI, bal_change_3m):")
        if st.button("Lookup"):
            with st.spinner("Retrieving from Data Dictionary..."):
                ans = copilot.lookup_field(field)
                st.info(ans)
    else:
        st.warning("Copilot system or data unavailable.")

# ------------------------------------------------------------------------------
# 9. Model Performance
# ------------------------------------------------------------------------------
elif selected_page == "Model Performance":
    st.title("Model Performance Metrics")
    report = read_markdown("reports/model_card.md")
    st.markdown(report)
    
    st.subheader("Quantitative Evaluation")
    if not df_metrics.empty:
        st.dataframe(df_metrics.style.background_gradient(cmap='viridis', subset=['ROC-AUC', 'PR-AUC', 'F1']), use_container_width=True)
    else:
        st.warning("Metrics table not found.")

# ------------------------------------------------------------------------------
# 10. AI Development Log
# ------------------------------------------------------------------------------
elif selected_page == "AI Development Log":
    st.title("AI Development Log")
    report = read_markdown("reports/AI_Development_Log.md")
    st.markdown(report)
