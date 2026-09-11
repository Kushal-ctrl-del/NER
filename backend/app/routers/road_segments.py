from fastapi import APIRouter, HTTPException, Path
from app.db import supabase
from app.models import RoadSegmentResponse
from app.risk import calculate_risk_score
from uuid import UUID
from datetime import datetime, timezone
from app.congestion import estimate_congestion_risk

router = APIRouter(prefix="/road-segments", tags=["Road Segments"])
risk_router = APIRouter(prefix="/risk", tags=["Risk"])

@router.get("/{id}/congestion-proxy")
def get_congestion_proxy(id: UUID):
    # Fetch recent field reports for this segment
    res = supabase.table("field_reports").select("created_at").eq("road_segment_id", str(id)).execute()
    return estimate_congestion_risk(res.data)

@router.get("", response_model=list[RoadSegmentResponse])
def list_road_segments():
    res = supabase.table("road_segments").select("*").execute()
    return res.data

@router.get("/{id}", response_model=RoadSegmentResponse)
def get_road_segment(id: UUID):
    res = supabase.table("road_segments").select("*").eq("id", str(id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Segment not found")
    return res.data[0]

@risk_router.post("/recalculate/{segment_id}")
def recalculate_risk(segment_id: UUID):
    # Fetch all reports for this segment
    reports_res = supabase.table("field_reports").select("severity, status_reported, created_at").eq("road_segment_id", str(segment_id)).execute()
    
    score, status = calculate_risk_score(reports_res.data)
    
    # Update segment
    update_res = supabase.table("road_segments").update({
        "risk_score": score,
        "current_status": status
    }).eq("id", str(segment_id)).execute()
    
    if not update_res.data:
        raise HTTPException(status_code=404, detail="Segment not found")
        
    return {"message": "Recalculated successfully", "new_score": score, "new_status": status}
