import React, { useEffect, useRef } from 'react';
import { Issue } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  issues: Issue[];
  center?: [number, number];
  zoom?: number;
  onClickIssue: (id: string) => void;
  interactive?: boolean;
}

export default function MapView({
  issues,
  center = [12.9716, 77.5946], // Default Bengaluru coordinates
  zoom = 12,
  onClickIssue,
  interactive = true,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: interactive,
        dragging: interactive,
        doubleClickZoom: interactive,
        scrollWheelZoom: interactive,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributor data',
      }).addTo(mapRef.current);
    } else {
      // If already initialized, update view if center changed
      mapRef.current.setView(center, zoom);
    }

    const map = mapRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Color codes for severities (1-5)
    const severityColors = ["", "#3b82f6", "#10b981", "#f1c40f", "#f39c12", "#e74c3c"];

    // Add pins to map
    issues.forEach((issue) => {
      if (issue.location && typeof issue.location.lat === 'number' && typeof issue.location.lng === 'number') {
        const color = severityColors[issue.severity] || "#3b82f6";
        
        // Define clean custom marker representing severity color
        const customIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <div style="background-color: ${color};" class="w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
              <div style="border-top-color: ${color};" class="absolute top-[18px] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px]"></div>
            </div>
          `,
          className: 'custom-civic-marker',
          iconSize: [20, 24],
          iconAnchor: [10, 24],
          popupAnchor: [0, -24]
        });

        const marker = L.marker([issue.location.lat, issue.location.lng], { icon: customIcon }).addTo(map);

        if (interactive) {
          const popupContent = `
            <div class="p-1 font-sans min-w-[150px]">
              <span class="inline-block bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase mb-1">${issue.category}</span>
              <h4 class="font-bold text-slate-900 text-xs leading-tight mb-1 line-clamp-1">${issue.title}</h4>
              <p class="text-[10px] text-slate-500 leading-normal mb-2 line-clamp-2">${issue.description}</p>
              <button id="view-issue-${issue.id}" class="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold py-1 rounded cursor-pointer border-none shadow-sm transition">
                View Details
              </button>
            </div>
          `;

          marker.bindPopup(popupContent);

          marker.on('popupopen', () => {
            const btn = document.getElementById(`view-issue-${issue.id}`);
            if (btn) {
              btn.onclick = () => {
                if (issue.id) {
                  onClickIssue(issue.id);
                }
              };
            }
          });
        }
      }
    });

    // Cleanup on unmount
    return () => {
      // We don't necessarily have to destroy the map instantly on minor state updates, but let's keep it safe.
    };
  }, [issues, center, zoom, interactive]);

  // Handle map resizing
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }
  }, [issues]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {/* Small floating severity guide */}
      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-md border border-slate-150 z-10 text-[10px] space-y-1 font-medium text-slate-700">
        <p className="font-semibold text-[9px] text-slate-500 uppercase tracking-wider mb-1">Severity Levels</p>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#e74c3c]" /> Critical</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f39c12]" /> Severe</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f1c40f]" /> High</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Moderate</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> Low</div>
      </div>
    </div>
  );
}
