from datetime import datetime, timezone

def calculate_risk_score(reports: list) -> tuple[float, str]:
    """
    Given a list of report dictionaries (with 'severity', 'status_reported', 'created_at'),
    returns (risk_score, current_status)
    """
    if not reports:
        return 0.0, "unknown"
        
    severity_weights = {
        "low": 0.3,
        "medium": 0.6,
        "high": 1.0
    }
    
    max_score = 0.0
    worst_status = "clear"
    
    status_priority = {"clear": 1, "at_risk": 2, "blocked": 3}
    
    now = datetime.now(timezone.utc)
    
    for report in reports:
        severity = report.get("severity", "medium")
        status = report.get("status_reported", "clear")
        created_at_str = report.get("created_at")
        
        # parse ISO datetime string, assuming UTC from DB
        try:
            # Handle various ISO formats
            if created_at_str.endswith('Z'):
                created_at_str = created_at_str[:-1] + '+00:00'
            created_at = datetime.fromisoformat(created_at_str)
        except Exception:
            created_at = now
            
        hours_since = (now - created_at).total_seconds() / 3600.0
        
        # Recency weight
        recency_weight = max(0.0, 1.0 - (hours_since / 72.0))
        sev_weight = severity_weights.get(severity, 0.6)
        
        score = sev_weight * recency_weight
        
        if score > max_score:
            max_score = score
            
        # Update worst status across ALL reports that are still relevant?
        # Actually, if we just want the worst status of the highest scoring report:
        if status_priority.get(status, 1) > status_priority.get(worst_status, 1):
            # decay doesn't apply to status string itself, but maybe older 'blocked' shouldn't persist forever
            # Let's say if the report is completely decayed (score = 0), it shouldn't affect status.
            if recency_weight > 0:
                worst_status = status
                
    # Re-evaluate status based on max_score if all reports are too old
    if max_score == 0.0:
        return 0.0, "unknown"
        
    return round(max_score, 4), worst_status

if __name__ == "__main__":
    now_iso = datetime.now(timezone.utc).isoformat()
    # Test 1: Empty
    score, status = calculate_risk_score([])
    print(f"Empty: {score}, {status} (Expected: 0.0, unknown)")
    
    # Test 2: Fresh High Severity Blocked
    score, status = calculate_risk_score([
        {"severity": "high", "status_reported": "blocked", "created_at": now_iso}
    ])
    print(f"Fresh High Blocked: {score}, {status} (Expected: 1.0, blocked)")
    
    # Test 3: Old Low Severity At Risk (decayed to 0)
    from datetime import timedelta
    old_time = (datetime.now(timezone.utc) - timedelta(hours=73)).isoformat()
    score, status = calculate_risk_score([
        {"severity": "low", "status_reported": "at_risk", "created_at": old_time}
    ])
    print(f"Old (>72h): {score}, {status} (Expected: 0.0, unknown)")
    
    # Test 4: Multiple reports
    semi_old_time = (datetime.now(timezone.utc) - timedelta(hours=36)).isoformat()
    score, status = calculate_risk_score([
        {"severity": "low", "status_reported": "at_risk", "created_at": now_iso}, # score = 0.3
        {"severity": "high", "status_reported": "blocked", "created_at": semi_old_time} # score = 1.0 * (1 - 36/72) = 0.5
    ])
    print(f"Multiple: {score}, {status} (Expected: 0.5, blocked)")
