'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import HomeCard from "../components/homeCard";
import MapWrapper from '../components/MapWrapper';
import { useRouter } from 'next/navigation';

export default function UserPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("/api/locations", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          // Backend returns { data: [...], count: ... }
          setLocations(Array.isArray(data.data) ? data.data : []);
        } else {
          console.error("Failed to fetch locations");
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [router]);

  const displayedLocations = locations;

  return (
    <main className="min-h-screen flex flex-col bg-gray-100 bg-[url('/images/bg-home.webp')] bg-center">
      <section className="p-6 px-40 flex flex-col">
        <div className="w-full h-[400px] bg-white rounded-xl mb-10 overflow-hidden shadow-md border border-gray-200">
         <MapWrapper locations={locations} />
        </div>
        <div className="flex flex-row gap-3 flex-wrap justify-center">
          {loading ? (
             <div className="text-gray-500">Memuat data lokasi...</div>
          ) : displayedLocations.length === 0 ? (
             <div className="text-gray-500">Tidak ada lokasi tersedia.</div>
          ) : (
            displayedLocations.map((loc) => (
              <HomeCard 
                key={loc.id}
                id={loc.id}
                location={loc.nama_lokasi}
                lastUpdate={new Date(loc.timestamp).toLocaleTimeString()}
                smp={0} // Placeholder, data from backend might not have this yet
                status={loc.hide_lokasi ? "Offline" : "Online"} // Placeholder logic
                direction1={{ name: "Arah 1", status: "LANCAR" }}
                direction2={{ name: "Arah 2", status: "LANCAR" }}
              />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
