'use client';
import { useState, useEffect } from "react";
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

interface LocationData {
    id: string;
    nama_lokasi: string;
    latitude: number;
    longitude: number;
    [key: string]: any;
}

interface MapPickerProps {
    locations?: LocationData[];
    onMarkerClick?: (loc: LocationData) => void;
}

function LocationMarker({ position, setPosition }: any) {
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

export default function MapPicker({ locations = [], onMarkerClick }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([-6.8586, 107.9193]);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return <div className="w-full h-full bg-gray-200 animate-pulse" />;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-300 relative z-0">
      <MapContainer 
        center={locations.length > 0 ? [locations[0].latitude, locations[0].longitude] : position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.length > 0 ? (
            locations.map((loc) => (
                <Marker 
                    key={loc.id} 
                    position={[loc.latitude, loc.longitude]} 
                    icon={customIcon}
                >
                    <Popup className="custom-popup">
                        <div className="min-w-[200px] font-sans">
                            <div className={`${loc.hide_lokasi ? 'bg-red-500' : 'bg-[#00AA13]'} text-white p-3 rounded-t-lg -mx-4 -mt-3 mb-3 flex justify-between items-center`}>
                                <span className="font-bold text-sm">{loc.hide_lokasi ? "Offline" : "Online"}</span>
                            </div>
                            
                            <h3 className="font-bold text-lg text-gray-800 leading-tight mb-1">{loc.nama_lokasi}</h3>
                            <p className="text-xs text-gray-500 mb-3">Update: {new Date(loc.timestamp).toLocaleTimeString()}</p>
                            
                            <div className="flex justify-end">
                                {!loc.hide_lokasi ? (
                                    <a href="/monitoring" className="bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-blue-600 transition-colors no-underline">
                                        Monitoring
                                    </a>
                                ) : (
                                    <button disabled className="bg-gray-300 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded cursor-not-allowed">
                                        Monitoring
                                    </button>
                                )}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))
        ) : (
            <LocationMarker position={position} setPosition={setPosition} />
        )}

      </MapContainer>
    </div>
  );
}