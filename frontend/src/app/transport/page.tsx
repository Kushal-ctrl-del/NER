"use client";

import { useEffect, useState, useRef } from "react";
import { Truck, MapPin, Package, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function TransportPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [shipments, setShipments] = useState<any[]>([]);
  
  // Auth state
  const [isLoading, setIsLoading] = useState(true);

  // New Shipment form
  const [originLat, setOriginLat] = useState("26.1445");
  const [originLng, setOriginLng] = useState("91.7362");
  const [destLat, setDestLat] = useState("25.5689");
  const [destLng, setDestLng] = useState("91.8831");
  const [cargoType, setCargoType] = useState("general");
  
  const [activeShipment, setActiveShipment] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const simulationRef = useRef<number>();
  const lastPingRef = useRef<number>(0);

  const [sosAlerts, setSosAlerts] = useState<any[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = "/login";
        return;
      }
      setIsLoading(false);
      
      // Fetch vehicles, shipments, sos
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles`)
        .then(r => r.json())
        .then(v => {
          setVehicles(v);
          if (v.length > 0) setVehicleId(v[0].id);
        });
        
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/shipments`)
        .then(r => r.json())
        .then(s => setShipments(s));
        
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/sos`)
        .then(r => r.json())
        .then(s => setSosAlerts(s));
    };
    checkSession();

    // Subscribe to sos updates
    const channel = supabase.channel('transport_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_alerts' }, () => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/sos`).then(r => r.json()).then(setSosAlerts);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const createShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) return;
    
    const data = {
      vehicle_id: vehicleId,
      origin_lat: parseFloat(originLat),
      origin_lng: parseFloat(originLng),
      destination_lat: parseFloat(destLat),
      destination_lng: parseFloat(destLng),
      cargo_type: cargoType
    };
    
    // Get token for auth
    const { data: { session } } = await supabase.auth.getSession();
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shipments`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`
      },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      const newShip = await res.json();
      setShipments(prev => [...prev, newShip]);
      setActiveShipment(newShip);
      alert("Shipment created!");
    }
  };

  const updateStatus = async (status: string) => {
    if (!activeShipment) return;
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shipments/${activeShipment.id}/status`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ status })
    });
    setActiveShipment({...activeShipment, status});
  };

  const startSimulation = () => {
    if (!activeShipment || !activeShipment.route_geojson) return;
    
    setIsSimulating(true);
    updateStatus("in_transit");
    
    const coords = activeShipment.route_geojson;
    const totalPoints = coords.length;
    let startTime = performance.now();
    const DURATION_MS = 20000; // 20 seconds
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      
      const index = Math.floor(progress * (totalPoints - 1));
      const [lng, lat] = coords[index];
      
      // Ping API every ~1.5 seconds
      if (time - lastPingRef.current > 1500) {
        lastPingRef.current = time;
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles/${activeShipment.vehicle_id}/position`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng })
        }).catch(console.error);
      }
      
      if (progress < 1) {
        simulationRef.current = requestAnimationFrame(animate);
      } else {
        setIsSimulating(false);
        updateStatus("delivered");
        alert("Vehicle arrived at destination!");
      }
    };
    
    simulationRef.current = requestAnimationFrame(animate);
  };

  const stopSimulation = () => {
    if (simulationRef.current) {
      cancelAnimationFrame(simulationRef.current);
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Checking authentication...</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      <header className="bg-white text-gray-800 p-4 sticky top-0 z-10 border-b border-gray-200 shadow-sm flex items-center justify-center">
        <h1 className="text-xl font-bold font-sans">
          <span className="text-[#FF9933]">Yatra</span>
          <span className="text-[#2a2a2a]"> </span>
          <span className="text-[#138808]">Sathi</span>
        </h1>
      </header>

      <div className="p-4 space-y-6 mb-8">
        <div className="bg-amber/10 border border-amber/30 rounded-xl p-4">
          <p className="text-amber-900 text-xs font-medium"><strong>Official Logistics View:</strong> This section is restricted to authorized transport officials only.</p>
        </div>

        {sosAlerts.length > 0 && (
          <div className="bg-rust/10 border-l-4 border-rust p-4 rounded-xl mb-6 shadow-sm">
            <h2 className="text-lg font-bold text-rust flex items-center mb-3">
              <AlertTriangle className="mr-2 w-5 h-5 animate-pulse" /> Active SOS Alerts ({sosAlerts.length})
            </h2>
            <div className="space-y-3">
              {sosAlerts.map(alert => (
                <div key={alert.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <strong className="text-gray-800 text-sm">{alert.reporter_name || "Unknown Driver"}</strong>
                    <span className="text-[10px] bg-rust text-white px-2 py-0.5 rounded font-bold uppercase animate-pulse">Action Required</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Phone: {alert.reporter_phone || "N/A"}</p>
                  <p className="text-xs font-medium text-gray-700 bg-gray-50 p-2 rounded mb-2 border border-gray-100">
                    <MapPin className="inline w-3 h-3 mr-1 text-rust" /> 
                    {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => {
                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/sos/${alert.id}/status?status=acknowledged`, { method: "PATCH" })
                        .then(() => setSosAlerts(sosAlerts.filter(a => a.id !== alert.id)))
                      }}
                      className="bg-amber text-black text-xs font-bold py-1.5 px-3 rounded flex-1 text-center hover:bg-yellow-500"
                    >
                      Acknowledge
                    </button>
                    <button 
                      onClick={() => {
                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/sos/${alert.id}/status?status=resolved`, { method: "PATCH" })
                        .then(() => setSosAlerts(sosAlerts.filter(a => a.id !== alert.id)))
                      }}
                      className="bg-gray-200 text-gray-700 text-xs font-bold py-1.5 px-3 rounded flex-1 text-center hover:bg-gray-300"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Truck className="mr-2" /> Transport View
        </h2>
      
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">1. Select Vehicle</h2>
        <select 
          value={vehicleId} 
          onChange={e => setVehicleId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.vehicle_number} ({v.driver_name})</option>
          ))}
        </select>
      </div>
      
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">2. Create Shipment</h2>
        <form onSubmit={createShipment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">Origin Lat</label>
              <input value={originLat} onChange={e => setOriginLat(e.target.value)} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Origin Lng</label>
              <input value={originLng} onChange={e => setOriginLng(e.target.value)} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Dest Lat</label>
              <input value={destLat} onChange={e => setDestLat(e.target.value)} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Dest Lng</label>
              <input value={destLng} onChange={e => setDestLng(e.target.value)} className="w-full border p-2 rounded" />
            </div>
          </div>
          <div>
            <label className="block text-sm">Cargo Type</label>
            <select value={cargoType} onChange={e => setCargoType(e.target.value)} className="w-full border p-2 rounded">
              <option value="medicine">Medicine</option>
              <option value="food">Food</option>
              <option value="construction_material">Construction Material</option>
              <option value="agricultural_produce">Agricultural Produce</option>
              <option value="general">General</option>
            </select>
          </div>
          <button type="submit" className="bg-moss-green text-white px-4 py-2 rounded font-bold w-full">Create Route</button>
        </form>
      </div>
      
      {activeShipment && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-moss-green">
          <h2 className="text-xl font-bold mb-4 flex items-center"><Package className="mr-2" /> Active Shipment</h2>
          <p className="mb-2"><strong>Status:</strong> <span className="uppercase text-amber font-bold">{activeShipment.status}</span></p>
          <p className="mb-4"><strong>ETA:</strong> {activeShipment.eta_minutes} mins</p>
          
          <div className="flex gap-2">
            {!isSimulating ? (
              <button onClick={startSimulation} className="bg-moss-green text-white px-4 py-2 rounded flex items-center">
                <Truck className="mr-2 w-4 h-4"/> Start Journey Simulation
              </button>
            ) : (
              <button onClick={stopSimulation} className="bg-rust text-white px-4 py-2 rounded">
                Stop Simulation
              </button>
            )}
            
            <button onClick={() => updateStatus("delayed")} className="bg-amber text-black px-4 py-2 rounded flex items-center">
              <Clock className="mr-2 w-4 h-4"/> Flag Delayed
            </button>
            
            <button onClick={() => updateStatus("delivered")} className="bg-gray-800 text-white px-4 py-2 rounded flex items-center">
              <CheckCircle className="mr-2 w-4 h-4"/> Delivered
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
