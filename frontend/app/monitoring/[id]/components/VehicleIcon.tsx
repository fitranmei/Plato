import React from 'react';
import Image from 'next/image';
import type { VehicleIconProps } from '../types/monitoring.types';
import { getVehicleImage } from '../utils/vehicleMapping';

export const VehicleIcon: React.FC<VehicleIconProps> = ({ count, speed, type }) => {
    const imageName = getVehicleImage(type);

    return (
        <div className="flex flex-col items-center justify-between h-full">
            <span className="font-bold text-[10px] text-center h-[20px] flex items-center">
                {type}
            </span>
            <div className="h-[45px] w-[45px] flex items-center justify-center">
                <Image
                    src={`/images/${imageName}`}
                    alt={type ? `Logo ${type}` : 'vehicle'}
                    width={45}
                    height={45}
                    className="object-contain"
                />
            </div>
            <span className="font-bold text-lg h-[24px] flex items-center">
                {count}
            </span>
            <span className="text-xs font-semibold text-gray-500 h-[16px] flex items-center">
                {speed} km/jam
            </span>
        </div>
    );
};
