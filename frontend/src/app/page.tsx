"use client";

import { useEffect, useState } from "react";
import MapWrapper from "@/components/MapWrapper";
import { supabase } from "@/lib/supabaseClient";
import { t, Language } from "@/lib/i18n";
import { AlertCircle, MapPin, Search, AlertTriangle, Navigation } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [districts, setDistricts] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [lang, setLang] = useState<Language>("en");
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/districts`);
        const sRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/road-segments`);
        const rRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/field-reports`);
        const vRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles`);
        
        setDistricts(await dRes.json());
        setSegments(await sRes.json());
        setReports(await rRes.json());
        setVehicles(await vRes.json());
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Realtime subscriptions
    const channel = supabase.channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'road_segments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'field_reports' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-gray-500">Loading Yatra Sathi...</div>;

  const counts = {
    clear: segments.filter(s => s.current_status === 'clear').length,
    atRisk: segments.filter(s => s.current_status === 'at_risk').length,
    blocked: segments.filter(s => s.current_status === 'blocked').length,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white text-gray-800 p-4 shadow-sm z-10 flex justify-between items-center sticky top-0">
        <div>
          <h1 className="text-2xl font-bold font-sans">
            <span className="text-[#FF9933]">Yatra</span>
            <span className="text-[#2a2a2a]"> </span>
            <span className="text-[#138808]">Sathi</span>
          </h1>
        </div>
        <button 
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="px-2 py-1 text-xs font-bold border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition"
        >
          {lang === 'en' ? 'हिंदी' : 'English'}
        </button>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-6">
        
        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/report" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition active:scale-95">
            <div className="bg-rust/10 p-3 rounded-full text-rust">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="font-bold text-gray-800 text-sm">Report Issue</span>
          </Link>
          
          <Link href="/route-search" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition active:scale-95">
            <div className="bg-amber/10 p-3 rounded-full text-amber-600">
              <Navigation className="w-6 h-6" />
            </div>
            <span className="font-bold text-gray-800 text-sm">Plan Route</span>
          </Link>
        </div>

        {/* Status Pills */}
        <div className="flex justify-between gap-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex-1 flex flex-col items-center justify-center">
            <span className="font-bold text-rust text-lg">{counts.blocked}</span> 
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">{t('blocked', lang)}</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex-1 flex flex-col items-center justify-center">
            <span className="font-bold text-amber text-lg">{counts.atRisk}</span> 
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">{t('atRisk', lang)}</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex-1 flex flex-col items-center justify-center">
            <span className="font-bold text-moss-green text-lg">{counts.clear}</span> 
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">{t('clear', lang)}</span>
          </div>
        </div>

        {/* Map Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-50 flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            <h2 className="font-bold text-gray-800 text-sm">Live Network Map</h2>
          </div>
          <div className="h-64 relative z-0">
            <MapWrapper segments={segments} districts={districts} vehicles={vehicles} />
          </div>
        </div>

        {/* Live Feed Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-3 border-b border-gray-50 flex items-center">
            <span className="w-2 h-2 rounded-full bg-rust animate-pulse mr-2"></span>
            <h2 className="font-bold text-gray-800 text-sm">{t('liveFeed', lang)}</h2>
          </div>
          <div className="p-3 space-y-4 max-h-96 overflow-y-auto">
            {reports.slice(0, 20).map(r => (
              <div key={r.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold text-white
                    ${r.status_reported === 'blocked' ? 'bg-rust' : r.status_reported === 'at_risk' ? 'bg-amber text-gray-900' : 'bg-moss-green'}
                  `}>
                    {r.status_reported.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-[10px] font-bold uppercase">
                    {new Date(r.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                {r.photo_url && (
                  <img src={r.photo_url} alt="Report Photo" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <p className="text-gray-700 font-medium leading-snug">{r.description || "No description provided."}</p>
                <div className="text-[10px] font-bold text-gray-400 mt-2 flex justify-between uppercase">
                  <span>{r.reporter_name || "Unknown"}</span>
                  <span>Sev: <span className={r.severity==='high'?'text-rust':''}>{r.severity}</span></span>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-4">No recent reports</div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
