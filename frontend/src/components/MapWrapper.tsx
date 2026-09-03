"use client";
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading map...</div>
});

export default function MapWrapper({ segments, districts, vehicles, suggestedRoutes }: { segments?: any[], districts?: any[], vehicles?: any[], suggestedRoutes?: any[] }) {
  return <Map segments={segments || []} districts={districts || []} vehicles={vehicles || []} suggestedRoutes={suggestedRoutes || []} />;
}
