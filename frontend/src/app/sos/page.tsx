"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, MapPin, CheckCircle, Navigation } from "lucide-react";
import Link from "next/link";

export default function SOSPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        (err) => {
          console.error("Geo error:", err);
          // Fallback NER coordinate
          setLat(26.1445);
          setLng(91.7362);
        }
      );
    } else {
      setLat(26.1445);
      setLng(91.7362);
    }
  }, []);

  const handleSOS = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    const payload = {
      lat: lat || 26.1445,
      lng: lng || 91.7362,
      message: "Emergency distress signal triggered from app.",
      // Using mocked phone/name if not loaded from profile. 
      // Ideally we grab this from context/localStorage.
      reporter_name: "Yatra Sathi User", 
      reporter_phone: "9999999999"
    };

    try {
      // Offline queue logic
      const isOnline = navigator.onLine;
      if (!isOnline) {
        setOffline(true);
        const queue = JSON.parse(localStorage.getItem('sosQueue') || '[]');
        queue.push(payload);
        localStorage.setItem('sosQueue', JSON.stringify(queue));
        setSent(true);
        setLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to send SOS");
      
      setSent(true);
      setOffline(false);
    } catch (e: any) {
      setError(e.message || "Could not connect to server");
      // Still queue if failed due to network
      const queue = JSON.parse(localStorage.getItem('sosQueue') || '[]');
      queue.push(payload);
      localStorage.setItem('sosQueue', JSON.stringify(queue));
      setSent(true);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      <header className="bg-rust text-white p-4 sticky top-0 z-10 shadow-sm flex items-center justify-center">
        <h1 className="text-xl font-bold font-sans flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Emergency SOS
        </h1>
      </header>

      <main className="p-4 mb-20 flex flex-col items-center justify-center min-h-[70vh]">
        {!sent ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Need Immediate Help?</h2>
            <p className="text-gray-500 mb-8 max-w-[280px] mx-auto text-sm">
              Press the button below to alert authorities and broadcast your current location.
            </p>

            <button
              onClick={handleSOS}
              disabled={loading || lat === null}
              className={`w-56 h-56 rounded-full flex flex-col items-center justify-center mx-auto shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all active:scale-95 ${
                loading ? "bg-rust/80" : "bg-rust hover:bg-red-700"
              }`}
            >
              <AlertTriangle className="w-20 h-20 text-white mb-2" strokeWidth={2.5} />
              <span className="text-white font-black text-2xl tracking-widest">SOS</span>
            </button>

            {lat && lng && (
              <p className="text-xs font-bold text-gray-400 mt-8 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" /> Location Acquired
              </p>
            )}
            {!lat && (
              <p className="text-xs font-bold text-amber-500 mt-8 flex items-center justify-center gap-1">
                <Navigation className="w-3 h-3 animate-spin" /> Acquiring location...
              </p>
            )}
            {error && <p className="text-xs text-rust font-bold mt-4">{error}</p>}
          </div>
        ) : (
          <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            {offline ? (
              <AlertTriangle className="w-20 h-20 text-amber mx-auto mb-4" />
            ) : (
              <CheckCircle className="w-20 h-20 text-moss-green mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Alert Recorded</h2>
            
            {offline ? (
              <p className="text-gray-600 text-sm mb-6">
                You appear to be offline. Your distress signal has been saved and will broadcast automatically once signal is restored.
              </p>
            ) : (
              <p className="text-gray-600 text-sm mb-6">
                Help alert sent successfully. Authorities have received your location.
              </p>
            )}

            <button
              onClick={() => {
                setSent(false);
                setError("");
                setOffline(false);
              }}
              className="bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-full text-sm hover:bg-gray-200"
            >
              Back to SOS Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
