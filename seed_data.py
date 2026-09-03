import os
from supabase import create_client, Client
from dotenv import load_dotenv

def seed_data():
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(url, key)
    
    # Get districts map
    districts = {d['name']: d['id'] for d in supabase.table("districts").select("id, name").execute().data}
    
    # Seed Road Segments
    segments = [
        {
            "name": "NH-6 (Guwahati - Shillong)",
            "start_lat": 26.1445, "start_lng": 91.7362,
            "end_lat": 25.5689, "end_lng": 91.8831,
            "district_id": districts.get("Shillong"),
            "current_status": "clear",
            "risk_score": 0.0
        },
        {
            "name": "NH-6 (Shillong - Jowai)",
            "start_lat": 25.5689, "start_lng": 91.8831,
            "end_lat": 25.4497, "end_lng": 92.2033,
            "district_id": districts.get("Shillong"),
            "current_status": "at_risk",
            "risk_score": 0.4
        },
        {
            "name": "NH-2 (Kohima - Imphal)",
            "start_lat": 25.6700, "start_lng": 94.1095,
            "end_lat": 24.8074, "end_lng": 93.9384,
            "district_id": districts.get("Kohima"),
            "current_status": "unknown",
            "risk_score": 0.0
        },
        {
            "name": "NH-54 (Silchar - Aizawl)",
            "start_lat": 24.8333, "start_lng": 92.7789,
            "end_lat": 23.7271, "end_lng": 92.7176,
            "district_id": districts.get("Aizawl"),
            "current_status": "blocked",
            "risk_score": 1.0
        },
        {
            "name": "NH-8 (Agartala - Udaipur)",
            "start_lat": 23.8314, "start_lng": 91.2868,
            "end_lat": 23.5350, "end_lng": 91.4820,
            "district_id": districts.get("Agartala"),
            "current_status": "clear",
            "risk_score": 0.0
        },
        {
            "name": "NH-10 (Siliguri - Gangtok)",
            "start_lat": 26.7271, "start_lng": 88.3953,
            "end_lat": 27.3389, "end_lng": 88.6065,
            "district_id": districts.get("Gangtok"),
            "current_status": "at_risk",
            "risk_score": 0.6
        }
    ]
    
    print("Inserting road segments...")
    res = supabase.table("road_segments").insert(segments).execute()
    print(f"Inserted {len(res.data)} road segments.")
    
    # Seed Vehicles
    vehicles = [
        {
            "vehicle_number": "AS-01-AB-1234",
            "cargo_type": "medicine",
            "status": "available",
            "lat": 26.1445, "lng": 91.7362,
            "driver_name": "Ramesh Kumar",
            "driver_phone": "+91-9876543210"
        },
        {
            "vehicle_number": "ML-05-XY-9876",
            "cargo_type": "food",
            "status": "in_transit",
            "lat": 25.9038, "lng": 91.8814, # Nongpoh
            "driver_name": "John Lyngdoh",
            "driver_phone": "+91-9876543211"
        },
        {
            "vehicle_number": "NL-01-K-5555",
            "cargo_type": "construction_material",
            "status": "available",
            "lat": 25.6700, "lng": 94.1095,
            "driver_name": "Alem Ao",
            "driver_phone": "+91-9876543212"
        },
        {
            "vehicle_number": "MZ-01-Q-3333",
            "cargo_type": "general",
            "status": "delayed",
            "lat": 24.2255, "lng": 92.6750, # Kolasib
            "driver_name": "Zothansanga",
            "driver_phone": "+91-9876543213"
        },
        {
            "vehicle_number": "TR-01-B-7777",
            "cargo_type": "agricultural_produce",
            "status": "available",
            "lat": 23.8314, "lng": 91.2868,
            "driver_name": "Biplab Das",
            "driver_phone": "+91-9876543214"
        },
        {
            "vehicle_number": "SK-01-D-2222",
            "cargo_type": "medicine",
            "status": "in_transit",
            "lat": 27.0500, "lng": 88.2600, # Near Darjeeling / NH-10
            "driver_name": "Karma Bhutia",
            "driver_phone": "+91-9876543215"
        }
    ]
    
    print("Inserting vehicles...")
    res2 = supabase.table("vehicles").insert(vehicles).execute()
    print(f"Inserted {len(res2.data)} vehicles.")
    
    print("Seed data successfully inserted!")

if __name__ == "__main__":
    seed_data()
