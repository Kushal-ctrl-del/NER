import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yatra Sathi",
  description: "AI-Based Smart Logistics and Accessibility Intelligence Platform for NER",
  manifest: "/manifest.json",
  themeColor: "#138808",
  appleWebApp: {
    capable: true,
    title: "Yatra Sathi",
    statusBarStyle: "default",
  },
};

import BottomNav from "@/components/BottomNav";

import Splash from "@/components/Splash";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} pb-16 bg-gray-50 min-h-screen text-gray-900`}>
        <Splash />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
