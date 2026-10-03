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

      {/* SVG Canvas representing roads, wards, water, zones */}
      <svg
        className="w-full h-full min-h-[300px] cursor-crosshair"
        viewBox="0 0 200 100"
        preserveAspectRatio="xMidYMid slice"
        onClick={handleMapClick}
      >
        {/* Render Ward Polygons */}
        {wardPolygons.map((ward) => {
          const isHighlighted = highlightWardId === ward.id || selectedWardId === ward.id;
          return (
            <polygon
              key={ward.id}
              points={ward.points}
              fill={ward.color}
              stroke={isHighlighted ? '#F4511E' : ward.borderColor}
              strokeWidth={isHighlighted ? '1.5' : '0.5'}
              className="transition-colors duration-200"
              opacity={highlightWardId && !isHighlighted ? 0.4 : 0.95}
            />
          );
        })}

        {/* Diagonal Water Body / River */}
        <path
          d="M 120,0 Q 115,25 108,45 T 100,65 T 75,100"
          fill="none"
          stroke="#93C5FD"
          strokeWidth="8"
          opacity="0.85"
        />
        <path
          d="M 120,0 Q 115,25 108,45 T 100,65 T 75,100"
          fill="none"
          stroke="#60A5FA"
          strokeWidth="3"
          opacity="0.5"
        />

        {/* Bridge Over Water Body */}
        <line x1="94" y1="58" x2="114" y2="58" stroke="#1E293B" strokeWidth="4" />
        <line x1="94" y1="56" x2="114" y2="56" stroke="#FFFFFF" strokeWidth="1" />

        {/* Roads & Highways */}
        {/* Highway Bypass (Horizontal-ish) */}
        <path
          d="M 0,40 C 50,45 150,38 200,43"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 0,40 C 50,45 150,38 200,43"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="1"
          strokeDasharray="2,3"
        />

        {/* Ward 12 Main Avenue */}
        <path
          d="M 40,0 L 50,42 L 55,100"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="3.5"
        />
        <path
          d="M 40,0 L 50,42 L 55,100"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="0.8"
          strokeDasharray="2,2"
        />

        {/* Ram Mandir Street */}
        <path
          d="M 140,0 L 130,42 L 155,100"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="3"
        />

        {/* Labeling Wards */}
        {wardPolygons.map((ward) => (
          <text
            key={`text-${ward.id}`}
            x={ward.centerText.x}
            y={ward.centerText.y}
            fill="#64748B"
            fontSize="4"
            fontWeight="bold"
            textAnchor="middle"
            className="pointer-events-none tracking-wider opacity-60 uppercase"
          >
            {ward.name.split(' (')[0]}
          </text>
        ))}

        {/* Major landmark markers on SVG */}
        <circle cx="28" cy="25" r="1.5" fill="#94A3B8" />
        <text x="28" y="22" fill="#64748B" fontSize="2.5" textAnchor="middle">Shivaji Square</text>

        <circle cx="155" cy="22" r="1.5" fill="#94A3B8" />
        <text x="155" y="19" fill="#64748B" fontSize="2.5" textAnchor="middle">Ram Temple</text>

        <circle cx="165" cy="72" r="1.5" fill="#94A3B8" />
        <text x="165" y="69" fill="#64748B" fontSize="2.5" textAnchor="middle">Gokul Market</text>

        {/* Floating Interactive Issue Markers (only shown in landing mode, not when pinning coordinates) */}
        {!interactive &&
          initialMarkers.map((marker) => (
            <g
              key={marker.id}
              className="cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                // If clicked, we can show information
                setActiveHoverMarker(marker);
              }}
              onMouseEnter={() => setActiveHoverMarker(marker)}
              onMouseLeave={() => setActiveHoverMarker(null)}
            >
              {/* Outer pulsing ring */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r="3.5"
                fill={marker.color}
                opacity="0.25"
                className="animate-ping"
              />
              {/* Inner core marker */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r="2"
                fill={marker.color}
                stroke="#FFFFFF"
                strokeWidth="0.5"
                className="transition-transform group-hover:scale-125"
              />
            </g>
          ))}

        {/* Interactive Placement Pin (when interactive is true and coordinate is selected) */}
        {interactive && clickPin && (
          <g>
            {/* Pulsing effect */}
            <circle cx={clickPin.x} cy={clickPin.y} r="5" fill="#F4511E" opacity="0.2" className="animate-ping" />
            {/* Custom map pin path */}
            <path
              d={`M ${clickPin.x} ${clickPin.y} C ${clickPin.x - 2} ${clickPin.y - 4}, ${clickPin.x - 3} ${
                clickPin.y - 7
              }, ${clickPin.x} ${clickPin.y - 8} C ${clickPin.x + 3} ${clickPin.y - 7}, ${clickPin.x + 2} ${
                clickPin.y - 4
              }, ${clickPin.x} ${clickPin.y}`}
              fill="#F4511E"
              stroke="#FFFFFF"
              strokeWidth="0.5"
            />
            <circle cx={clickPin.x} cy={clickPin.y - 5.5} r="1" fill="#FFFFFF" />
          </g>
        )}
      </svg>

      {/* Floating Tooltip details for hover markers */}
      {activeHoverMarker && (
        <div
          className="absolute bg-white border border-[#E5E7EB] rounded-lg shadow-md p-3 z-20 pointer-events-none max-w-xs transition-opacity duration-150"
          style={{
            left: `${activeHoverMarker.x > 70 ? activeHoverMarker.x - 25 : activeHoverMarker.x}%`,
            top: `${activeHoverMarker.y > 60 ? activeHoverMarker.y - 25 : activeHoverMarker.y + 5}%`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeHoverMarker.color }}
            />
            <h4 className="font-bold text-[#0F172A] text-xs leading-tight">{activeHoverMarker.title}</h4>
          </div>
          <p className="text-[10px] text-[#64748B] mb-1">
            {activeHoverMarker.category} · {activeHoverMarker.id}
          </p>
          <p className="text-[10px] font-medium text-[#0F1B2D]">
            📍 {activeHoverMarker.wardName}
          </p>
        </div>
      )}

      {/* Interactive Selected Coordinates display */}
      {interactive && clickPin && (
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-[#E5E7EB] shadow-xs text-xs z-10 flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] text-[#64748B] font-mono">
            <span>LAT: {clickPin.lat.toFixed(4)}</span>
            <span>LNG: {clickPin.lng.toFixed(4)}</span>
            <span className="font-sans font-semibold text-[#16A34A] bg-emerald-50 px-1 rounded">PINNED</span>
          </div>
          <p className="text-xs font-semibold text-[#0F172A] truncate">
            📍 Simulated Address: <span className="font-normal text-[#475569]">Block {Math.floor(clickPin.lat * 1000) % 20 + 1}, Amravati</span>
          </p>
        </div>
      )}
    </div>
  );
}
