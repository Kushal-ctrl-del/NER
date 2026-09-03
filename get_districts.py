import os
from supabase import create_client, Client
from dotenv import load_dotenv

def get_districts():
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(url, key)
    
    response = supabase.table("districts").select("id, name").execute()
    for d in response.data:
        print(f"{d['name']}: {d['id']}")

if __name__ == "__main__":
    get_districts()
