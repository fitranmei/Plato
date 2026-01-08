import React from 'react';
import Image from 'next/image';
import type { VehicleIconProps } from '../types/monitoring.types';
import { getVehicleImage } from '../utils/vehicleMapping';

export const VehicleIcon: React.FC<VehicleIconProps> = ({ count, speed, type }) => {
    const imageName = getVehicleImage(type);

    return (
        <div className="flex flex-col items-center justify-between h-full">
            <span className="font-bold text-[9px] sm:text-[10px] text-center h-[18px] sm:h-[20px] flex items-center">
                {type}
            </span>
            <div className="h-[35px] w-[35px] sm:h-[45px] sm:w-[45px] flex items-center justify-center">
                <Image
                    src={`/images/${imageName}`}
                    alt={type ? `Logo ${type}` : 'vehicle'}
                    width={45}
                    height={45}
                    className="object-contain w-[35px] h-[35px] sm:w-[45px] sm:h-[45px]"
                />
            </div>
            <span className="font-bold text-sm sm:text-lg h-[20px] sm:h-[24px] flex items-center">
                {count}
            </span>
            <span className="text-[8px] sm:text-xs font-semibold text-gray-500 h-[12px] sm:h-[16px] flex items-center">
                {speed} km/jam
            </span>
        </div>
    );
};
