"use client";

import { useEffect, useState } from "react";
import { User, CheckCircle, XCircle } from "lucide-react";

export default function VerifyPage({ params }: { params: { qrId: string } }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify/${params.qrId}`)
      .then(res => {
        if (!res.ok) throw new Error("Invalid ID");
        return res.json();
      })
      .then(d => {
        setData(d);
        setError(false);
      })
      .catch(e => {
        console.error(e);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.qrId]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Verifying...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center text-center">
        <XCircle className="w-16 h-16 text-rust mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Invalid or expired verification link</h1>
        <p className="text-sm text-gray-500">The QR code scanned does not match any authorized profile in the Yatra Sathi network.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-12">
      <div className="bg-moss-green text-white p-6 rounded-b-3xl shadow-md text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-white/90" />
        <h1 className="text-2xl font-bold mb-1">Verified Profile</h1>
        <p className="text-xs uppercase tracking-widest text-white/80 font-bold">Yatra Sathi Network</p>
      </div>

      <div className="p-4 space-y-6 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center text-center relative z-10">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm mb-3">
            <User className="text-moss-green w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{data?.name || "Verified Officer"}</h2>
          <p className="text-sm text-gray-500 font-medium">{data?.home_district || "Authorized Personnel"}</p>
          <div className="mt-4 inline-flex items-center text-[10px] uppercase font-bold text-moss-green bg-moss-green/10 px-3 py-1 rounded-full tracking-wider">
            Identity Confirmed
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 ml-2">Official Documents ({data?.documents?.length || 0})</h3>
          <div className="space-y-3">
            {data?.documents?.map((doc: any, i: number) => {
              const isPdf = doc.file_url.toLowerCase().includes('.pdf');
              return (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-gray-800 capitalize">{doc.document_type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-gray-400 font-bold">VERIFIED</span>
                  </div>
                  {isPdf ? (
                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="block w-full text-center bg-blue-50 text-blue-600 font-bold text-xs py-3 rounded-xl hover:bg-blue-100 transition">
                      View PDF Document
                    </a>
                  ) : (
                    <a href={doc.file_url} target="_blank" rel="noreferrer">
                      <img src={doc.file_url} alt={doc.document_type} className="w-full h-48 object-cover rounded-xl border border-gray-100" />
                    </a>
                  )}
                </div>
              );
            })}
            
            {(!data?.documents || data.documents.length === 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <p className="text-sm text-gray-400 font-bold">No documents uploaded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
