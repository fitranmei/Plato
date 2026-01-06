'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import HomeCard from "../components/homeCard";
import MapWrapper from '../components/MapWrapper';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = ["Sangat Lancar", "Lancar", "Normal", "Padat", "Sangat Padat", "Macet Total"];

export default function UserPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
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
          // Enhance with mock data for consistency between Map and Cards
          const enhancedLocations = rawLocations.map((l: any) => ({
             ...l,
             status1: STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)],
             status2: STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)],
             smp: Math.floor(Math.random() * 200)
          }));
          setLocations(enhancedLocations);
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
         <MapWrapper locations={locations} cameras={cameras} />
        </div>
        <div className="flex flex-row gap-3 flex-wrap justify-center">
          {loading ? (
             <div className="text-gray-500">Memuat data lokasi...</div>
          ) : displayedLocations.length === 0 ? (
             <div className="text-gray-500">Tidak ada lokasi tersedia.</div>
          ) : (
            displayedLocations.map((loc) => {
                const cam = cameras.find(c => c.lokasi_id === loc.id);
                // Fallback is just "1" and "2" because HomeCard might prepend "Arah ke" or we handle it inside HomeCard
                // Based on plan: HomeCard will NOT prepend "Arah ke" anymore.
                // So here we should provide the FULL label.
                // If cam.zona_arah exists, use it.
                // If not, default to "Arah 1" / "Arah 2".
                const dirName1 = cam?.zona_arah?.[0]?.arah || "Arah 1";
                const dirName2 = cam?.zona_arah?.[1]?.arah || "Arah 2";

                return (
                  <HomeCard 
                    key={loc.id}
                    id={loc.id}
                    location={loc.nama_lokasi}
                    lastUpdate={new Date(loc.timestamp).toLocaleTimeString()}
                    smp={loc.smp} 
                    status={loc.hide_lokasi ? "Offline" : "Online"} 
                    direction1={{ name: dirName1, status: loc.status1 }}
                    direction2={{ name: dirName2, status: loc.status2 }}
                  />
                );
            })
          )}
        </div>
      </section>
    </main>
  );
}
