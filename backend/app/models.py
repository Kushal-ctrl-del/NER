from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# Shared
class GeoPoint(BaseModel):
    lat: float
    lng: float

# Districts
class DistrictResponse(BaseModel):
    id: UUID
    name: str
    state: str
    lat: float
    lng: float
    connectivity_status: str
    updated_at: datetime

# Road Segments
class RoadSegmentResponse(BaseModel):
    id: UUID
    name: str
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    district_id: Optional[UUID]
    current_status: str
    risk_score: float
    last_report_at: Optional[datetime]
    created_at: datetime

# Field Reports
class FieldReportCreate(BaseModel):
    road_segment_id: UUID
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None
    status_reported: str
    severity: str
    description: Optional[str] = None
    photo_url: Optional[str] = None
    lat: float
    lng: float
    synced_from_offline: bool = False

class FieldReportResponse(FieldReportCreate):
    id: UUID
    created_at: datetime

# Routes
class RouteSuggestionRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float

# Vehicles
class VehicleResponse(BaseModel):
    id: UUID
    vehicle_number: str
    cargo_type: str
    status: str
    lat: float
    lng: float
    driver_name: str
    driver_phone: str
    updated_at: datetime

class VehicleStatusUpdate(BaseModel):
    status: str

class VehiclePositionPing(BaseModel):
    lat: float
    lng: float

# Shipments
class ShipmentCreate(BaseModel):
    vehicle_id: UUID
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    destination_name: Optional[str] = None
    cargo_description: Optional[str] = None

class ShipmentResponse(ShipmentCreate):
    id: UUID
    status: str
    route_geojson: Optional[list] = None
    eta_minutes: Optional[int] = None
    created_at: datetime
    updated_at: datetime

class ShipmentStatusUpdate(BaseModel):
    status: str

# Alerts
class AlertCreate(BaseModel):
    road_segment_id: UUID
    alert_type: str
    message: str
    severity: str

class AlertResponse(AlertCreate):
    id: UUID
    is_active: bool
    created_at: datetime

# ML Risk
class MLRiskPredictionResponse(BaseModel):
    segment_id: UUID
    predicted_risk: str
    confidence: float
    contributing_factors: List[str]
