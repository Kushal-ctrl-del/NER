from fastapi import APIRouter, Query
from app.db import supabase
from app.models import FieldReportCreate, FieldReportResponse
from uuid import UUID

router = APIRouter(prefix="/field-reports", tags=["Field Reports"])

@router.post("", response_model=FieldReportResponse)
def create_field_report(report: FieldReportCreate):
    data = report.model_dump(exclude_unset=True)
    data["road_segment_id"] = str(data["road_segment_id"])
    res = supabase.table("field_reports").insert(data).execute()
    return res.data[0]

@router.get("", response_model=list[FieldReportResponse])
def list_field_reports(segment_id: UUID | None = Query(None)):
    query = supabase.table("field_reports").select("*")
    if segment_id:
        query = query.eq("road_segment_id", str(segment_id))
    # Add ordering by created_at desc
    res = query.order("created_at", desc=True).execute()
    return res.data
