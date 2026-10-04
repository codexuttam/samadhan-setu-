import React, { useState } from 'react';

interface MapMarker {
  id: string;
  title: string;
  wardName: string;
  wardId: string;
  category: string;
  color: string;
  x: number; // percentage coordinate on SVG
  y: number; // percentage coordinate on SVG
  lat: number;
  lng: number;
}

interface InteractiveMapProps {
  onSelectLocation?: (data: { lat: number; lng: number; wardId: string; address: string }) => void;
  selectedCoords?: { lat: number; lng: number } | null;
  selectedWardId?: string;
  interactive?: boolean;
  highlightWardId?: string;
}

export default function InteractiveMap({
  onSelectLocation,
  selectedCoords,
  selectedWardId,
  interactive = false,
  highlightWardId,
}: InteractiveMapProps) {
  // Floating issue markers as described on the landing page
  const initialMarkers: MapMarker[] = [
    {
      id: 'SS2025012343',
      title: 'Pothole reported',
      wardName: 'Ward 12 - Parvati Nagar',
      wardId: 'ward_12',
      category: 'Roads & Potholes',
      color: '#F4511E', // Orange
      x: 55,
      y: 25,
      lat: 20.9320,
      lng: 77.7523,
    },
    {
      id: 'SS2025012281',
      title: 'Street light issue',
      wardName: 'Ward 8 - Ram Nagar',
      wardId: 'ward_8',
      category: 'Street Lights',
      color: '#F59E0B', // Amber
      x: 70,
      y: 32,
      lat: 20.9382,
      lng: 77.7561,
    },
    {
      id: 'SS2025012174',
      title: 'Garbage collection',
      wardName: 'Ward 5 - Shivaji Nagar',
      wardId: 'ward_5',
      category: 'Garbage & Sanitation',
      color: '#16A34A', // Green
      x: 58,
      y: 52,
      lat: 20.9411,
      lng: 77.7490,
    },
    {
      id: 'SS2025011987',
      title: 'Drainage problem',
      wardName: 'Ward 14 - Gokul Nagar',
      wardId: 'ward_14',
      category: 'Water & Drainage',
      color: '#2563EB', // Blue
      x: 68,
      y: 65,
      lat: 20.9254,
      lng: 77.7601,
    },
  ];

  const [activeHoverMarker, setActiveHoverMarker] = useState<MapMarker | null>(null);
  const [clickPin, setClickPin] = useState<{ x: number; y: number; lat: number; lng: number } | null>(
    selectedCoords
      ? {
          x: 50 + (selectedCoords.lng - 77.7500) * 1200,
          y: 50 - (selectedCoords.lat - 20.9300) * 1200,
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
        }
      : null
  );

  // Ward layout definitions for rendering polygons
  const wardPolygons = [
    {
      id: 'ward_12',
      name: 'Ward 12 (Parvati Nagar)',
      points: '10,10 90,10 130,45 60,50 10,40',
      color: '#F0F9FF', // Light sky blue
      borderColor: '#BAE6FD',
      centerText: { x: 50, y: 22 },
    },
    {
      id: 'ward_8',
      name: 'Ward 8 (Ram Nagar)',
      points: '90,10 190,10 180,45 130,45',
      color: '#FEF3C7', // Light yellow-gold
      borderColor: '#FDE68A',
      centerText: { x: 135, y: 22 },
    },
    {
      id: 'ward_5',
      name: 'Ward 5 (Shivaji Nagar)',
      points: '10,40 60,50 85,90 10,90',
      color: '#ECFDF5', // Light green
      borderColor: '#A7F3D0',
      centerText: { x: 40, y: 70 },
    },
    {
      id: 'ward_14',
      name: 'Ward 14 (Gokul Nagar)',
      points: '60,50 130,45 180,45 190,90 85,90',
      color: '#EEF2F6', // Light gray slate
      borderColor: '#E2E8F0',
      centerText: { x: 130, y: 70 },
    },
  ];

  // Map clicks inside form flow
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onSelectLocation) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert SVG pixel dimensions to percentage coordinates
    const pctX = (clickX / rect.width) * 100;
    const pctY = (clickY / rect.height) * 100;

    // Calculate simulated lat/lng centered near Amravati (20.9300, 77.7500)
    const lat = Math.round((20.9300 + (50 - pctY) * 0.0004) * 10000) / 10000;
    const lng = Math.round((77.7500 + (pctX - 50) * 0.0004) * 10000) / 10000;

    // Determine which ward polygon the click fell closest to
    let detectedWardId = 'ward_12';
    if (pctX > 50 && pctY < 50) detectedWardId = 'ward_8';
    else if (pctX <= 50 && pctY >= 50) detectedWardId = 'ward_5';
    else if (pctX > 50 && pctY >= 50) detectedWardId = 'ward_14';

    const wardObj = wardPolygons.find((w) => w.id === detectedWardId);
    const simulatedAddress = `Plot ${Math.floor(Math.random() * 80) + 1}, Block C, Near Main Circle, ${
      wardObj ? wardObj.name.split(' (')[1].replace(')', '') : 'Amravati'
    }`;

    setClickPin({ x: pctX, y: pctY, lat, lng });
    onSelectLocation({ lat, lng, wardId: detectedWardId, address: simulatedAddress });
  };

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-50 border border-[#E5E7EB] rounded-xl overflow-hidden select-none">
      {/* Absolute Header overlay */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] shadow-xs text-xs font-semibold text-[#0F1B2D] z-10">
        {interactive ? '📍 Click anywhere on the map to pin location' : '🗺️ Interactive Ward Map'}
      </div>

      {/* Active Live Map via Iframe */}
      <iframe
        src={`https://maps.google.com/maps?q=${clickPin ? `${clickPin.lat},${clickPin.lng}` : 'Amravati,Maharashtra'}&t=&z=${clickPin ? '16' : '13'}&ie=UTF8&iwloc=&output=embed`}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: '300px' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Civic Map"
      ></iframe>

      {/* Interactive Selected Coordinates display */}
      {interactive && clickPin && (
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-[#E5E7EB] shadow-xs text-xs z-10 flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] text-[#64748B] font-mono">
            <span>LAT: {clickPin.lat.toFixed(4)}</span>
            <span>LNG: {clickPin.lng.toFixed(4)}</span>
            <span className="font-sans font-semibold text-[#16A34A] bg-emerald-50 px-1 rounded">PINNED</span>
          </div>
          <p className="text-xs font-semibold text-[#0F172A] truncate">
            📍 Location Pinned
          </p>
        </div>
      )}
    </div>
  );
}
