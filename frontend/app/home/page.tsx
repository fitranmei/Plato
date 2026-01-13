'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import HomeCard from "../components/homeCard";
import MapWrapper from '../components/MapWrapper';
import { useRouter } from 'next/navigation';
import { formatTimestampWithZone } from '../monitoring/[id]/utils/dateHelpers';

// Map MKJI/PKJI Level of Service (A-F) to Indonesian status
const LOS_TO_STATUS: Record<string, string> = {
  "A": "Sangat Lancar",
  "B": "Lancar",
  "C": "Normal",
  "D": "Padat",
  "E": "Sangat Padat",
  "F": "Macet Total"
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
                return res.ok ? res.json() : Promise.resolve(null);
              })
              .then(json => {
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
            if (result.data) {
              trafficMap[result.locationId] = result.data;
            }
          });
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

  // Filter out locations with hide_lokasi = true
  const displayedLocations = locations.filter(loc => !loc.hide_lokasi);

  return (
    <main className="min-h-screen flex flex-col bg-gray-100 bg-[url('/images/bg-home.webp')] bg-center">
      <section className="p-4 sm:p-6 md:px-20 lg:px-40 flex flex-col">
        <div className="w-full h-[250px] sm:h-[350px] lg:h-[400px] bg-white rounded-xl mb-6 sm:mb-10 overflow-hidden shadow-md border border-gray-200">
         <MapWrapper locations={locations.filter(loc => !loc.hide_lokasi).map(loc => {
           const traffic = trafficDataMap[loc.id];
           const losLevel = traffic?.mkji_analysis?.tingkat_pelayanan || traffic?.pkji_analysis?.tingkat_pelayanan;
           const status = losLevel ? LOS_TO_STATUS[losLevel] : "Lancar";
           return {
             ...loc,
             status1: status,
             status2: status,
             smp: traffic?.total_kendaraan || 0,
             timestamp: traffic?.timestamp || loc.timestamp,
             hide_lokasi: false
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
                
                // Get SMP from PKJI/MKJI analysis (Volume Hourly)
                // Fallback to total_kendaraan (raw count) if analysis missing
                let smp = traffic?.pkji_analysis?.volume_skr || traffic?.mkji_analysis?.arus_smp || traffic?.total_kendaraan || 0;
                smp = Math.round(smp); // Display as integer
                
                // Format timestamp using the same format as monitoring page
                const timestamp = traffic?.timestamp ? formatTimestampWithZone(traffic.timestamp, (loc as any).zona_waktu || 7) : '-';

                return (
                  <HomeCard 
                    key={loc.id}
                    id={loc.id}
                    location={loc.nama_lokasi}
                    lastUpdate={timestamp}
                    smp={smp} 
                    status={loc.publik === false ? "Offline" : "Online"} 
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
