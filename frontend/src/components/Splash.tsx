"use client";

import { useEffect, useState } from "react";

export default function Splash() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFade(true), 1500); // Start fading out after 1.5s
    const timer2 = setTimeout(() => setShow(false), 2000); // Remove from DOM after 2s

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#1a1a1a] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${fade ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <img src="/logo.png" alt="Yatra Sathi Logo" className="w-32 h-32 rounded-full shadow-2xl mb-4" />
        <h1 className="text-4xl font-bold font-sans">
          <span className="text-[#FF9933]">Yatra</span>
          <span className="text-white"> </span>
          <span className="text-[#138808]">Sathi</span>
        </h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Smart Logistics Platform</p>
      </div>
      
      <div className="absolute bottom-10 flex gap-2">
         <div className="w-16 h-1 bg-[#FF9933] rounded"></div>
         <div className="w-16 h-1 bg-white rounded"></div>
         <div className="w-16 h-1 bg-[#138808] rounded"></div>
      </div>
    </div>
  );
}
