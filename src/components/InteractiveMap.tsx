import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair, Loader2, Flame, Layers } from 'lucide-react';
import { tWard } from '../i18n/translations';

interface MapMarker {
  id: string;
  title: string;
  wardName: string;
  wardId: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  color: string;
  lat: number;
  lng: number;
}

interface InteractiveMapProps {
  onSelectLocation?: (data: { lat: number; lng: number; wardId: string; address: string }) => void;
  selectedCoords?: { lat: number; lng: number } | null;
  selectedWardId?: string;
  interactive?: boolean;
  highlightWardId?: string;
  language?: 'en' | 'hi';
}

const WARD_CENTERS = [
  { id: 'ward_12', name: 'Ward 12 - Dwarka Sector 12', lat: 28.5912, lng: 77.0423 },
  { id: 'ward_8', name: 'Ward 8 - Dwarka Sector 8', lat: 28.5782, lng: 77.0661 },
  { id: 'ward_5', name: 'Ward 5 - Dwarka Sector 5', lat: 28.5861, lng: 77.053 },
  { id: 'ward_14', name: 'Ward 14 - Dwarka Sector 14', lat: 28.5984, lng: 77.0291 },
];

function inferNearestWard(lat: number, lng: number): { id: string; name: string } {
  let nearest = WARD_CENTERS[0];
  let bestDist = Infinity;
  for (const w of WARD_CENTERS) {
    const d = (w.lat - lat) ** 2 + (w.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      nearest = w;
    }
  }
  return { id: nearest.id, name: nearest.name };
}

function createPinIcon(color: string, active = false): L.DivIcon {
  const size = active ? 22 : 16;
  const ring = active
    ? `box-shadow: 0 0 0 6px rgba(244,81,30,0.28), 0 2px 6px rgba(15,27,45,0.4);`
    : `box-shadow: 0 2px 5px rgba(15,27,45,0.35);`;
  return L.divIcon({
    className: 'ss-leaflet-pin',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2.5px solid #ffffff;${ring}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.55 });
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
    },
  });
  return null;
}

export default function InteractiveMap({
  onSelectLocation,
  selectedCoords,
  selectedWardId,
  interactive = false,
  highlightWardId,
  language = 'en',
}: InteractiveMapProps) {
  const isHi = language === 'hi';

  const fallbackMarkers: MapMarker[] = useMemo(
    () => [
      {
        id: 'SS2026012343',
        title: isHi ? 'सड़क पर गड्ढा' : 'Pothole reported',
        wardName: 'Ward 12 - Dwarka Sector 12',
        wardId: 'ward_12',
        category: 'Roads & Potholes',
        priority: 'CRITICAL',
        color: '#F4511E',
        lat: 28.5912,
        lng: 77.0423,
      },
      {
        id: 'SS2026012281',
        title: isHi ? 'स्ट्रीट लाइट समस्या' : 'Street light issue',
        wardName: 'Ward 8 - Dwarka Sector 8',
        wardId: 'ward_8',
        category: 'Street Lights',
        priority: 'HIGH',
        color: '#F59E0B',
        lat: 28.5782,
        lng: 77.0661,
      },
      {
        id: 'SS2026012174',
        title: isHi ? 'कचरा संग्रहण' : 'Garbage collection',
        wardName: 'Ward 5 - Dwarka Sector 5',
        wardId: 'ward_5',
        category: 'Garbage & Sanitation',
        priority: 'LOW',
        color: '#16A34A',
        lat: 28.5861,
        lng: 77.053,
      },
      {
        id: 'SS2026011987',
        title: isHi ? 'जल निकासी समस्या' : 'Drainage problem',
        wardName: 'Ward 14 - Dwarka Sector 14',
        wardId: 'ward_14',
        category: 'Water & Drainage',
        priority: 'MEDIUM',
        color: '#2563EB',
        lat: 28.5984,
        lng: 77.0291,
      },
    ],
    [isHi],
  );

  const [hotspots, setHotspots] = useState<MapMarker[]>(fallbackMarkers);
  const [isLocating, setIsLocating] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'heatmap'>('standard');
  const [clickPin, setClickPin] = useState<{ lat: number; lng: number }>(
    selectedCoords && selectedCoords.lat && selectedCoords.lng
      ? { lat: selectedCoords.lat, lng: selectedCoords.lng }
      : { lat: 28.5823, lng: 77.05 },
  );

  // Sync hotspots when language updates
  useEffect(() => {
    setHotspots((prev) => (prev.length === 4 && prev[0].id === 'SS2026012343' ? fallbackMarkers : prev));
  }, [fallbackMarkers]);

  // Fetch live map hotspots when DB is available
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/public/stats', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.available && Array.isArray(data.hotspots) && data.hotspots.length > 0) {
          const live: MapMarker[] = data.hotspots
            .filter((h: any) => typeof h.latitude === 'number' && typeof h.longitude === 'number')
            .map((h: any) => {
              const prio = (h.priority || 'MEDIUM') as MapMarker['priority'];
              const color =
                prio === 'CRITICAL' || prio === 'HIGH'
                  ? '#EF4444'
                  : prio === 'MEDIUM'
                  ? '#F59E0B'
                  : '#16A34A';
              const nearest = inferNearestWard(h.latitude, h.longitude);
              return {
                id: h.publicReference || `${h.latitude}_${h.longitude}`,
                title: h.category || 'Civic Issue',
                wardName: h.area || nearest.name,
                wardId: nearest.id,
                category: h.category || 'General',
                priority: prio,
                color,
                lat: h.latitude,
                lng: h.longitude,
              };
            });
          if (live.length > 0) setHotspots(live);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Sync external selectedCoords
  useEffect(() => {
    if (selectedCoords && selectedCoords.lat && selectedCoords.lng) {
      setClickPin({ lat: selectedCoords.lat, lng: selectedCoords.lng });
    }
  }, [selectedCoords?.lat, selectedCoords?.lng]);

  const emitPickedLocation = async (lat: number, lng: number, preferredWardId?: string) => {
    setClickPin({ lat, lng });
    if (!onSelectLocation) return;

    const inferred = inferNearestWard(lat, lng);
    const resolvedWardId = preferredWardId || selectedWardId || inferred.id;
    let resolvedAddress = isHi
      ? `पिन किया गया स्थान (${lat}, ${lng}), द्वारका, दिल्ली`
      : `Pinned Location (${lat}, ${lng}), Dwarka, Delhi`;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const street = addr.road || addr.suburb || addr.neighbourhood || addr.quarter;
        if (street) {
          resolvedAddress = `${street}, Dwarka, Delhi`;
        }
      }
    } catch {
      // Keep clean coordinate fallback
    }

    onSelectLocation({
      lat,
      lng,
      wardId: resolvedWardId,
      address: resolvedAddress,
    });
  };

  const handleMapLiveGps = () => {
    if (!navigator.geolocation) {
      alert(isHi ? 'आपका ब्राउज़र जियोलोकेशन का समर्थन नहीं करता।' : 'Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        await emitPickedLocation(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        alert(
          isHi
            ? `लोकेशन त्रुटि: ${err.message}। कृपया लोकेशन अनुमति चालू करें।`
            : `Location access error: ${err.message}. Please enable location permissions.`,
        );
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const selectedIcon = useMemo(() => createPinIcon('#F4511E', true), []);

  return (
    <div className="relative w-full h-full min-h-[320px] bg-slate-100 border border-[#E5E7EB] rounded-xl overflow-hidden select-none">
      {/* Header Overlay Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-[500] gap-2 flex-wrap">
        <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] shadow-xs text-xs font-semibold text-[#0F1B2D] pointer-events-auto flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#F4511E]" />
          <span>
            {interactive
              ? isHi
                ? 'पिन लगाने के लिए मानचित्र पर क्लिक करें'
                : 'Click map to drop grievance pin'
              : isHi
              ? '🗺️ लाइव Leaflet वार्ड मानचित्र'
              : '🗺️ Live Leaflet Ward Map'}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Mode Switcher: Standard vs Heatmap */}
          <div className="bg-white/95 backdrop-blur-xs p-0.5 rounded-lg border border-[#E5E7EB] shadow-xs flex text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('standard')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                viewMode === 'standard' ? 'bg-[#0F1B2D] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{isHi ? 'सामान्य' : 'Standard'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('heatmap')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                viewMode === 'heatmap' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-300" />
              <span>{isHi ? 'हीटमैप' : 'Civic Heatmap'}</span>
            </button>
          </div>

          {interactive && (
            <button
              type="button"
              onClick={handleMapLiveGps}
              disabled={isLocating}
              className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-xs text-xs font-bold pointer-events-auto flex items-center gap-1.5 transition-all"
              title={isHi ? 'डिवाइस GPS से लाइव स्थान प्राप्त करें' : 'Fetch live location using device GPS'}
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4511E]" />
                  <span className="text-[11px]">{isHi ? 'खोज रहे हैं...' : 'Locating...'}</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-3.5 h-3.5 text-[#F4511E]" />
                  <span className="text-[11px]">{isHi ? 'मेरा GPS लें' : 'Fetch My GPS'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Real Leaflet Interactive Map */}
      <MapContainer
        center={[clickPin.lat, clickPin.lng]}
        zoom={14}
        scrollWheelZoom={interactive}
        className="w-full h-full min-h-[320px] z-0"
        style={{ minHeight: '320px', height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter lat={clickPin.lat} lng={clickPin.lng} />
        <MapClickHandler enabled={interactive} onPick={(lt, lg) => void emitPickedLocation(lt, lg)} />

        {/* Hotspot Markers & Optional Heatmap Circles */}
        {hotspots.map((m) => (
          <React.Fragment key={m.id}>
            {viewMode === 'heatmap' && (
              <Circle
                center={[m.lat, m.lng]}
                radius={m.priority === 'CRITICAL' ? 420 : m.priority === 'HIGH' ? 320 : 220}
                pathOptions={{
                  color: m.color,
                  fillColor: m.color,
                  fillOpacity: 0.35,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="text-xs font-sans space-y-1">
                    <p className="font-bold text-[#0F1B2D]">{m.title}</p>
                    <p className="text-slate-600">{tWard(m.wardId, language, m.wardName)}</p>
                    <p className="font-mono text-[10px] text-[#F4511E]">{m.id}</p>
                  </div>
                </Popup>
              </Circle>
            )}
            <Marker position={[m.lat, m.lng]} icon={createPinIcon(m.color)}>
              <Popup>
                <div className="text-xs font-sans space-y-1">
                  <p className="font-bold text-[#0F1B2D]">{m.title}</p>
                  <p className="text-slate-600">{tWard(m.wardId, language, m.wardName)}</p>
                  <p className="font-mono text-[10px] text-[#F4511E]">{m.id}</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* Active Dropped Pin */}
        {interactive && (
          <Marker position={[clickPin.lat, clickPin.lng]} icon={selectedIcon}>
            <Popup>
              <div className="text-xs font-sans">
                <p className="font-bold text-[#0F1B2D]">
                  {isHi ? 'चयनित शिकायत स्थान' : 'Selected Grievance Pin'}
                </p>
                <p className="font-mono text-[10px] text-slate-600">
                  {clickPin.lat.toFixed(5)}, {clickPin.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Heatmap Legend Floating Bar */}
      {viewMode === 'heatmap' && (
        <div className="absolute top-16 right-3 bg-slate-900/90 text-white backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-lg text-[10px] space-y-1.5 pointer-events-auto z-[500]">
          <span className="font-extrabold uppercase tracking-wider text-amber-400 block text-[9px]">
            {isHi ? '🔥 शिकायत घनत्व क्षेत्र' : '🔥 Civic Complaint Density'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <span>{isHi ? 'उच्च घनत्व (>15 समस्याएँ)' : 'High Density Zone (>15 issues)'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>{isHi ? 'मध्यम क्लस्टर (5-15)' : 'Moderate Cluster (5-15)'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{isHi ? 'सामान्य (<5 समस्याएँ)' : 'Normal (<5 issues)'}</span>
          </div>
        </div>
      )}

      {/* Quick Civic Hotspots Tray */}
      {interactive && (
        <div className="absolute bottom-16 left-3 right-3 flex items-center gap-1.5 overflow-x-auto pb-1 z-[500] pointer-events-auto">
          {fallbackMarkers.map((m) => {
            const isSelected = Math.abs(clickPin.lat - m.lat) < 0.005 && Math.abs(clickPin.lng - m.lng) < 0.005;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setClickPin({ lat: m.lat, lng: m.lng });
                  if (onSelectLocation) {
                    onSelectLocation({
                      lat: m.lat,
                      lng: m.lng,
                      wardId: m.wardId,
                      address: `${m.title}, ${tWard(m.wardId, language, m.wardName)}, Dwarka, Delhi`,
                    });
                  }
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition-all cursor-pointer shadow-xs border flex items-center gap-1 ${
                  isSelected || highlightWardId === m.wardId
                    ? 'bg-[#0F1B2D] text-white border-slate-900 ring-2 ring-orange-500/50'
                    : 'bg-white/95 hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                <span>
                  {m.title} ({tWard(m.wardId, language, m.wardName).split('-')[1]?.trim() || m.wardName})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Interactive Selected Coordinates display */}
      {interactive && (
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-[#E5E7EB] shadow-xs text-xs z-[500] flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] text-[#64748B] font-mono">
            <span>LAT: {clickPin.lat.toFixed(4)}</span>
            <span>LNG: {clickPin.lng.toFixed(4)}</span>
            <span className="font-sans font-semibold text-[#16A34A] bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
              {isHi ? 'लाइव GPS सिंक' : 'LIVE GPS SYNCED'}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#0F172A] truncate">
            {isHi ? '📍 द्वारका, दिल्ली निर्देशांक सक्रिय' : '📍 Dwarka, Delhi Coordinates Active'}
          </p>
        </div>
      )}
    </div>
  );
}
