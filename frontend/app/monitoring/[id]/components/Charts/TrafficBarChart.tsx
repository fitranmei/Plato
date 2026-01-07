import React from 'react';
import { 
    BarChart as RechartsBarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Legend 
} from 'recharts';
import { CustomBarTooltip } from './CustomBarTooltip';
import { CHART_COLORS } from '../../utils/chartConfig';
import type { ChartDataPoint } from '../../types/monitoring.types';

interface TrafficBarChartProps {
    data: ChartDataPoint[];
    dir1: string;
    dir2: string;
}

export const TrafficBarChart: React.FC<TrafficBarChartProps> = ({ data, dir1, dir2 }) => {
    if (data.length === 0) {
        return <div className="text-gray-400 text-sm">Memuat data historis...</div>;
    }

    const avgDailyTraffic = Math.round(
        data.reduce((acc, curr) => acc + (curr.arah1 || 0) + (curr.arah2 || 0), 0) / data.length
    );

    return (
        <div className="flex flex-col items-center w-full">
            <h3 className="font-bold text-lg mb-4 text-center">
                GRAFIK TOTAL JUMLAH<br/>KENDARAAN DUA ARAH PER HARI
            </h3>
            
            <RechartsBarChart 
                width={350} 
                height={300} 
                data={data} 
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
                <XAxis dataKey="date" style={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
                <Legend wrapperStyle={{ color: '#ffffff' }} />
                <Bar dataKey="arah1" fill={CHART_COLORS.primary} name={dir1 || "Arah 1"} />
                <Bar dataKey="arah2" fill={CHART_COLORS.secondary} name={dir2 || "Arah 2"} />
            </RechartsBarChart>

            {/* LHR Card */}
            <div className="bg-white rounded-xl p-5 mt-6 text-center w-full max-w-sm shadow-lg text-gray-800 border border-gray-100">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                    LHR Periode Ini
                </div>
                <div className="text-4xl font-extrabold text-[#0f172a] flex items-baseline justify-center gap-2">
                    {avgDailyTraffic.toLocaleString('id-ID')} 
                    <span className="text-sm text-gray-500 font-bold">SMP/Hari</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-2 font-medium bg-gray-50 py-1 px-2 rounded-full inline-block">
                    (Dihitung dari rata-rata tanggal {data[0]?.date.substring(0, 5)} s.d. {data[data.length - 1]?.date.substring(0, 5)})
                </div>
            </div>
        </div>
    );
};
