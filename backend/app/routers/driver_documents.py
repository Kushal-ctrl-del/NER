from fastapi import APIRouter, HTTPException
from app.db import supabase
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class DocumentUpload(BaseModel):
    document_type: str  # 'driving_license' | 'rc_book' | 'insurance' | 'other'
    document_number: Optional[str] = None
    file_url: str

@router.post("/reporter-profiles/{phone}/documents")
def add_document(phone: str, body: DocumentUpload):
    profile = supabase.table("reporter_profiles").select("phone").eq("phone", phone).execute()
    if not profile.data:
        raise HTTPException(404, "Profile not found — save a profile before uploading documents")

    data = {
        "reporter_phone": phone,
        "document_type": body.document_type,
        "document_number": body.document_number,
        "file_url": body.file_url,
    }
    res = supabase.table("driver_documents").insert(data).execute()
    return res.data[0]

@router.get("/reporter-profiles/{phone}/documents")
def list_documents(phone: str):
    res = supabase.table("driver_documents").select("*").eq("reporter_phone", phone).execute()
    return res.data

@router.get("/verify/{public_qr_id}")
def verify_by_qr(public_qr_id: str):
    """
    Public, no-login lookup — this is what the QR code points to.
    Looks up by the random public_qr_id, NEVER by phone number.
    """
    profile_res = supabase.table("reporter_profiles").select("*").eq("public_qr_id", public_qr_id).execute()
    if not profile_res.data:
        raise HTTPException(404, "Invalid or expired verification link")
    profile = profile_res.data[0]

    docs_res = supabase.table("driver_documents").select("*").eq("reporter_phone", profile["phone"]).execute()

    return {
        "name": profile.get("name"),
        "home_district": profile.get("home_district"),
        "documents": docs_res.data,
    }
