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
    routes_data = get_osrm_route(origin_lng, origin_lat, dest_lng, dest_lat)
    if not routes_data:
        raise HTTPException(status_code=500, detail="Could not calculate route")
        
    # In a real app we would intersect coords with road_segments and compute risk for each
    response_routes = []
    for idx, rd in enumerate(routes_data):
        response_routes.append({
            "risk_category": "unknown", # default
            "eta_minutes": rd["eta_minutes"],
            "coordinates": rd["coords"],
            "steps": rd["steps"],
            "summary": rd["summary"]
        })
        
    return {
        "routes": response_routes
    }

def check_and_flag_delayed_shipments():
    """
    Flags any 'in_transit' shipment whose eta_minutes has been
    exceeded by more than a grace window as 'delayed', and creates a
    delayed_delivery alert.
    """
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    GRACE_MINUTES = 15

    active = supabase.table("shipments").select("*").eq("status", "in_transit").execute()
    for shipment in active.data:
        if not shipment.get("eta_minutes"):
            continue
        try:
            created = datetime.fromisoformat(shipment["created_at"].replace("Z", "+00:00"))
        except ValueError:
            continue
        elapsed_minutes = (now - created).total_seconds() / 60
        if elapsed_minutes > shipment["eta_minutes"] + GRACE_MINUTES:
            supabase.table("shipments").update({"status": "delayed"}).eq("id", shipment["id"]).execute()
            existing_alert = (
                supabase.table("alerts")
                .select("id, message")
                .eq("alert_type", "delayed_delivery")
                .eq("is_active", True)
                .execute()
            )
            already_alerted = any(shipment["id"] in (a.get("message") or "") for a in existing_alert.data)
            if not already_alerted:
                supabase.table("alerts").insert({
                    "road_segment_id": None,
                    "alert_type": "delayed_delivery",
                    "message": f"Shipment {shipment['id']} is delayed — exceeded ETA by {int(elapsed_minutes - shipment['eta_minutes'])} min.",
                    "severity": "medium",
                    "is_active": True,
                }).execute()

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
    check_and_flag_delayed_shipments()
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
