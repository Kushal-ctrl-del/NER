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

def calculate_distance(lat1, lon1, lat2, lon2):
    from math import radians, cos, sin, asin, sqrt
    # Haversine formula
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

def min_distance_to_route(lat, lng, coords):
    # coords is a list of [lng, lat]
    min_dist = float('inf')
    for c in coords:
        d = calculate_distance(lat, lng, c[1], c[0])
        if d < min_dist:
            min_dist = d
    return min_dist

@router.get("/bottlenecks")
def get_bottlenecks():
    """
    A segment is a bottleneck if it's at_risk/blocked AND at least one
    active shipment's route passes near it. This is a computed view,
    not a stored table — always reflects current data.
    """
    segments_res = supabase.table("road_segments").select("*").in_(
        "current_status", ["at_risk", "blocked"]
    ).execute()
    shipments_res = supabase.table("shipments").select("*").eq("status", "in_transit").execute()

    PROXIMITY_THRESHOLD_KM = 5.0 # 5 km
    bottlenecks = []
    for seg in segments_res.data:
        affected_shipments = []
        for shipment in shipments_res.data:
            if not shipment.get("route_geojson"):
                continue
            coords = shipment["route_geojson"]
            mid_lat = (seg["start_lat"] + seg["end_lat"]) / 2
            mid_lng = (seg["start_lng"] + seg["end_lng"]) / 2
            if min_distance_to_route(mid_lat, mid_lng, coords) <= PROXIMITY_THRESHOLD_KM:
                affected_shipments.append(shipment["id"])
        if affected_shipments:
            bottlenecks.append({
                "segment_id": seg["id"],
                "segment_name": seg["name"],
                "status": seg["current_status"],
                "risk_score": seg["risk_score"],
                "affected_shipment_count": len(affected_shipments),
                "affected_shipment_ids": affected_shipments,
            })

    return {"bottlenecks": bottlenecks}
