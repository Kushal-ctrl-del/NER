from fastapi import APIRouter, Query
from app.db import supabase
from app.models import AlertCreate, AlertResponse

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=list[AlertResponse])
def list_alerts(active: bool = Query(True)):
    res = supabase.table("alerts").select("*").eq("is_active", active).execute()
    return res.data

@router.post("", response_model=AlertResponse)
def create_alert(alert: AlertCreate):
    data = alert.model_dump(exclude_unset=True)
    data["road_segment_id"] = str(data["road_segment_id"])
    res = supabase.table("alerts").insert(data).execute()
    return res.data[0]
