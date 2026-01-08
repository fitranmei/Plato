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
      
      <div className={`${headerColor} p-3 sm:p-5 flex flex-col sm:flex-row justify-between items-start text-white gap-2 sm:gap-0`}>
        <div className="font-bold text-base sm:text-xl">
          {status}
        </div>

        <div className="text-left sm:text-right">
          <h2 className="text-xl sm:text-2xl font-bold">{location}</h2>
          <p className="text-xs sm:text-sm opacity-90 mt-1">Terakhir diupdate: {lastUpdate}</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">     
        <div className="flex flex-col gap-4 sm:gap-6 w-full lg:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-lg ${style1.textColor}`} style={{ backgroundColor: style1.color }}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
               </svg>
            </div>
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">{direction1.name}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800">{direction1.status.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-lg ${style2.textColor}`} style={{ backgroundColor: style2.color }}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
               </svg>
            </div>
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">{direction2.name}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800">{direction2.status.toUpperCase()}</p>
            </div>
          </div>

        </div>

        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start w-full lg:w-auto gap-4">
          
          <div className="text-left lg:text-right">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">{smp}</span>
            <span className="text-gray-600 font-medium ml-1 text-xs sm:text-sm">SMP/jam</span>
          </div>

          <Link href={`/monitoring/${id}`} className="font-semibold py-2 px-4 sm:px-6 rounded-lg transition-colors shadow-sm bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base whitespace-nowrap">
            Monitoring
          </Link>

        </div>
      </div>
    </div>
  );
};

export default HomeCard;