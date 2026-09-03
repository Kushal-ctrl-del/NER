from fastapi import APIRouter, HTTPException
from app.db import supabase
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class SOSCreate(BaseModel):
    reporter_phone: Optional[str] = None
    reporter_name: Optional[str] = None
    lat: float
    lng: float
    message: Optional[str] = None

@router.post("/sos")
def create_sos(body: SOSCreate):
    data = {
        "reporter_phone": body.reporter_phone,
        "reporter_name": body.reporter_name,
        "lat": body.lat,
        "lng": body.lng,
        "message": body.message,
        "status": "active",
    }
    res = supabase.table("sos_alerts").insert(data).execute()
    return res.data[0]

@router.get("/sos")
def list_sos(active: bool = True):
    query = supabase.table("sos_alerts").select("*")
    if active:
        query = query.eq("status", "active")
    res = query.order("created_at", desc=True).execute()
    return res.data

@router.patch("/sos/{sos_id}/status")
def update_sos_status(sos_id: str, status: str):
    if status not in ("active", "acknowledged", "resolved"):
        raise HTTPException(400, "Invalid status")
    res = supabase.table("sos_alerts").update({"status": status}).eq("id", sos_id).execute()
    if not res.data:
        raise HTTPException(404, "SOS alert not found")
    return res.data[0]
