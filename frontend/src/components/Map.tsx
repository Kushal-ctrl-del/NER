"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function SegmentPopupContent({ segment }: { segment: any }) {
  const [congestion, setCongestion] = useState<{ congestion_proxy?: number, basis?: string } | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/road-segments/${segment.id}/congestion-proxy`)
      .then(res => res.json())
      .then(data => setCongestion(data))
      .catch(console.error);
  }, [segment.id]);

  return (
    <div className="text-xs">
      <strong>{segment.name}</strong><br/>
      Status: {segment.current_status}<br/>
      Risk Score: {segment.risk_score.toFixed(2)}<br/>
      {congestion ? (
        <div className="mt-2 p-1 bg-blue-50 border border-blue-200 rounded">
          <strong>Activity-based congestion proxy (not live traffic data):</strong><br/>
          Score: {congestion.congestion_proxy}<br/>
          <em className="text-[9px] text-gray-500">{congestion.basis}</em>
        </div>
      ) : (
        <div className="mt-2 text-gray-400">Loading congestion proxy...</div>
      )}
    </div>
  );
}

export function MapContent({ segments, districts, vehicles = [], suggestedRoutes = [] }: { segments: any[], districts: any[], vehicles?: any[], suggestedRoutes?: any[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clear': return '#4a5d23'; // moss-green
      case 'at_risk': return '#ffbf00'; // amber
      case 'blocked': return '#b7410e'; // rust
      default: return '#9ca3af'; // gray
    }
  };

  const map = useMap();

  useEffect(() => {
    if (suggestedRoutes && suggestedRoutes.length > 0) {
      const allCoords = suggestedRoutes.flatMap((r: any) => 
        r.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number])
      );
      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [suggestedRoutes, map]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {/* Districts */}
      {districts?.map(d => (
        <Marker key={d.id} position={[d.lat, d.lng]} icon={icon}>
          <Popup>
            <strong>{d.name}</strong><br/>
            Status: {d.connectivity_status}
          </Popup>
        </Marker>
      ))}

      {/* Road Segments */}
      {segments?.map(s => {
        const color = getStatusColor(s.current_status);
        const midLat = (s.start_lat + s.end_lat) / 2;
        const midLng = (s.start_lng + s.end_lng) / 2;
        
        const segmentIcon = L.divIcon({
          className: 'custom-segment-icon',
          html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        return (
          <Marker key={s.id} position={[midLat, midLng]} icon={segmentIcon}>
            <Popup>
              <SegmentPopupContent segment={s} />
            </Popup>
          </Marker>
        )
      })}
      {vehicles?.filter(v => v.current_lat && v.current_lng).map(v => (
        <Marker key={v.id} position={[v.current_lat, v.current_lng]}>
          <Popup>
            <strong>Vehicle: {v.vehicle_number}</strong><br/>
            Driver: {v.driver_name}<br/>
            Status: {v.status}
          </Popup>
        </Marker>
      ))}

      {/* Suggested Routes */}
      {suggestedRoutes?.map((r, i) => {
        const path = r.coordinates.map((c: number[]) => [c[1], c[0]]);
        let color = '#3b82f6'; // default blue for unknown
        if (r.risk_category === 'low') color = '#138808';
        else if (r.risk_category === 'elevated') color = '#ffbf00';
        else if (r.risk_category === 'blocked' || r.risk_category === 'high') color = '#b7410e';
        
        const isAlt = i > 0;
        
        return (
          <div key={i}>
            <Polyline 
              positions={path} 
              color={isAlt ? '#9ca3af' : color} 
              weight={isAlt ? 4 : 6} 
              opacity={isAlt ? 0.6 : 0.8} 
              dashArray={isAlt ? "10, 10" : undefined}
            >
              <Popup>
                <strong>{i === 0 ? "Fastest: " : "Alt: "} Via {r.summary || `Route ${i+1}`}</strong><br/>
                Risk: {r.risk_category}<br/>
                ETA: {r.eta_minutes} mins
              </Popup>
            </Polyline>
            
            {/* Origin Marker */}
            {path.length > 0 && (
              <Marker position={path[0] as [number, number]} icon={L.divIcon({
                className: 'origin-icon',
                html: `<div style="background-color: #138808; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">A</div>`,
                iconSize: [24, 24], iconAnchor: [12, 12]
              })} />
            )}
            
            {/* Destination Marker */}
            {path.length > 1 && (
              <Marker position={path[path.length - 1] as [number, number]} icon={L.divIcon({
                className: 'dest-icon',
                html: `<div style="background-color: #b7410e; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">B</div>`,
                iconSize: [24, 24], iconAnchor: [12, 12]
              })} />
            )}
          </div>
        );
      })}
    </>
  );
}

export default function Map({ segments = [], districts = [], vehicles = [], suggestedRoutes = [] }: { segments?: any[], districts?: any[], vehicles?: any[], suggestedRoutes?: any[] }) {
  return (
    <MapContainer center={[25.5, 92.5]} zoom={7} style={{ height: '100%', width: '100%' }}>
      <MapContent segments={segments} districts={districts} vehicles={vehicles} suggestedRoutes={suggestedRoutes} />
    </MapContainer>
  );
}
