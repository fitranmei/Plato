  import dynamic from 'next/dynamic';
  import HomeCard from "../components/homeCard";
  import MapWrapper from '../components/MapWrapper';

  export default function UserPage() {
    return (
      <main className="min-h-screen flex flex-col bg-gray-100 bg-[url('/images/bg-home.webp')] bg-center">
        <section className="p-6 px-40 flex flex-col">
          <div className="w-full h-[400px] bg-white rounded-xl mb-10 overflow-hidden shadow-md border border-gray-200">
           <MapWrapper />
          </div>
          <div className="flex flex-row gap-3 flex-wrap justify-center">
            <HomeCard 
            location="TFC - Cimayor"
            lastUpdate="19:00:02"
            smp={80}
            direction1={{ name: "Kota Sumedang", status: "PADAT" }}
            direction2={{ name: "Cimalaka", status: "PADAT" }}
            />

            <HomeCard 
            location="TFC - Cimayor"
            lastUpdate="19:00:02"
            status="Offline"
            smp={80}
            direction1={{ name: "Kota Sumedang", status: "PADAT" }}
            direction2={{ name: "Cimalaka", status: "PADAT" }}
            />

            <HomeCard 
            location="TFC - Cimayor"
            lastUpdate="19:00:02"
            status="Offline"
            smp={80}
            direction1={{ name: "Kota Sumedang", status: "PADAT" }}
            direction2={{ name: "Cimalaka", status: "PADAT" }}
            />

            <HomeCard 
            location="TFC - Cimahi"
            lastUpdate="19:00:02"
            status="Online"
            smp={100}
            direction1={{ name: "Kota Sumedang", status: "PADAT" }}
            direction2={{ name: "Cimalaka", status: "PADAT" }}
            />
          </div>
        </section>
      </main>
    );
  }
