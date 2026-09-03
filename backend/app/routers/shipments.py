from fastapi import APIRouter, HTTPException
from app.db import supabase
from app.models import ShipmentCreate, ShipmentResponse, ShipmentStatusUpdate
from app.routing import get_osrm_route
from uuid import UUID
from datetime import datetime, timezone

router = APIRouter(prefix="/shipments", tags=["Shipments"])
routes_router = APIRouter(prefix="/routes", tags=["Routes"])

@routes_router.get("/suggest")
def suggest_route(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float):
    # Call OSRM
    coords, eta = get_osrm_route(origin_lng, origin_lat, dest_lng, dest_lat)
    if not coords:
        raise HTTPException(status_code=500, detail="Could not calculate route")
        
    # In a real app we would intersect coords with road_segments and compute risk.
    # For now, just return the route as 'ranked 1'
    return {
        "routes": [
            {
                "risk_category": "unknown", # default
                "eta_minutes": eta,
                "coordinates": coords
            }
        ]
    }

@router.post("", response_model=ShipmentResponse)
def create_shipment(shipment: ShipmentCreate):
    data = shipment.model_dump(exclude_unset=True)
    data["vehicle_id"] = str(data["vehicle_id"])
    
    # auto-calculate route
    coords, eta = get_osrm_route(data["origin_lng"], data["origin_lat"], data["destination_lng"], data["destination_lat"])
    
    if coords:
        data["route_geojson"] = coords
        data["eta_minutes"] = eta
        
    res = supabase.table("shipments").insert(data).execute()
    return res.data[0]

@router.get("", response_model=list[ShipmentResponse])
def list_shipments():
    res = supabase.table("shipments").select("*").execute()
    return res.data

@router.patch("/{id}/status")
def update_shipment_status(id: UUID, update: ShipmentStatusUpdate):
    res = supabase.table("shipments").update({
        "status": update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", str(id)).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return res.data[0]
