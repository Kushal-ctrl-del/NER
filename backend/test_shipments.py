import requests

# Test vehicles list
vehicles = requests.get('http://127.0.0.1:8000/vehicles').json()
print("Vehicles count:", len(vehicles))
v_id = vehicles[0]['id']

# Update vehicle status
upd = requests.patch(f'http://127.0.0.1:8000/vehicles/{v_id}/status', json={"status": "in_transit"}).json()
print("Updated vehicle status:", upd['status'])

# Create shipment
shipment_data = {
    "vehicle_id": v_id,
    "origin_lat": 26.1445,
    "origin_lng": 91.7362,
    "destination_lat": 25.5689,
    "destination_lng": 91.8831,
    "destination_name": "Shillong Hospital",
    "cargo_description": "Medical supplies"
}
shipment = requests.post('http://127.0.0.1:8000/shipments', json=shipment_data).json()
print("Created shipment ID:", shipment['id'])
print("Route ETA:", shipment['eta_minutes'])
if shipment['route_geojson']:
    print("Route coordinates count:", len(shipment['route_geojson']))

# Update shipment status
upd_ship = requests.patch(f'http://127.0.0.1:8000/shipments/{shipment["id"]}/status', json={"status": "in_transit"}).json()
print("Updated shipment status:", upd_ship['status'])
