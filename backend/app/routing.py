import requests

def get_osrm_route(origin_lng: float, origin_lat: float, dest_lng: float, dest_lat: float):
    """
    Calls OSRM public API to get route coordinates.
    Returns GeoJSON LineString coordinates: list of [lng, lat]
    """
    url = f"https://router.project-osrm.org/route/v1/driving/{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
    headers = {"User-Agent": "NERLogisticsPlatform-SIH2026/1.0"}
    params = {
        "overview": "full",
        "geometries": "geojson"
    }
    
    resp = requests.get(url, headers=headers, params=params)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("routes"):
            route = data["routes"][0]
            # duration in seconds -> ETA minutes
            eta_minutes = int(route.get("duration", 0) / 60)
            coords = route["geometry"]["coordinates"] # [lng, lat]
            return coords, eta_minutes
            
    return None, None
