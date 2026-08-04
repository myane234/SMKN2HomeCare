'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapPicker({ lat, lng, onChange, draggable = true }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map-container').setView([lat || -6.2088, lng || 106.8456], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const marker = L.marker([lat || -6.2088, lng || 106.8456], {
        draggable: draggable,
        icon: customIcon,
      }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onChange(position.lat, position.lng);
      });

      map.on('click', (e) => {
        if (draggable) {
          marker.setLatLng(e.latlng);
          onChange(e.latlng.lat, e.latlng.lng);
        }
      });

      mapRef.current = map;
      markerRef.current = marker;
    } else {
      mapRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
      // Update draggable state if it changed
      if (markerRef.current.dragging) {
        if (draggable) {
          markerRef.current.dragging.enable();
        } else {
          markerRef.current.dragging.disable();
        }
      }
    }
  }, [lat, lng, draggable]);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-300 shadow-sm">
      <div id="map-container" className="h-60 w-full z-0" />
    </div>
  );
}