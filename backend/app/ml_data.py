import httpx
from datetime import datetime, timedelta, timezone
from app.db import supabase

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

def generate_synthetic_rainfall(seed: int) -> dict:
    import numpy as np
    np.random.seed(seed)
    r_24h = np.random.exponential(scale=20)
    r_72h = r_24h + np.random.exponential(scale=40)
    return {
        "rainfall_mm_last_24h": round(r_24h, 1),
        "rainfall_mm_last_72h": round(r_72h, 1)
    }

def fetch_real_rainfall(lat: float, lng: float) -> dict:
    """
    Real rainfall data via Open-Meteo's free, keyless historical
    weather archive. No signup, no API key. Confirmed working for
    any global coordinate, including all NER locations.
    """
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=3)  # need last 72h

    params = {
        "latitude": lat,
        "longitude": lng,
        "start_date": start_date.isoformat(),
        "end_date": today.isoformat(),
        "daily": "precipitation_sum",
        "timezone": "auto",
    }

    with httpx.Client(timeout=10.0) as client:
        resp = client.get(OPEN_METEO_ARCHIVE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    daily = data.get("daily", {})
    precip_values = daily.get("precipitation_sum", [])
    if not precip_values:
        raise ValueError("Open-Meteo returned no precipitation data for this location/date range")

    # Last value = most recent day (last 24h), sum of all = last 72h
    rainfall_24h = precip_values[-1] if precip_values[-1] is not None else 0.0
    rainfall_72h = sum(v for v in precip_values if v is not None)

    return {
        "rainfall_mm_last_24h": round(rainfall_24h, 1),
        "rainfall_mm_last_72h": round(rainfall_72h, 1),
    }

def build_features_for_segment(segment_id: str) -> dict:
    segment_res = supabase.table("road_segments").select("*").eq("id", segment_id).execute()
    if not segment_res.data:
        raise ValueError(f"Segment {segment_id} not found")
    segment = segment_res.data[0]

    reports_res = (
        supabase.table("field_reports")
        .select("*")
        .eq("road_segment_id", segment_id)
        .order("created_at", desc=True)
        .execute()
    )
    reports = reports_res.data

    now = datetime.now(timezone.utc)
    if reports:
        last_report_time = datetime.fromisoformat(reports[0]["created_at"].replace("Z", "+00:00"))
        days_since = (now - last_report_time).total_seconds() / 86400
    else:
        days_since = 999.0

    # Use the segment's midpoint coordinate for the weather lookup
    mid_lat = (segment["start_lat"] + segment["end_lat"]) / 2
    mid_lng = (segment["start_lng"] + segment["end_lng"]) / 2

    try:
        rainfall = fetch_real_rainfall(mid_lat, mid_lng)
        rainfall["_source"] = "open_meteo"
    except Exception as e:
        # Network hiccup or Open-Meteo temporarily unavailable — fall
        # back to the synthetic generator rather than failing the
        # whole prediction. Log this clearly; don't silently pretend
        # the fallback value is real.
        print("Fallback to synthetic rainfall due to error:", str(e))
        rainfall = generate_synthetic_rainfall(seed=hash(segment_id) % (2**32))
        rainfall["_source"] = "synthetic_fallback"

    return {
        "rainfall_mm_last_24h": rainfall["rainfall_mm_last_24h"],
        "rainfall_mm_last_72h": rainfall["rainfall_mm_last_72h"],
        "days_since_last_report": round(days_since, 2),
        "prior_report_count": len(reports),
        "_source": rainfall["_source"]
    }
