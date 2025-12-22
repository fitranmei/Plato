import Header from "../components/header";
import HomeCard from "../components/homeCard";

export default function UserPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-100 bg-[url('/images/bg-home.png')] bg-center">
      <Header />
      <section className="p-6 px-40 flex flex-col">
        <div className="flex flex-row gap-10 flex-wrap justify-center">
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
          location="TFC - Cimayor"
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
