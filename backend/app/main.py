from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NER Logistics Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For hackathon demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import districts, road_segments, field_reports, vehicles, shipments, alerts, ml_risk, driver_documents, sos

app.include_router(districts.router)
app.include_router(road_segments.router)
app.include_router(road_segments.risk_router)
app.include_router(field_reports.router)
app.include_router(vehicles.router)
app.include_router(shipments.router)
app.include_router(shipments.routes_router)
app.include_router(alerts.router)
app.include_router(ml_risk.router)
app.include_router(driver_documents.router)
app.include_router(sos.router, tags=["sos"])

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "NER Logistics Platform Backend is running"}


