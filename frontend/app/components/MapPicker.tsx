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

const TRAFFIC_CONFIG: Record<string, { color: string; textColor: string }> = {
  "Sangat Lancar": { color: "#2E7D32", textColor: "text-white" },
  "Lancar":        { color: "#66BB6A", textColor: "text-black" },
  "Normal":        { color: "#FDD835", textColor: "text-black" },
  "Padat":         { color: "#FB8C00", textColor: "text-white" },
  "Sangat Padat":  { color: "#E53935", textColor: "text-white" },
  "Macet Total":   { color: "#212121", textColor: "text-white" },
};

const getTrafficStyle = (status: string) => {
  return TRAFFIC_CONFIG[status] || { color: "#9CA3AF", textColor: "text-white" }; // Default gray
};

const STATUS_KEYS = Object.keys(TRAFFIC_CONFIG);

interface LocationData {
    id: string;
    nama_lokasi: string;
    latitude: number;
    longitude: number;
    [key: string]: any;
}

interface MapPickerProps {
    locations?: LocationData[];
    cameras?: any[];
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

export default function MapPicker({ locations = [], cameras = [], onMarkerClick }: MapPickerProps) {
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
            locations.map((loc) => {
                const cam = cameras.find((c: any) => c.lokasi_id === loc.id);
                const dir1 = cam?.zona_arah?.[0]?.arah || "Arah 1";
                const dir2 = cam?.zona_arah?.[1]?.arah || "Arah 2";
                
                // MOCK status logic since data might not be available
                // Pick semi-randomly or default to something based on ID if needed, 
                // but since this is a UI demo request, we can just pick random defaults for variety 
                // OR default to "Lancar" if no data.
                // Assuming `loc.status1` and `loc.status2` might exist later.
                const status1 = loc.status1 || STATUS_KEYS[Math.floor(Math.random() * STATUS_KEYS.length)];
                const status2 = loc.status2 || STATUS_KEYS[Math.floor(Math.random() * STATUS_KEYS.length)];

                const style1 = getTrafficStyle(status1);
                const style2 = getTrafficStyle(status2);

                return (
                <Marker 
                    key={loc.id} 
                    position={[loc.latitude, loc.longitude]} 
                    icon={customIcon}
                >
                    <Popup minWidth={300} maxWidth={100} className="custom-popup">
                        <div className="font-sans bg-white rounded-lg overflow-hidden w-full">
                           {/* Header */}
                           <div className={`${!loc.hide_lokasi ? 'bg-[#00AA13]' : 'bg-red-500'} px-2 py-1.5 flex justify-between items-start text-white`}>
                              <div className="font-bold text-sm mt-2">
                                {!loc.hide_lokasi ? "Online" : "Offline"}
                              </div>
                              <div className="text-right pr-6">
                                <h3 className="text-sm font-bold m-0 leading-tight mt-2">{loc.nama_lokasi}</h3>
                                <p className="text-[10px] opacity-90 m-0 mt-0.5">Update: {new Date(loc.timestamp || Date.now()).toLocaleTimeString()}</p>
                              </div>
                           </div>
                           
                           {/* Body */}
                           <div className="p-2 flex justify-between items-center gap-1">
                              {/* Left: Directions */}
                              <div className="flex flex-col gap-1">
                                {/* Direction 1 */}
                                <div className="flex items-center gap-1.5">
                                  <div className={`p-1 rounded ${style1.textColor} flex items-center justify-center`} style={{ backgroundColor: style1.color }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-500 m-0 leading-none mb-[-4px]">{dir1}</p>
                                    <p className="text-xs font-bold text-gray-800 m-0 leading-none mt-1">{status1.toUpperCase()}</p>
                                  </div>
                                </div>
                                {/* Direction 2 */}
                                <div className="flex items-center gap-1.5">
                                  <div className={`p-1 rounded ${style2.textColor} flex items-center justify-center`} style={{ backgroundColor: style2.color }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-500 m-0 leading-none mb-[-4px]">{dir2}</p>
                                    <p className="text-xs font-bold text-gray-800 m-0 leading-none mt-1">{status2.toUpperCase()}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Right: SMP + Button */}
                              <div className="flex flex-col items-end gap-1">
                                <div className="text-right">
                                  <span className="text-2xl font-bold text-gray-900">{loc.smp ?? 0}</span>
                                  <span className="text-gray-500 text-[10px] ml-0.5">SMP/jam</span>
                                </div>
                                <a 
                                  href={!loc.hide_lokasi ? `/monitoring/${loc.id}` : "#"} 
                                  className={`text-[10px] font-semibold py-1 px-3 rounded transition-colors no-underline ${!loc.hide_lokasi ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                                  style={{ color: !loc.hide_lokasi ? 'white' : undefined }}
                                >
                                  Monitoring
                                </a>
                              </div>
                           </div>
                        </div>
                    </Popup>
                </Marker>
            );
            })
        ) : (
            <LocationMarker position={position} setPosition={setPosition} />
        )}

      </MapContainer>
    </div>
  );
}