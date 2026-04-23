import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinates } from '../types/mission';

// Inline Custom Icons per evitare problemi di cache/caricamento di immagini esterne e per avere un look "INNOVA Tech"
const boatIcon = new L.DivIcon({
  className: 'bg-transparent border-none',
  html: `<div class="map-marker-inner" style="width: 28px; height: 28px; border-radius: 50%; background: rgba(8, 51, 68, 0.8); border: 2px solid #22d3ee; display: flex; align-items: center; justify-content: center; color: #22d3ee; font-weight: bold; font-family: monospace; font-size: 9px; box-shadow: 0 0 10px rgba(34,211,238,0.5); backdrop-filter: blur(4px);">USV</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const auvIcon = new L.DivIcon({
  className: 'bg-transparent border-none',
  html: `<div class="map-marker-inner" style="width: 28px; height: 28px; border-radius: 50%; background: rgba(69, 26, 3, 0.8); border: 2px solid #fbbf24; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-weight: bold; font-family: monospace; font-size: 9px; box-shadow: 0 0 10px rgba(251,191,36,0.5); backdrop-filter: blur(4px);">AUV</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const baseIcon = new L.DivIcon({
  className: 'bg-transparent border-none',
  html: `<div class="map-marker-inner" style="width: 24px; height: 24px; border-radius: 50%; background: rgba(30, 41, 59, 0.8); border: 2px solid #94a3b8; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-weight: bold; font-family: monospace; font-size: 8px; box-shadow: 0 0 10px rgba(148,163,184,0.5); backdrop-filter: blur(4px);">BASE</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function MapArea({ 
  initialPos,
  boatPos, 
  auvPos, 
  targetPos,
  phase,
  onMapClick
}: { 
  initialPos: Coordinates;
  boatPos: Coordinates;
  auvPos: Coordinates;
  targetPos: Coordinates | null;
  phase: string;
  onMapClick?: (coords: Coordinates) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  
  // Marker Refs
  const baseMarkerRef = useRef<L.Marker | null>(null);
  const boatMarkerRef = useRef<L.Marker | null>(null);
  const auvMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const targetCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Evitare inizializzazioni multiple
    if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: false }).setView([initialPos.lat, initialPos.lng], 14);
    mapInstance.current = map;

    // Utilizziamo le mappe di OpenStreetMap come suggerito per la massima affidabilità
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Visual bounds per il limite di 500 metri
    L.circle([initialPos.lat, initialPos.lng], { 
      radius: 500, 
      color: '#06b6d4', 
      dashArray: '5, 10', 
      fillColor: '#06b6d4',
      fillOpacity: 0.05,
      weight: 1.5,
      interactive: false
    }).addTo(map);

    // Initial markers creation
    baseMarkerRef.current = L.marker([initialPos.lat, initialPos.lng], { icon: baseIcon }).addTo(map).bindPopup('Base Operativa (Raggio Max 500m)');
    boatMarkerRef.current = L.marker([boatPos.lat, boatPos.lng], { icon: boatIcon }).addTo(map).bindPopup('USV');

    map.on('click', (e) => {
        if ((window as any)._onMapClickCallback) {
            (window as any)._onMapClickCallback({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
    });

    // Observer per i ridimensionamenti nativi (risolve definitivamente il bug della mappa grigia)
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(mapRef.current);

    return () => {
      observer.disconnect();
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update logic triggers su cambiamento props
  useEffect(() => {
    (window as any)._onMapClickCallback = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    // 1. Update Boat
    if (boatMarkerRef.current) {
       boatMarkerRef.current.setLatLng([boatPos.lat, boatPos.lng]);
    }

    // 2. Update AUV conditionally
    const showAuv = phase !== 'STANDBY' && phase !== 'DEPLOYING_BOAT' && phase !== 'ON_STATION' && phase !== 'RECOVERED' && phase !== 'RETURN_TO_BASE';
    
    if (showAuv) {
       if (!auvMarkerRef.current) {
          auvMarkerRef.current = L.marker([auvPos.lat, auvPos.lng], { icon: auvIcon }).addTo(map).bindPopup('AUV');
       } else {
          auvMarkerRef.current.setLatLng([auvPos.lat, auvPos.lng]);
       }
    } else {
       if (auvMarkerRef.current) {
          map.removeLayer(auvMarkerRef.current);
          auvMarkerRef.current = null;
       }
    }

    // 3. Update Target & Path
    if (targetPos) {
       if (!targetCircleRef.current) {
          targetCircleRef.current = L.circle([targetPos.lat, targetPos.lng], { radius: 30, color: '#06b6d4', fillColor: '#06b6d4', fillOpacity: 0.2 }).addTo(map);
       } else {
          targetCircleRef.current.setLatLng([targetPos.lat, targetPos.lng]);
       }
       if (!polylineRef.current) {
          polylineRef.current = L.polyline([[boatPos.lat, boatPos.lng], [targetPos.lat, targetPos.lng]], { color: 'gray', dashArray: '5, 10' }).addTo(map);
       } else {
          polylineRef.current.setLatLngs([[boatPos.lat, boatPos.lng], [targetPos.lat, targetPos.lng]]);
       }
    } else {
       if (targetCircleRef.current) {
          map.removeLayer(targetCircleRef.current);
          targetCircleRef.current = null;
       }
       if (polylineRef.current) {
          map.removeLayer(polylineRef.current);
          polylineRef.current = null;
       }
    }

    // 4. Calcolo Bounds Dinamici per Focus Visuale automatico
    const boundsPoints: [number, number][] = [
      [initialPos.lat, initialPos.lng],
      [boatPos.lat, boatPos.lng]
    ];
    if (showAuv) boundsPoints.push([auvPos.lat, auvPos.lng]);
    if (targetPos) boundsPoints.push([targetPos.lat, targetPos.lng]);
    
    // Zoom max impostato a 18 per via della visualizzazione locale a < 100m. 
    // Usiamo animate: true per un movimento fluido.
    map.fitBounds(boundsPoints, { 
      padding: [50, 50], 
      maxZoom: 18, 
      animate: true, 
      duration: 1 
    });

  }, [initialPos, boatPos, auvPos, targetPos, phase]);

  return (
    <div className="absolute inset-0 rounded-sm overflow-hidden z-0 bg-[#0B0F13]">
      {/* CSS Filter hack to make OpenStreetMap dark and futuristic without needing custom tiles */}
      <div 
        ref={mapRef} 
        style={{ width: '100%', height: '100%', filter: 'invert(1) hue-rotate(180deg) brightness(0.8) contrast(1.2)' }}
      />
      
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 bg-black/80 px-3 py-2 rounded text-xs border border-slate-700 text-slate-300 font-mono z-[400] pointer-events-none shadow-lg">
        <div>LAT: {boatPos.lat.toFixed(6)} | LON: {boatPos.lng.toFixed(6)}</div>
        {targetPos && (
          <div className="mt-1 pt-1 border-t border-slate-700 text-cyan-400">
            TRG: {targetPos.lat.toFixed(6)} | {targetPos.lng.toFixed(6)}
          </div>
        )}
      </div>
    </div>
  );
}
