from fastapi import APIRouter, HTTPException
from app.db import supabase
from app.models import VehicleResponse, VehicleStatusUpdate, VehiclePositionPing
from uuid import UUID
from datetime import datetime, timezone

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("", response_model=list[VehicleResponse])
def list_vehicles():
    res = supabase.table("vehicles").select("*").execute()
    return res.data

@router.patch("/{id}/status")
def update_vehicle_status(id: UUID, update: VehicleStatusUpdate):
    res = supabase.table("vehicles").update({
        "status": update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", str(id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return res.data[0]

@router.post("/{id}/position")
def ping_vehicle_position(id: UUID, ping: VehiclePositionPing):
    res = supabase.table("vehicles").update({
        "lat": ping.lat,
        "lng": ping.lng,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", str(id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Position updated"}
