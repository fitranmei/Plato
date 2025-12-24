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
                    <Popup>
                        <div className="flex flex-col gap-3 min-w-[240px]">
                           {/* Header */}
                           <div className="flex items-center justify-between gap-2 border-b pb-2 border-gray-100">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${loc.hide_lokasi ? 'bg-red-500' : 'bg-green-600'}`}>
                                {loc.hide_lokasi ? "OFFLINE" : "ONLINE"}
                              </span>
                              <span className="text-[10px] text-gray-400">{new Date(loc.timestamp).toLocaleTimeString()}</span>
                           </div>
                           
                           {/* Title */}
                           <div>
                               <h3 className="font-bold text-base text-gray-800 m-0 leading-tight">{loc.nama_lokasi}</h3>
                               <div className="flex items-baseline mt-1">
                                    <span className="text-2xl font-bold text-gray-900">0</span>
                                    <span className="text-xs text-gray-500 ml-1">SMP/jam</span>
                               </div>
                           </div>

                           {/* Directions */}
                           <div className="bg-gray-50 rounded p-2 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">Arah 1</span>
                                    <span className="text-xs font-bold text-green-600">LANCAR</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">Arah 2</span>
                                    <span className="text-xs font-bold text-green-600">LANCAR</span>
                                </div>
                           </div>
                           
                           {/* Action */}
                           <div className="mt-1">
                             <a 
                               href={!loc.hide_lokasi ? "/monitoring" : "#"} 
                               style={{ color: 'white' }}
                               className={`block w-full text-center text-xs font-bold py-2 rounded !text-white transition-colors no-underline ${!loc.hide_lokasi ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
                             >
                               MONITORING
                             </a>
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