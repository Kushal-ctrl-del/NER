"use client";

import { useState } from "react";
import { User, Phone, MapPin, AlertTriangle, ChevronRight, Edit3 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const [phone, setPhone] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [name, setName] = useState("");
  
  const [showEdit, setShowEdit] = useState(false);
  const [district, setDistrict] = useState("Kamrup Metropolitan");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  
  const [pastReports, setPastReports] = useState<any[]>([]);

  // QR & Docs State
  const [showQR, setShowQR] = useState(false);
  const [publicQrId, setPublicQrId] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadType, setUploadType] = useState("driving_license");
  const [isUploading, setIsUploading] = useState(false);

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoaded(true);
    setName("Field Officer");

    // Fetch reports
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/field-reports`);
      const data = await res.json();
      setPastReports(data.slice(0, 3));
    } catch (e) {
      console.error(e);
    }
    
    // Attempt to load documents & public_qr_id (mock fallback if not yet setup)
    try {
      const docsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reporter-profiles/${phone}/documents`);
      if (docsRes.ok) {
        setDocuments(await docsRes.json());
      }
      // For public_qr_id, in a real scenario we'd fetch profile. We'll mock a stable UUID based on phone for now 
      // if the backend isn't returning it, but ideally we get it from DB.
      setPublicQrId("b10a8db1-67e4-4a5c-9c36-7c9b19313a43"); // Mock ID for demo purposes until real DB hookup
    } catch (e) {
      console.error(e);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const filename = `${phone}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const { data: uploadData, error } = await supabase.storage
        .from('driver-documents')
        .upload(filename, file);
        
      if (!error && uploadData) {
        const { data: publicUrlData } = supabase.storage.from('driver-documents').getPublicUrl(filename);
        const fileUrl = publicUrlData.publicUrl;
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reporter-profiles/${phone}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_type: uploadType,
            file_url: fileUrl
          })
        });
        
        if (res.ok) {
          const newDoc = await res.json();
          setDocuments([...documents, newDoc]);
        } else {
          alert("Make sure you have run the SQL script to create the DB tables!");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEdit(false);
    alert("Profile saved locally!");
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      <header className="bg-white text-gray-800 p-4 sticky top-0 z-10 border-b border-gray-200 shadow-sm flex items-center justify-center">
        <h1 className="text-xl font-bold font-sans">
          <span className="text-[#FF9933]">Yatra</span>
          <span className="text-[#2a2a2a]"> </span>
          <span className="text-[#138808]">Sathi</span>
        </h1>
      </header>

      <main className="p-4 mb-20 space-y-6">
        
        {!isLoaded ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Access Your Profile</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your phone number to load your saved details and past reports.</p>
            
            <form onSubmit={handleLoad} className="space-y-4">
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="Mobile Number" 
                className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 text-center font-bold tracking-widest focus:outline-none focus:border-moss-green"
                required
              />
              <button type="submit" className="w-full bg-[#138808] text-white p-3 rounded-full font-bold shadow-md transition-transform active:scale-95">
                Load Profile
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Identity Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-moss-green">
                <User className="text-moss-green w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{name}</h2>
                <p className="text-gray-500 text-sm">{phone || "No phone number"}</p>
              </div>
            </div>

            {/* Menu List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button 
                onClick={() => setShowEdit(!showEdit)}
                className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-amber/10 p-2 rounded-lg text-amber-600">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-800">Edit Profile Info</span>
                </div>
                <ChevronRight className={`text-gray-400 transition-transform ${showEdit ? 'rotate-90' : ''}`} />
              </button>

              {showEdit && (
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                      <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Home District</label>
                      <input value={district} onChange={e => setDistrict(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Emergency Contact</label>
                      <input type="tel" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg bg-white" />
                    </div>
                    <button type="submit" className="w-full bg-[#138808] text-white p-2 rounded-full font-bold text-sm shadow-md transition-transform active:scale-95">Save Details</button>
                  </form>
                </div>
              )}

              <button 
                onClick={() => setShowQR(!showQR)}
                className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-800">My QR Code & Documents</span>
                </div>
                <ChevronRight className={`text-gray-400 transition-transform ${showQR ? 'rotate-90' : ''}`} />
              </button>

              {showQR && (
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center mb-4">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Roadside Verification QR</h3>
                    <p className="text-xs text-gray-500 mb-4">Show this to officials to verify your documents.</p>
                    <div className="flex justify-center mb-2">
                      <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${publicQrId}`} size={150} />
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">ID: {publicQrId.split('-')[0]}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-800">Upload New Document</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={uploadType} onChange={e => setUploadType(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg bg-white text-xs font-bold text-gray-600">
                        <option value="driving_license">Driving License</option>
                        <option value="rc_book">RC Book</option>
                        <option value="insurance">Insurance</option>
                        <option value="other">Other</option>
                      </select>
                      <label className="bg-moss-green text-white text-xs font-bold p-2 rounded-lg text-center cursor-pointer hover:bg-opacity-90">
                        {isUploading ? "Uploading..." : "Select File"}
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleDocumentUpload} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">My Uploaded Documents</h3>
                    <div className="space-y-2">
                      {documents.map((doc: any, i: number) => (
                        <div key={i} className="bg-white border border-gray-100 p-2 rounded-lg flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-600 uppercase">{doc.document_type.replace('_', ' ')}</span>
                          <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-bold">VIEW</a>
                        </div>
                      ))}
                      {documents.length === 0 && <p className="text-xs text-gray-400 text-center">No documents uploaded.</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full flex items-center justify-between p-4 bg-white cursor-default border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-rust/10 p-2 rounded-lg text-rust">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-800">Past Reports</span>
                </div>
              </div>

              {/* Past Reports List Inline */}
              <div className="px-4 pb-4 bg-white space-y-3">
                {pastReports.map((r, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50 flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white mb-2 inline-block uppercase tracking-wider
                        ${r.status_reported === 'blocked' ? 'bg-rust' : r.status_reported === 'at_risk' ? 'bg-amber text-gray-900' : 'bg-moss-green'}
                      `}>
                        {r.status_reported.replace('_', ' ')}
                      </span>
                      <p className="text-gray-600 text-xs font-medium leading-snug">{r.description || "No description provided."}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap ml-2">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {pastReports.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-4">No past reports found.</div>
                )}
              </div>
            </div>

            <button 
              onClick={() => {setIsLoaded(false); setPhone("");}} 
              className="w-full py-4 text-rust font-bold text-sm hover:bg-rust/5 rounded-2xl transition"
            >
              Sign Out
            </button>
          </>
        )}
      </main>
    </div>
  );
}
