"use client";

import { Home, AlertTriangle, Truck, User, ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/useLanguage";
import { t } from "@/lib/i18n";

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const tabs = [
    { name: t("home", lang), href: "/", icon: Home },
    { name: t("reportIssue", lang), href: "/report", icon: AlertTriangle },
    { name: t("sos", lang), href: "/sos", icon: ShieldAlert },
    { name: t("track", lang), href: "/transport", icon: Truck },
    { name: t("profile", lang), href: "/profile", icon: User },
  ];

  // Don't show bottom nav on login page if we want it isolated, 
  // but the prompt says "present on every screen", so we'll keep it globally or hide it conditionally.
  // We'll hide it on login to match native app feel, though prompt didn't explicitly demand it.
  if (pathname === "/login") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || (tab.href === "/transport" && pathname.startsWith("/transport"));
        
        return (
          <Link href={tab.href} key={tab.href} className="flex flex-col items-center justify-center w-full h-full">
            <Icon 
              size={24} 
              className={`mb-1 transition-colors ${isActive ? "text-[#FF9933]" : "text-gray-400"}`} 
            />
            <span className={`text-[10px] font-bold transition-colors ${isActive ? "text-[#138808]" : "text-gray-500"}`}>
              {tab.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
