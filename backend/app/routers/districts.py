from fastapi import APIRouter
from app.db import supabase
from app.models import DistrictResponse

router = APIRouter(prefix="/districts", tags=["Districts"])

@router.get("", response_model=list[DistrictResponse])
def list_districts():
    res = supabase.table("districts").select("*").execute()
    return res.data
