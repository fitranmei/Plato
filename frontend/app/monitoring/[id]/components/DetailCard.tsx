import React from 'react';
import type { DetailCardProps } from '../types/monitoring.types';
import { VehicleIcon } from './VehicleIcon';
import { getTrafficStyle, LOS_TO_STATUS } from '../utils/chartConfig';

export const DetailCard: React.FC<DetailCardProps> = ({
    direction,
    speed,
    locationType,
    arrow = 'up',
    data,
    trafficData
}) => {
    const is12Classes = locationType === '12_kelas';
    const count = data?.total_kendaraan || 0;

    // Determine status from MKJI/PKJI Level of Service
    let status = "Lancar";
    
    const losLevel = trafficData?.mkji_analysis?.tingkat_pelayanan || 
                     trafficData?.pkji_analysis?.tingkat_pelayanan;
    
    if (losLevel && LOS_TO_STATUS[losLevel]) {
        status = LOS_TO_STATUS[losLevel];
    } else if (count === 0) {
        status = "Lancar";
    } else {
        // Fallback: calculate from speed if no LoS data
        if (speed < 10) status = "Macet Total";
        else if (speed < 20) status = "Sangat Padat";
        else if (speed < 40) status = "Padat";
        else if (speed < 60) status = "Normal";
        else if (speed < 80) status = "Lancar";
        else status = "Sangat Lancar";
    }

    const style = getTrafficStyle(status);
    const arrowPath = arrow === 'down' 
        ? "M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" 
        : "M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18";

    // Generate vehicle list from Real Data if available
    let vehicleList = [];
    const defaultCategories = ["Motor", "Mobil", "Truk", "Bus", "Kontainer"];
    
    if (is12Classes) {
        vehicleList = Array.from({ length: 12 }, (_, i) => {
            const classNum = i + 1;
            const found = data?.kelas_data?.find((k) => k.kelas === classNum);
            return {
                type: `Kelas ${classNum}`,
                count: found ? found.jumlah_kendaraan : 0,
                speed: found ? Math.round(found.kecepatan_rata_rata || found.kecepatan || 0) : 0
            };
        });
    } else {
        vehicleList = defaultCategories.map((cat, index) => {
            const classNum = index + 1;
            const found = data?.kelas_data?.find((k) => k.kelas === classNum);
            
            return {
                type: cat,
                count: found ? found.jumlah_kendaraan : 0, 
                speed: found ? Math.round(found.kecepatan_rata_rata || found.kecepatan || 0) : 0
            };
        });
    }

    return (
        <div className="bg-white rounded-xl overflow-hidden text-gray-800 shadow-lg">
            <div 
                className={`p-2 sm:p-3 flex justify-between items-center font-bold text-sm sm:text-base ${style.textColor}`} 
                style={{ backgroundColor: style.color }}
            >
                <div className='flex items-center'>
                    <div className="p-1.5 sm:p-2 rounded-lg text-black bg-white/20 backdrop-blur-sm">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={4} 
                            stroke="currentColor" 
                            className="w-5 h-5 sm:w-6 sm:h-6"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d={arrowPath} />
                        </svg>
                    </div>
                    <span className="ml-2 text-sm sm:text-base">{direction}</span>
                </div>
                <div className="flex items-center flex-row gap-2">
                    <span className='text-end text-sm sm:text-base'>{status.toUpperCase()}</span>
                </div>
            </div>
            <div className="p-3 sm:p-4">
                <div className={`mb-2 border-b pt-2 pb-2 ${is12Classes ? 'grid grid-cols-6 gap-y-3 gap-x-1 sm:gap-y-6 sm:gap-x-2' : 'flex justify-between px-4 md:px-10'}`}>
                    {vehicleList.map((v, i) => (
                        <VehicleIcon 
                            key={i} 
                            count={v.count} 
                            speed={v.speed} 
                            type={v.type} 
                        />
                    ))}
                </div>
                <div className="text-right">
                    <span className="text-xs font-semibold mr-2 text-gray-500">
                        Kecepatan Rata-Rata
                    </span>
                    <span className="text-lg font-bold">{speed}</span>
                    <span className="text-xs font-semibold ml-1 text-gray-500">km/jam</span>
                </div>
            </div>
        </div>
    );
};
