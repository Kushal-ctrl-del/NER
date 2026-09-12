"use client";

import { useState } from "react";
import { Search, Map as MapIcon, Route } from "lucide-react";
import MapWrapper from "@/components/MapWrapper";

export default function RouteSearchPage() {
  const [originLat, setOriginLat] = useState("26.1445");
  const [originLng, setOriginLng] = useState("91.7362");
  const [destLat, setDestLat] = useState("25.5788");
  const [destLng, setDestLng] = useState("91.8933");
  
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/routes/suggest?origin_lat=${originLat}&origin_lng=${originLng}&dest_lat=${destLat}&dest_lng=${destLng}`);
      if (!res.ok) throw new Error("Failed to calculate routes");
      
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (e: any) {
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex flex-col">
      <header className="bg-white text-gray-800 p-4 sticky top-0 z-10 border-b border-gray-200 shadow-sm flex items-center justify-between">
        <h1 className="text-lg font-bold font-sans flex items-center gap-2">
          <Route className="w-5 h-5 text-[#FF9933]" /> Route Search
        </h1>
      </header>

      <main className="flex-1 flex flex-col relative pb-16">
        <div className="p-4 bg-white shadow-sm z-10">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Origin Lat</label>
                <input value={originLat} onChange={e => setOriginLat(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg bg-gray-50 text-xs font-bold" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Origin Lng</label>
                <input value={originLng} onChange={e => setOriginLng(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg bg-gray-50 text-xs font-bold" required />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dest Lat</label>
                <input value={destLat} onChange={e => setDestLat(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg bg-gray-50 text-xs font-bold" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dest Lng</label>
                <input value={destLng} onChange={e => setDestLng(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg bg-gray-50 text-xs font-bold" required />
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-[#138808] text-white p-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Search className="w-4 h-4" /> {loading ? "Searching..." : "Find Safest Route"}
            </button>
            {error && <p className="text-xs text-rust font-bold text-center">{error}</p>}
          </form>
        </div>

        <div className="flex-1 min-h-[300px] relative z-0">
          <MapWrapper suggestedRoutes={routes} />
        </div>

        {routes.length > 0 && (
          <div className="bg-white p-4 border-t border-gray-200 absolute bottom-16 left-0 right-0 max-h-64 overflow-y-auto z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-2xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Suggested Routes</h3>
            <div className="space-y-4">
              {routes.map((r, i) => (
                <div key={i} className="flex flex-col p-3 border border-gray-100 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${r.risk_category === 'low' ? 'bg-moss-green' : r.risk_category === 'elevated' ? 'bg-amber' : 'bg-rust'}`} />
                      <div>
                        <p className="text-sm font-bold text-gray-800">Route {i + 1}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Risk: {r.risk_category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">{r.eta_minutes} mins</p>
                    </div>
                  </div>
                  
                  {/* Turn-by-Turn Directions */}
                  {r.steps && r.steps.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 max-h-32 overflow-y-auto">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Turn-by-turn Directions:</p>
                      <ul className="space-y-1">
                        {r.steps.map((step: string, idx: number) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                            <span className="text-[#FF9933] font-bold">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
