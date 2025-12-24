'use client';
import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const iconUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],   // Ukuran icon
    iconAnchor: [12, 41], // Titik tancap icon (di ujung bawah jarum)
    popupAnchor: [1, -34] // Posisi popup di atas icon
});

function LocationMarker({ position, setPosition }: any) {
  
  // Hook 'useMapEvents' adalah cara kita berkomunikasi dengan Peta
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      
      setPosition([lat, lng]);
      
      console.log(`Koordinat Baru: Lat ${lat}, Lng ${lng}`);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon}>
      <Popup>Lokasi Terpilih</Popup>
    </Marker>
  );
}

export default function MapPicker() {
  const [position, setPosition] = useState<[number, number]>([-6.8586, 107.9193]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-300 relative z-0">
      
      <MapContainer 
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker position={position} setPosition={setPosition} />

      </MapContainer>
    </div>
  );
}