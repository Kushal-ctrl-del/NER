from fastapi import APIRouter, HTTPException
from app.db import supabase
from app.models import AlertCreate, AlertResponse
from uuid import UUID
from datetime import datetime, timezone
from app.routers.shipments import check_and_flag_delayed_shipments

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=list[AlertResponse])
def get_active_alerts():
    check_and_flag_delayed_shipments()
    res = supabase.table("alerts").select("*").eq("is_active", True).execute()
    return res.data

@router.post("", response_model=AlertResponse)
def create_alert(alert: AlertCreate):
    data = alert.model_dump(exclude_unset=True)
    data["road_segment_id"] = str(data["road_segment_id"])
    res = supabase.table("alerts").insert(data).execute()
    return res.data[0]
