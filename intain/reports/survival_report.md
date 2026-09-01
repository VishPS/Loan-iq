# Time-to-Event State Transition Approximation

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

| current_state   |   CURRENT |    30_DPD |    60_DPD |   90_PLUS |   DEFAULT |    PREPAID |
|:----------------|----------:|----------:|----------:|----------:|----------:|-----------:|
| CURRENT         | 0.981481  | 0.0138889 | 0         |  0        | 0         | 0.00462963 |
| 30_DPD          | 0.222222  | 0.388889  | 0.388889  |  0        | 0         | 0          |
| 60_DPD          | 0         | 0.222222  | 0.111111  |  0.555556 | 0.111111  | 0          |
| 90_PLUS         | 0.0405405 | 0         | 0.0135135 |  0.932432 | 0.0135135 | 0          |
| DEFAULT         | 0         | 0         | 0         |  0        | 1         | 0          |
| PREPAID         | 0         | 0         | 0         |  0        | 0         | 1          |

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

|   Month |   CURRENT |     30_DPD |     60_DPD |    90_PLUS |   DEFAULT |   PREPAID |
|--------:|----------:|-----------:|-----------:|-----------:|----------:|----------:|
|       0 |  0.375    | 0          | 0          | 0          |  0.25     |  0.375    |
|       1 |  0.368056 | 0.00520833 | 0          | 0          |  0.25     |  0.376736 |
|       2 |  0.362397 | 0.00713735 | 0.00202546 | 0          |  0.25     |  0.37844  |
|       3 |  0.357272 | 0.00825903 | 0.00300069 | 0.00112526 |  0.250225 |  0.380118 |
|       4 |  0.352537 | 0.00884078 | 0.00356046 | 0.00271627 |  0.250574 |  0.381772 |
|       5 |  0.348083 | 0.00912564 | 0.00387039 | 0.00451078 |  0.251006 |  0.383404 |
|       6 |  0.343848 | 0.00924344 | 0.00403986 | 0.00635621 |  0.251497 |  0.385015 |
|       7 |  0.339792 | 0.00926808 | 0.00412944 | 0.00817111 |  0.252032 |  0.386607 |
|       8 |  0.335891 | 0.00924124 | 0.0041735  | 0.00991314 |  0.252601 |  0.38818  |
|       9 |  0.332126 | 0.00918641 | 0.0041915  | 0.0115619  |  0.253199 |  0.389736 |
|      10 |  0.328486 | 0.0091168  | 0.00419446 | 0.0131093  |  0.253821 |  0.391273 |
|      11 |  0.32496  | 0.00903982 | 0.00418863 | 0.0145538  |  0.254464 |  0.392794 |
|      12 |  0.321541 | 0.00895963 | 0.00417756 | 0.0158975  |  0.255126 |  0.394298 |
