import React from 'react';
import Image from 'next/image';
import type { SimpleStatsProps } from '../types/monitoring.types';

export const SimpleStats: React.FC<SimpleStatsProps> = ({ direction, count }) => {
    return (
        <div className="bg-white rounded-xl p-6 flex justify-between items-center text-gray-800 shadow">
            <div className="flex items-center gap-4">
                <Image
                    src="/images/car.svg"
                    alt="Logo Dishub"
                    width={40}
                    height={40}
                />
                <span className="font-semibold">{direction}</span>
            </div>
            <div>
                <span className="text-4xl font-bold">{count}</span>
                <span className="text-sm ml-1">SMP/jam</span>
            </div>
        </div>
    );
};
