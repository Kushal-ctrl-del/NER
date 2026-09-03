import requests

# Get segments
segs = requests.get('http://127.0.0.1:8000/road-segments').json()
segment_id = segs[0]['id']
print("Testing with segment:", segs[0]['name'], segment_id)
print("Initial risk score:", segs[0]['risk_score'])

# Submit report
report_data = {
    "road_segment_id": segment_id,
    "reporter_name": "Test User",
    "status_reported": "blocked",
    "severity": "high",
    "lat": 26.0,
    "lng": 91.8
}
report = requests.post('http://127.0.0.1:8000/field-reports', json=report_data).json()
print("Created report:", report['id'])

# Recalculate
recalc = requests.post(f'http://127.0.0.1:8000/risk/recalculate/{segment_id}').json()
print("Recalculate response:", recalc)

# Verify
seg = requests.get(f'http://127.0.0.1:8000/road-segments/{segment_id}').json()
print("Updated risk score:", seg['risk_score'], "Status:", seg['current_status'])
