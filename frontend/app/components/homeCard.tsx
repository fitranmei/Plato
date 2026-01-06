// components/TrafficCard.tsx
import React from 'react';
import Link from 'next/link';

interface HomeCardProps {
  id: string;
  location: string; 
  lastUpdate: string;
  status?: 'Online' | 'Offline';
  smp: number;
  
  direction1: { name: string; status: string }; 
  direction2: { name: string; status: string };
}

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

const HomeCard = ({ 
  id,
  location, 
  lastUpdate, 
  status = 'Online', 
  smp,
  direction1,
  direction2
}: HomeCardProps) => {

    const headerColor = status === 'Online' ? 'bg-[#00AA13]' : 'bg-red-500';
    const isOnline = status === 'Online';
    
    const style1 = getTrafficStyle(direction1.status);
    const style2 = getTrafficStyle(direction2.status);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-lg transform scale-90">
      
      <div className={`${headerColor} p-5 flex justify-between items-start text-white`}>
        <div className="font-bold text-xl">
          {status}
        </div>

        <div className="text-right">
          <h2 className="text-2xl font-bold">{location}</h2>
          <p className="text-sm opacity-90 mt-1">Terakhir diupdate: {lastUpdate}</p>
        </div>
      </div>

      <div className="p-6 flex justify-between items-center gap-4">     
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${style1.textColor}`} style={{ backgroundColor: style1.color }}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
               </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">{direction1.name}</p>
              <p className="text-xl font-bold text-gray-800">{direction1.status.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${style2.textColor}`} style={{ backgroundColor: style2.color }}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
               </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">{direction2.name}</p>
              <p className="text-xl font-bold text-gray-800">{direction2.status.toUpperCase()}</p>
            </div>
          </div>

        </div>

        <div className="flex flex-col items-end gap-4">
          
          <div className="text-right">
            <span className="text-5xl font-bold text-gray-900">{smp}</span>
            <span className="text-gray-600 font-medium ml-1">SMP/jam</span>
          </div>

          {isOnline ? (
            <Link href={`/monitoring/${id}`} className={`font-semibold py-2 px-6 rounded-lg transition-colors shadow-sm bg-blue-500 hover:bg-blue-600 text-white`}>
              Monitoring
            </Link>
          ) : (
            <button disabled className={`font-semibold py-2 px-6 rounded-lg transition-colors shadow-sm bg-gray-300 text-gray-500 cursor-not-allowed`}>
              Monitoring
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default HomeCard;