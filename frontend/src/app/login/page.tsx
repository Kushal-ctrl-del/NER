"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      router.push("/transport");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 items-center justify-center">
      <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-bold font-sans text-center mb-6">
          <span className="text-[#FF9933]">Yatra</span>
          <span className="text-[#2a2a2a]"> </span>
          <span className="text-[#138808]">Sathi</span>
        </h1>
        
        <h2 className="text-xl font-bold text-center mb-6 text-gray-700">
          Official Logistics Access
        </h2>

        {error && <div className="bg-rust/10 border border-rust text-rust p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-moss-green" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-moss-green" 
              required 
            />
          </div>
          
          <button type="submit" className="w-full bg-moss-green text-white font-bold py-2 rounded hover:bg-opacity-90 transition">
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm text-gray-500 hover:text-moss-green hover:underline font-semibold"
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
