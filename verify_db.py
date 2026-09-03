import os
from supabase import create_client, Client
from dotenv import load_dotenv

def verify_db():
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
        return
        
    supabase: Client = create_client(url, key)
    
    tables = ["districts", "road_segments", "field_reports", "vehicles", "shipments", "alerts"]
    
    print("Verifying database schema...")
    all_good = True
    
    for table in tables:
        try:
            # Just try to select 1 row to see if table exists
            response = supabase.table(table).select("*").limit(1).execute()
            print(f"[OK] Table '{table}' exists.")
        except Exception as e:
            print(f"[ERROR] Error accessing table '{table}': {e}")
            all_good = False
            
    print("\nVerifying seed data (districts)...")
    try:
        response = supabase.table("districts").select("*", count="exact").execute()
        count = response.count
        if count >= 8:
            print(f"[OK] Seed data exists! Found {count} districts.")
        elif count > 0:
            print(f"[WARN] Partial seed data. Found {count} districts, expected at least 8.")
        else:
            print("[ERROR] No seed data found in 'districts' table.")
            all_good = False
    except Exception as e:
        print(f"[ERROR] Error checking districts count: {e}")
        all_good = False
        
    if all_good:
        print("\n[SUCCESS] Database verification successful! We are ready for the next step.")
    else:
        print("\n[WARN] Database verification failed. Please check the errors above.")

if __name__ == "__main__":
    verify_db()
