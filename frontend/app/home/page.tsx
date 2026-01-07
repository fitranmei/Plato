'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import HomeCard from "../components/homeCard";
import MapWrapper from '../components/MapWrapper';
import { useRouter } from 'next/navigation';

// Map MKJI/PKJI Level of Service (A-F) to Indonesian status
const LOS_TO_STATUS: Record<string, string> = {
  "A": "Sangat Lancar",
  "B": "Lancar",
  "C": "Normal",
  "D": "Padat",
  "E": "Sangat Padat",
  "F": "Macet Total"
};

// Check if location is offline based on last update time
const isLocationOffline = (timestamp: string | undefined, intervalMinutes: number = 5): boolean => {
  if (!timestamp) return true;
  
  const lastUpdate = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - lastUpdate.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  
  // If no update for 2x interval, consider offline
  return diffMinutes > (intervalMinutes * 2);
};

export default function UserPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [trafficDataMap, setTrafficDataMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const headers = { "Authorization": `Bearer ${token}` };

        const [resLo, resCam] = await Promise.all([
             fetch("/api/locations", { headers }),
             fetch("/api/cameras", { headers })
        ]);

        if (resLo.ok) {
          const data = await resLo.json();
          const rawLocations = Array.isArray(data.data) ? data.data : [];
          setLocations(rawLocations);

          // Fetch latest traffic data for each location
          const trafficPromises = rawLocations.map((loc: any) => 
            fetch(`/api/traffic-data/lokasi/${loc.id}/latest`, { headers })
              .then(res => {
                console.log(`Fetch traffic for ${loc.id}:`, res.status, res.ok);
                return res.ok ? res.json() : Promise.resolve(null);
              })
              .then(json => {
                console.log(`Response for ${loc.id}:`, json);
                return { locationId: loc.id, data: json?.data };
              })
              .catch(err => {
                console.error(`Error fetching traffic for ${loc.id}:`, err);
                return { locationId: loc.id, data: null };
              })
          );

          const trafficResults = await Promise.all(trafficPromises);
          const trafficMap: Record<string, any> = {};
          trafficResults.forEach(result => {
            console.log(`Traffic data for ${result.locationId}:`, result.data ? 'FOUND' : 'NOT FOUND', result.data);
            if (result.data) {
              trafficMap[result.locationId] = result.data;
            }
          });
          console.log('Final trafficMap:', trafficMap);
          setTrafficDataMap(trafficMap);
        }

        if (resCam.ok) {
            const data = await resCam.json();
            setCameras(Array.isArray(data.data) ? data.data : []);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const displayedLocations = locations;

  return (
    <main className="min-h-screen flex flex-col bg-gray-100 bg-[url('/images/bg-home.webp')] bg-center">
      <section className="p-6 px-40 flex flex-col">
        <div className="w-full h-[400px] bg-white rounded-xl mb-10 overflow-hidden shadow-md border border-gray-200">
         <MapWrapper locations={locations.map(loc => {
           const traffic = trafficDataMap[loc.id];
           const losLevel = traffic?.mkji_analysis?.tingkat_pelayanan || traffic?.pkji_analysis?.tingkat_pelayanan;
           const status = losLevel ? LOS_TO_STATUS[losLevel] : "Lancar";
           const isOffline = loc.hide_lokasi || isLocationOffline(traffic?.timestamp, loc.interval || 5);
           return {
             ...loc,
             status1: status,
             status2: status,
             smp: traffic?.total_kendaraan || 0,
             timestamp: traffic?.timestamp || loc.timestamp,
             hide_lokasi: isOffline
           };
         })} cameras={cameras} />
        </div>
        <div className="flex flex-row gap-3 flex-wrap justify-center">
          {loading ? (
             <div className="text-gray-500">Memuat data lokasi...</div>
          ) : displayedLocations.length === 0 ? (
             <div className="text-gray-500">Tidak ada lokasi tersedia.</div>
          ) : (
            displayedLocations.map((loc) => {
                const cam = cameras.find(c => c.lokasi_id === loc.id);
                const traffic = trafficDataMap[loc.id];
                
                const dirName1 = cam?.zona_arah?.[0]?.arah || "Arah 1";
                const dirName2 = cam?.zona_arah?.[1]?.arah || "Arah 2";
                
                // Get status from MKJI/PKJI analysis
                const losLevel = traffic?.mkji_analysis?.tingkat_pelayanan || traffic?.pkji_analysis?.tingkat_pelayanan;
                const status = losLevel ? LOS_TO_STATUS[losLevel] : "Lancar";
                
                // Get SMP from total_kendaraan
                const smp = traffic?.total_kendaraan || 0;
                
                // Check if offline based on last update time
                const isOffline = loc.hide_lokasi || isLocationOffline(traffic?.timestamp, loc.interval || 5);
                
                console.log(`Location ${loc.id} (${loc.nama_lokasi}):`, {
                  hasTraffic: !!traffic,
                  timestamp: traffic?.timestamp,
                  interval: loc.interval,
                  hide_lokasi: loc.hide_lokasi,
                  isOffline: isOffline
                });
                
                // Format timestamp
                const timestamp = traffic?.timestamp ? new Date(traffic.timestamp).toLocaleString('id-ID', {
                  year: 'numeric',
                  month: '2-digit', 
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }) + ' WIB' : '-';

                return (
                  <HomeCard 
                    key={loc.id}
                    id={loc.id}
                    location={loc.nama_lokasi}
                    lastUpdate={timestamp}
                    smp={smp} 
                    status={isOffline ? "Offline" : "Online"} 
                    direction1={{ name: dirName1, status: status }}
                    direction2={{ name: dirName2, status: status }}
                  />
                );
            })
          )}
        </div>
      </section>
    </main>
  );
}
