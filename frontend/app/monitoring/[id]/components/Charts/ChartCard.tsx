import React from 'react';
import type { ChartCardProps } from '../../types/monitoring.types';

export const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-80">
            <div className="bg-[#5EB5C4] p-3 text-white font-bold text-center text-sm">
                {title}
            </div>
            <div className="flex-1 p-4">
                {children}
            </div>
        </div>
    );
};
