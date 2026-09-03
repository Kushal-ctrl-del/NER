from fastapi import APIRouter, HTTPException
from app.db import supabase
from app.models import MLRiskPredictionResponse
from uuid import UUID
import pickle
import os
import numpy as np

router = APIRouter(prefix="/ml", tags=["ML Risk"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "app", "risk_model.pkl")

# Load model if exists
clf = None
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as f:
        clf = pickle.load(f)

@router.post("/predict-risk/{segment_id}", response_model=MLRiskPredictionResponse)
def predict_risk(segment_id: UUID):
    res = supabase.table("road_segments").select("*").eq("id", str(segment_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Segment not found")
        
    segment = res.data[0]
    
    reports_res = supabase.table("field_reports").select("id").eq("road_segment_id", str(segment_id)).execute()
    report_count = len(reports_res.data)
    
    # Simulated rainfall data
    r_24h = 45.0
    r_72h = 118.0
    days_since = 5.0
    
    factors = [
        f"rainfall_last_24h: {r_24h}mm",
        f"rainfall_last_72h: {r_72h}mm",
        f"days_since_last_report: {days_since}",
        f"{report_count} prior reports"
    ]
    
    if clf:
        X_input = np.array([[r_24h, r_72h, days_since, report_count]])
        prob = clf.predict_proba(X_input)[0][1] # Probability of class 1
        predicted_risk = "elevated" if prob > 0.5 else "low"
        confidence = round(float(max(prob, 1-prob)), 2)
        
        factors.insert(0, f"ML Probability of Disruption: {prob*100:.1f}%")
    else:
        # Fallback heuristic
        predicted_risk = "elevated" if r_72h > 100 or report_count > 0 else "low"
        confidence = 0.74
        factors.insert(0, "Using fallback heuristic model")
    
    return {
        "segment_id": segment_id,
        "predicted_risk": predicted_risk,
        "confidence": confidence,
        "contributing_factors": factors
    }
