"""
Congestion risk proxy — NOT a real live traffic feed. Inferred from
report volume and timing patterns already in field_reports. Disclosed
honestly: this estimates "segments where problems cluster," not
real-time vehicle density.
"""
from datetime import datetime, timezone

def estimate_congestion_risk(reports: list[dict]) -> dict:
    """
    Takes recent field_reports for one segment. Returns a congestion
    proxy score (0-1) based on report frequency in the last 7 days —
    segments with many reports in a short window likely have more
    traffic/activity generating those reports, a reasonable, disclosed
    proxy for congestion when no real traffic data exists.
    """
    if not reports:
        return {"congestion_proxy": 0.0, "basis": "no_recent_activity"}

    now = datetime.now(timezone.utc)
    recent = [r for r in reports if (now - _parse(r["created_at"])).days <= 7]
    density_score = min(1.0, len(recent) / 10)  # 10+ reports/week = max proxy score

    return {
        "congestion_proxy": round(density_score, 2),
        "basis": f"{len(recent)} reports in last 7 days (proxy signal, not live traffic data)",
    }

def _parse(ts):
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))
