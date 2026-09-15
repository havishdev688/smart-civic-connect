'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface GoogleMapProps {
  lat?: number | null;
  lng?: number | null;
  zoom?: number;
  className?: string;
  address?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export default function GoogleMap({
  lat,
  lng,
  zoom = 15,
  className = 'w-full h-44 rounded-xl',
  address,
  onLocationSelect,
  interactive = true,
}: GoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  const currentLat = hasCoords ? lat : 16.5062;
  const currentLng = hasCoords ? lng : 80.648;
  const currentZoom = hasCoords ? zoom : 8;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapContainerRef.current) return;

    // Dynamically require or use Leaflet on client side only
    const L = require('leaflet');

    // Create custom SVG Pin Icon for high-resolution crisp rendering
    const createCustomIcon = () => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative;
            transform: translate(-50%, -100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
          ">
            <div style="
              width: 32px;
              height: 32px;
              background: #0f2942;
              border: 2.5px solid #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fbbf24;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 8px solid #0f2942;
              margin-top: -2px;
            "></div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -38],
      });
    };

    // Initialize Leaflet Map Instance
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: currentZoom,
        zoomControl: interactive,
        scrollWheelZoom: false,
        dragging: interactive,
        attributionControl: true,
      });

      // OpenStreetMap Tile Layer with Attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Marker only placed if coordinates are actually provided
      if (hasCoords) {
        const marker = L.marker([lat, lng], {
          icon: createCustomIcon(),
          draggable: !!onLocationSelect && interactive,
        }).addTo(map);

        if (address) {
          marker.bindPopup(`<strong>${address}</strong><br><span style="font-size:11px;color:#64748b;">GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`);
        }

        if (onLocationSelect && interactive) {
          marker.on('dragend', (event: any) => {
            const newPos = event.target.getLatLng();
            onLocationSelect(parseFloat(newPos.lat.toFixed(5)), parseFloat(newPos.lng.toFixed(5)));
          });
        }
        markerInstanceRef.current = marker;
      }

      if (onLocationSelect && interactive) {
        map.on('click', (event: any) => {
          const { lat: clickLat, lng: clickLng } = event.latlng;
          const formattedLat = parseFloat(clickLat.toFixed(5));
          const formattedLng = parseFloat(clickLng.toFixed(5));
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setLatLng([formattedLat, formattedLng]);
          } else {
            const newMarker = L.marker([formattedLat, formattedLng], {
              icon: createCustomIcon(),
              draggable: true,
            }).addTo(map);
            newMarker.on('dragend', (ev: any) => {
              const pos = ev.target.getLatLng();
              onLocationSelect(parseFloat(pos.lat.toFixed(5)), parseFloat(pos.lng.toFixed(5)));
            });
            markerInstanceRef.current = newMarker;
          }
          onLocationSelect(formattedLat, formattedLng);
        });
      }

      mapInstanceRef.current = map;

      // Force size recalculation in Next.js DOM lifecycle
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {}
      }, 200);
    } else {
      const map = mapInstanceRef.current;

      if (map) {
        if (hasCoords) {
          map.setView([lat, lng], zoom, { animate: true });
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setLatLng([lat, lng]);
            if (address) {
              markerInstanceRef.current.setPopupContent(`<strong>${address}</strong><br><span style="font-size:11px;color:#64748b;">GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`);
            }
          } else {
            const newMarker = L.marker([lat, lng], {
              icon: createCustomIcon(),
              draggable: !!onLocationSelect && interactive,
            }).addTo(map);
            if (address) {
              newMarker.bindPopup(`<strong>${address}</strong><br><span style="font-size:11px;color:#64748b;">GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`);
            }
            if (onLocationSelect && interactive) {
              newMarker.on('dragend', (event: any) => {
                const newPos = event.target.getLatLng();
                onLocationSelect(parseFloat(newPos.lat.toFixed(5)), parseFloat(newPos.lng.toFixed(5)));
              });
            }
            markerInstanceRef.current = newMarker;
          }
        }
      }
    }

    return () => {
      // Map cleanup happens when component unmounts
    };
  }, [mounted, lat, lng, zoom, address, interactive]);

  // Clean unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  if (!mounted) {
    return (
      <div className={`${className} bg-slate-100 border border-slate-300 flex items-center justify-center p-4 text-center text-xs text-slate-500`}>
        <div className="flex items-center gap-1.5 font-medium">
          <MapPin className="w-4 h-4 text-gov-navy animate-bounce" /> Loading OpenStreetMap...
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      <div ref={mapContainerRef} className={`${className} z-0`} />
    </div>
  );
}
