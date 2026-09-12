"use client";

import { useState, useEffect } from "react";
import { Camera, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ReportPage() {
  const [segments, setSegments] = useState<any[]>([]);
  const [segmentId, setSegmentId] = useState("");
  const [status, setStatus] = useState("at_risk");
  const [severity, setSeverity] = useState("medium");
  const [desc, setDesc] = useState("");
  
  const [lat, setLat] = useState<number>(26.1445); // Default to Guwahati
  const [lng, setLng] = useState<number>(91.7362);
  
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/road-segments`)
      .then(res => res.json())
      .then(data => {
        setSegments(data);
        if (data.length > 0) setSegmentId(data[0].id);
      })
      .catch(() => console.log("Failed to fetch segments, might be offline"));

    // Real connectivity check
    const checkConnectivity = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
        setIsOnline(res.ok);
      } catch (e) {
        setIsOnline(false);
      }
    };

    checkConnectivity();
    const interval = setInterval(checkConnectivity, 5000);
    
    // Geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        (err) => console.log("Geo denied, using fallback", err)
      );
    }
    
    updateQueueCount();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline) flushQueue();
  }, [isOnline]);

  const updateQueueCount = () => {
    const q = JSON.parse(localStorage.getItem('reportQueue') || '[]');
    setQueuedCount(q.length);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          // Resize and watermark
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1080;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            // Draw Geotag Watermark
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(10, height - 70, 450, 60);
            
            ctx.fillStyle = '#FF9933'; // India Saffron
            ctx.font = 'bold 18px Arial';
            ctx.fillText('YATRA SATHI - VERIFIED GEOTAG', 20, height - 45);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px Arial';
            ctx.fillText(`Lat: ${lat.toFixed(6)} Lng: ${lng.toFixed(6)}`, 20, height - 20);
            
            ctx.fillStyle = '#138808'; // India Green
            const dateStr = new Date().toLocaleString();
            ctx.fillText(`Time: ${dateStr}`, 250, height - 20);
            
            const watermarkedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            setPhotoPreview(watermarkedBase64);
          } else {
            setPhotoPreview(reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const submitReport = async (data: any, photoBase64?: string | null) => {
    let photoUrl = null;

    if (photoBase64) {
      // Upload to Supabase Storage
      const byteString = atob(photoBase64.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'image/jpeg' });
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const { data: uploadData, error } = await supabase.storage
        .from('reports')
        .upload(filename, blob, { contentType: 'image/jpeg' });
        
      if (!error && uploadData) {
        const { data: publicUrlData } = supabase.storage.from('reports').getPublicUrl(filename);
        photoUrl = publicUrlData.publicUrl;
      }
    }

    const payload = { ...data, photo_url: photoUrl };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/field-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/risk/recalculate/${data.road_segment_id}`, { method: "POST" });
        return true;
      }
    } catch(e) {
      return false;
    }
    return false;
  };

  const flushQueue = async () => {
    const q = JSON.parse(localStorage.getItem('reportQueue') || '[]');
    if (q.length === 0) return;
    
    let remaining = [];
    for (const item of q) {
      const success = await submitReport(item.data, item.photoBase64);
      if (!success) remaining.push(item);
    }
    localStorage.setItem('reportQueue', JSON.stringify(remaining));
    updateQueueCount();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      road_segment_id: segmentId,
      status_reported: status,
      severity,
      description: desc,
      lat,
      lng,
      synced_from_offline: !isOnline
    };
    
    if (isOnline) {
      await submitReport(data, photoPreview);
      alert("Report submitted live!");
      setDesc("");
      setPhotoFile(null);
      setPhotoPreview(null);
    } else {
      const q = JSON.parse(localStorage.getItem('reportQueue') || '[]');
      q.push({ data, photoBase64: photoPreview });
      localStorage.setItem('reportQueue', JSON.stringify(q));
      updateQueueCount();
      alert("Saved offline — will submit when connection returns.");
      setDesc("");
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      <header className="bg-white text-gray-800 p-4 sticky top-0 z-10 flex justify-between items-center border-b border-gray-200">
        <h1 className="text-xl font-bold font-sans">
          <span className="text-[#FF9933]">Yatra</span>
          <span className="text-[#2a2a2a]"> </span>
          <span className="text-[#138808]">Sathi</span>
        </h1>
        {isOnline ? (
          <div className="flex items-center text-[10px] uppercase tracking-wider bg-moss-green/10 text-moss-green px-2 py-1 rounded-full font-bold"><Wifi size={12} className="mr-1"/> Online</div>
        ) : (
          <div className="flex items-center text-[10px] uppercase tracking-wider bg-rust text-white px-2 py-1 rounded-full font-bold">
            <WifiOff size={12} className="mr-1"/> Offline {queuedCount > 0 && `(${queuedCount})`}
          </div>
        )}
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-bold mb-2 text-gray-800">Location</label>
          <div className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-wider">Detected: {lat.toFixed(4)}, {lng.toFixed(4)}</div>
          <select value={segmentId} onChange={e => setSegmentId(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 text-sm">
            {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-bold mb-3 text-gray-800">Status</label>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => setStatus('clear')} className={`p-3 rounded-xl text-xs font-bold transition-colors ${status==='clear' ? 'bg-moss-green text-white' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>Clear</button>
            <button type="button" onClick={() => setStatus('at_risk')} className={`p-3 rounded-xl text-xs font-bold transition-colors ${status==='at_risk' ? 'bg-amber text-gray-900' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>At Risk</button>
            <button type="button" onClick={() => setStatus('blocked')} className={`p-3 rounded-xl text-xs font-bold transition-colors ${status==='blocked' ? 'bg-rust text-white' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>Blocked</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-bold mb-3 text-gray-800">Severity</label>
          <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 text-sm">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-bold mb-3 text-gray-800">Photo Verification</label>
          {photoPreview ? (
            <div className="relative mb-2 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-black">
              <img src={photoPreview} alt="Preview" className="w-full h-auto max-h-96 object-contain" />
              <button type="button" onClick={() => {setPhotoPreview(null); setPhotoFile(null)}} className="absolute top-2 right-2 bg-white text-rust text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold shadow-md hover:bg-gray-50">Remove</button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-gray-200 bg-gray-50 p-8 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 transition">
              <Camera size={32} className="mb-3 text-gray-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Tap to Take Photo</span>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
            </label>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-bold mb-3 text-gray-800">Notes (Optional)</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 h-24 text-sm" placeholder="Describe the issue..."></textarea>
        </div>
        
        <button type="submit" className="w-full bg-[#138808] text-white p-4 rounded-full font-bold text-lg hover:bg-opacity-90 shadow-md transition-transform active:scale-95 mt-4">
          {isOnline ? "Submit Report" : "Save to Offline Queue"}
        </button>
      </form>
    </div>
  );
}
