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

export default function Map({ segments, districts, vehicles = [], suggestedRoutes = [] }: { segments: any[], districts: any[], vehicles?: any[], suggestedRoutes?: any[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clear': return '#4a5d23'; // moss-green
      case 'at_risk': return '#ffbf00'; // amber
      case 'blocked': return '#b7410e'; // rust
      default: return '#9ca3af'; // gray
    }
  };

  return (
    <MapContainer center={[25.5, 92.5]} zoom={7} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {/* Districts */}
      {districts.map(d => (
        <Marker key={d.id} position={[d.lat, d.lng]} icon={icon}>
          <Popup>
            <strong>{d.name}</strong><br/>
            Status: {d.connectivity_status}
          </Popup>
        </Marker>
      ))}

      {/* Road Segments */}
      {segments.map(s => {
        const color = getStatusColor(s.current_status);
        // Place the marker at the midpoint of the segment
        const midLat = (s.start_lat + s.end_lat) / 2;
        const midLng = (s.start_lng + s.end_lng) / 2;
        
        // Custom icon for road segment marker
        const segmentIcon = L.divIcon({
          className: 'custom-segment-icon',
          html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        return (
          <Marker key={s.id} position={[midLat, midLng]} icon={segmentIcon}>
            <Popup>
              <strong>{s.name}</strong><br/>
              Status: {s.current_status}<br/>
              Risk Score: {s.risk_score.toFixed(2)}
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
      {suggestedRoutes.map((r, i) => {
        // Swap [lng, lat] from OSRM to [lat, lng] for Leaflet
        const path = r.coordinates.map((c: number[]) => [c[1], c[0]]);
        const color = r.risk_category === 'low' ? '#138808' : r.risk_category === 'elevated' ? '#ffbf00' : '#b7410e';
        return (
          <Polyline 
            key={i} 
            positions={path} 
            color={color} 
            weight={6} 
            opacity={0.8} 
          >
            <Popup>
              <strong>Route {i + 1}</strong><br/>
              Risk: {r.risk_category}<br/>
              ETA: {r.eta_minutes} mins
            </Popup>
          </Polyline>
        );
      })}
    </MapContainer>
  );
}
