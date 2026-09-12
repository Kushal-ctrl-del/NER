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
        "geometries": "geojson",
        "steps": "true"
    }
    
    resp = requests.get(url, headers=headers, params=params)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("routes"):
            route = data["routes"][0]
            # duration in seconds -> ETA minutes
            eta_minutes = int(route.get("duration", 0) / 60)
            coords = route["geometry"]["coordinates"] # [lng, lat]
            
            # Extract turn-by-turn text instructions
            steps = []
            if route.get("legs"):
                for leg in route["legs"]:
                    if leg.get("steps"):
                        for step in leg["steps"]:
                            if step.get("maneuver") and step["maneuver"].get("instruction"):
                                steps.append(step["maneuver"]["instruction"])
                            elif step.get("name"):
                                maneuver_type = step.get("maneuver", {}).get("type", "proceed")
                                steps.append(f"{maneuver_type.capitalize()} on {step['name']}")
                            else:
                                steps.append("Continue along route")
                                
            return coords, eta_minutes, steps
            
    return None, None, None
