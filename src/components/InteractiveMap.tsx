import React, { useState, useEffect } from 'react';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';

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
  // Dwarka, Delhi civic markers
  const initialMarkers: MapMarker[] = [
    {
      id: 'SS2026012343',
      title: 'Pothole reported',
      wardName: 'Ward 12 - Dwarka Sector 12',
      wardId: 'ward_12',
      category: 'Roads & Potholes',
      color: '#F4511E', // Orange
      x: 55,
      y: 25,
      lat: 28.5912,
      lng: 77.0423,
    },
    {
      id: 'SS2026012281',
      title: 'Street light issue',
      wardName: 'Ward 8 - Dwarka Sector 8',
      wardId: 'ward_8',
      category: 'Street Lights',
      color: '#F59E0B', // Amber
      x: 70,
      y: 32,
      lat: 28.5782,
      lng: 77.0661,
    },
    {
      id: 'SS2026012174',
      title: 'Garbage collection',
      wardName: 'Ward 5 - Dwarka Sector 5',
      wardId: 'ward_5',
      category: 'Garbage & Sanitation',
      color: '#16A34A', // Green
      x: 58,
      y: 52,
      lat: 28.5861,
      lng: 77.0530,
    },
    {
      id: 'SS2026011987',
      title: 'Drainage problem',
      wardName: 'Ward 14 - Dwarka Sector 14',
      wardId: 'ward_14',
      category: 'Water & Drainage',
      color: '#2563EB', // Blue
      x: 68,
      y: 65,
      lat: 28.5984,
      lng: 77.0291,
    },
  ];

  const [activeHoverMarker, setActiveHoverMarker] = useState<MapMarker | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [clickPin, setClickPin] = useState<{ x: number; y: number; lat: number; lng: number } | null>(
    selectedCoords
      ? {
          x: 50,
          y: 50,
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
        }
      : {
          x: 50,
          y: 50,
          lat: 28.5823,
          lng: 77.0500,
        }
  );

  // Sync state if parent selectedCoords change (e.g. from GPS button in RaiseComplaintPage)
  useEffect(() => {
    if (selectedCoords && selectedCoords.lat && selectedCoords.lng) {
      setClickPin({
        x: 50,
        y: 50,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
      });
    }
  }, [selectedCoords?.lat, selectedCoords?.lng]);

  // Fetch real-time GPS directly from the map
  const handleMapLiveGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setClickPin({ x: 50, y: 50, lat, lng });

        if (onSelectLocation) {
          // Attempt reverse geocode
          let resolvedAddress = `Live GPS (${lat}, ${lng}), Dwarka, Delhi`;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const street = addr.road || addr.suburb || addr.neighbourhood || 'Current Location';
              resolvedAddress = `${street}, Dwarka, Delhi`;
            }
          } catch {
            // Keep fallback
          }

          onSelectLocation({
            lat,
            lng,
            wardId: selectedWardId || 'ward_12',
            address: resolvedAddress,
          });
        }
      },
      (err) => {
        setIsLocating(false);
        alert(`Location access error: ${err.message}. Please enable location permissions.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-50 border border-[#E5E7EB] rounded-xl overflow-hidden select-none">
      {/* Header Overlay Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10 gap-2">
        <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] shadow-xs text-xs font-semibold text-[#0F1B2D] pointer-events-auto flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#F4511E]" />
          <span>{interactive ? 'Live GPS Civic Map · Dwarka, Delhi' : '🗺️ Interactive Ward Map'}</span>
        </div>

        {interactive && (
          <button
            type="button"
            onClick={handleMapLiveGps}
            disabled={isLocating}
            className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-xs text-xs font-bold pointer-events-auto flex items-center gap-1.5 transition-all"
            title="Fetch live location using device GPS"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4511E]" />
                <span className="text-[11px]">Locating...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-3.5 h-3.5 text-[#F4511E]" />
                <span className="text-[11px]">Fetch My GPS</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Active Live Google Maps via Iframe (Centered on live lat/lng) */}
      <iframe
        src={`https://maps.google.com/maps?q=${clickPin ? `${clickPin.lat},${clickPin.lng}` : 'Dwarka, Delhi'}&t=&z=${clickPin ? '16' : '14'}&ie=UTF8&iwloc=&output=embed`}
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
            <span className="font-sans font-semibold text-[#16A34A] bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
              LIVE GPS SYNCED
            </span>
          </div>
          <p className="text-xs font-semibold text-[#0F172A] truncate">
            📍 Dwarka, Delhi Coordinates Active
          </p>
        </div>
      )}
    </div>
  );
}
