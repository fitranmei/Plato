// components/TrafficCard.tsx
import React from 'react';

interface HomeCardProps {
  location: string; 
  lastUpdate: string;
  status?: 'Online' | 'Offline';
  smp: number;
  
  direction1: { name: string; status: string }; 
  direction2: { name: string; status: string };
}

const HomeCard = ({ 
  location, 
  lastUpdate, 
  status = 'Online', 
  smp,
  direction1,
  direction2
}: HomeCardProps) => {

    const headerColor = status === 'Online' ? 'bg-[#00AA13]' : 'bg-red-500';
    const isOnline = status === 'Online';
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-lg">
      
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
            <div className="bg-orange-500 p-2 rounded-lg text-black">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
               </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Arah ke {direction1.name}</p>
              <p className="text-xl font-bold text-gray-800">{direction1.status}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg text-black">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
               </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Arah ke {direction2.name}</p>
              <p className="text-xl font-bold text-gray-800">{direction2.status}</p>
            </div>
          </div>

        </div>

        <div className="flex flex-col items-end gap-4">
          
          <div className="text-right">
            <span className="text-5xl font-bold text-gray-900">{smp}</span>
            <span className="text-gray-600 font-medium ml-1">SMP/jam</span>
          </div>

          <button disabled={!isOnline} className={`
              font-semibold py-2 px-6 rounded-lg transition-colors shadow-sm
              ${isOnline ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}>
            Monitoring
          </button>

        </div>
      </div>
    </div>
  );
};

export default HomeCard;