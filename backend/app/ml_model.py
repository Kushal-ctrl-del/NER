import numpy as np
from sklearn.linear_model import LogisticRegression
import pickle
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")

def train_synthetic_model():
    # Features: [rainfall_mm_last_24h, rainfall_mm_last_72h, days_since_last_report, prior_report_count]
    # Label: 1 (disruption), 0 (no disruption)
    
    # Generate synthetic data based on heuristics
    np.random.seed(42)
    n_samples = 500
    
    X = []
    y = []
    
    for _ in range(n_samples):
        r_24h = np.random.exponential(scale=20) # mostly low rainfall, some high
        r_72h = r_24h + np.random.exponential(scale=40)
        days_since = np.random.uniform(0, 365)
        prior_reports = np.random.poisson(lam=1)
        
        # Heuristic: High rainfall or many prior reports increases chance of disruption
        risk_score = (r_72h / 100.0) + (prior_reports * 0.5) - (days_since / 365.0)
        prob = 1 / (1 + np.exp(-(risk_score - 1.5))) # sigmoid
        
        label = 1 if np.random.rand() < prob else 0
        
        X.append([r_24h, r_72h, days_since, prior_reports])
        y.append(label)
        
    X = np.array(X)
    y = np.array(y)
    
    clf = LogisticRegression(class_weight='balanced')
    clf.fit(X, y)
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(clf, f)
        
    print(f"Model trained and saved to {MODEL_PATH}")
    print("Coefficients:", clf.coef_)
    print("Intercept:", clf.intercept_)

if __name__ == "__main__":
    train_synthetic_model()
