# Stress Simulation & Scenario Analysis Report

> [!WARNING]
> **Stress Simulations, Not Economic Forecasts**
> The scenarios modeled below represent hypothetical macroeconomic shocks applied to the active portfolio to test resilience. They are explicitly NOT economic forecasts or predictive certainties.

## 1. Scenario Definitions
The following macroeconomic shocks were mathematically injected into the validated features:
| scenario_name   |   credit_score_adjustment |   interest_rate_adjustment |
|:----------------|--------------------------:|---------------------------:|
| Base            |                         0 |                        0   |
| Adverse Credit  |                       -50 |                        0   |
| High Prepayment |                         0 |                       -1.5 |

## 2. Portfolio Scenario Summary
Comparing the portfolio-level average predicted probability of transition across scenarios:

| Scenario        | Target                   |   Base_Prob |   Stressed_Prob |   Absolute_Change |   Relative_Change_Pct |
|:----------------|:-------------------------|------------:|----------------:|------------------:|----------------------:|
| Adverse Credit  | next_3m_delinquency_flag |   0.0457564 |       0.0457765 |       2.01654e-05 |             0.0440712 |
| High Prepayment | next_3m_delinquency_flag |   0.0457564 |       0.0457564 |       0           |             0         |
| Adverse Credit  | next_12m_default_flag    |   0.040865  |       0.0408606 |      -4.43666e-06 |            -0.0108569 |
| High Prepayment | next_12m_default_flag    |   0.040865  |       0.040865  |       0           |             0         |
| Adverse Credit  | next_12m_prepayment_flag |   0         |       0         |       0           |             0         |
| High Prepayment | next_12m_prepayment_flag |   0         |       0         |       0           |             0         |

## 3. Segment Sensitivities
The top 10 most severely impacted segments (Absolute Probability Change) across all scenarios:

| Segment_Type      | Segment_Value   | Scenario        | Target                   |   Absolute_Change |
|:------------------|:----------------|:----------------|:-------------------------|------------------:|
| state             | MN              | Adverse Credit  | next_3m_delinquency_flag |       8.84173e-05 |
| servicer_code     | 3               | Adverse Credit  | next_3m_delinquency_flag |       4.33745e-05 |
| credit_score_band | 3.0             | Adverse Credit  | next_3m_delinquency_flag |       4.33745e-05 |
| ltv_band          | 1.0             | Adverse Credit  | next_3m_delinquency_flag |       2.64236e-05 |
| vintage_year      | 2009            | Adverse Credit  | next_3m_delinquency_flag |       2.01654e-05 |
| credit_score_band | 1.0             | Adverse Credit  | next_3m_delinquency_flag |       0           |
| credit_score_band | 1.0             | Adverse Credit  | next_12m_default_flag    |       0           |
| credit_score_band | 2.0             | Adverse Credit  | next_12m_default_flag    |       0           |
| credit_score_band | 1.0             | High Prepayment | next_12m_default_flag    |       0           |
| credit_score_band | 2.0             | High Prepayment | next_12m_default_flag    |       0           |

## 4. Visualizations
Interactive Plotly visualizations detailing relative percentage shifts have been exported to `outputs/scenarios/scenario_chart.html`.
