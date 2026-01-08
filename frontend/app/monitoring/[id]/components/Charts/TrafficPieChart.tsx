import React, { useState, useEffect } from 'react';
import { 
    PieChart as RechartsPieChart, 
    Pie, 
    Cell 
} from 'recharts';
import { 
    PIE_SIZE, 
    PIE_SIZE_MOBILE, 
    CENTER, 
    CENTER_MOBILE, 
    OUTER_RADIUS, 
    OUTER_RADIUS_MOBILE, 
    PIE_COLORS 
} from '../../utils/chartConfig';

interface PieData {
    name: string;
    value: number;
}

interface TrafficPieChartProps {
    data: PieData[];
    dir1: string;
    dir2: string;
}

const renderPercentLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = (outerRadius || 0) * 1.02;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pct = Math.round((percent || 0) * 100);
    return (
        <text
            x={x}
            y={y}
            fill="#5EB5C4"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            fontSize={0}
            fontWeight={700}
        >
            {pct}
        </text>
    );
};

export const TrafficPieChart: React.FC<TrafficPieChartProps> = ({ data, dir1, dir2 }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const pieSize = isMobile ? PIE_SIZE_MOBILE : PIE_SIZE;
    const center = isMobile ? CENTER_MOBILE : CENTER;
    const outerRadius = isMobile ? OUTER_RADIUS_MOBILE : OUTER_RADIUS;

    const total = data.reduce((s, p) => s + p.value, 0) || 1;
    const percents = data.map(p => Math.round((p.value / total) * 100));

    return (
        <div className="flex flex-col items-center relative">
            <h3 className="font-bold text-base sm:text-lg mb-4 text-white">KOMPOSISI ARAH</h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Pie chart */}
                <div style={{ position: 'relative', width: pieSize, height: pieSize }} className="hidden sm:block">
                    <RechartsPieChart width={pieSize} height={pieSize}>
                        <Pie
                            data={data}
                            cx={center}
                            cy={center}
                            innerRadius={0}
                            outerRadius={outerRadius}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            label={renderPercentLabel}
                            labelLine={false}
                            paddingAngle={0}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={PIE_COLORS[index % PIE_COLORS.length]} 
                                    stroke="none" 
                                />
                            ))}
                        </Pie>
                    </RechartsPieChart>

                    {/* Left legend box - Desktop only */}
                    <div style={{ 
                        position: 'absolute', 
                        left: center - outerRadius - 130, 
                        top: '50%', 
                        transform: 'translateY(-50%)' 
                    }}>
                        <div style={{ 
                            background: '#fff', 
                            padding: '10px 14px', 
                            borderRadius: 10, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 12 
                        }}>
                            <div style={{ 
                                width: 14, 
                                height: 14, 
                                background: PIE_COLORS[1], 
                                borderRadius: 3 
                            }} />
                            <div style={{ 
                                color: '#0f172a', 
                                fontSize: 14, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 8 
                            }}>
                                <span>{dir1 || "Arah 1"}</span>
                                <span style={{ 
                                    background: '#0f172a', 
                                    color: '#fff', 
                                    padding: '4px 8px', 
                                    borderRadius: 8, 
                                    fontWeight: 700, 
                                    fontSize: 12 
                                }}>
                                    {percents[1]}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right legend box - Desktop only */}
                    <div style={{ 
                        position: 'absolute', 
                        right: center - outerRadius - 130, 
                        top: '50%', 
                        transform: 'translateY(-50%)' 
                    }}>
                        <div style={{ 
                            background: '#fff', 
                            padding: '10px 14px', 
                            borderRadius: 10, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 12 
                        }}>
                            <div style={{ 
                                width: 14, 
                                height: 14, 
                                background: PIE_COLORS[0], 
                                borderRadius: 3 
                            }} />
                            <div style={{ 
                                color: '#0f172a', 
                                fontSize: 14, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 8 
                            }}>
                                <span>{dir2 || "Arah 2"}</span>
                                <span style={{ 
                                    background: '#0f172a', 
                                    color: '#fff', 
                                    padding: '4px 8px', 
                                    borderRadius: 8, 
                                    fontWeight: 700, 
                                    fontSize: 12 
                                }}>
                                    {percents[0]}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile chart without legends */}
                <div className="sm:hidden">
                    <RechartsPieChart width={pieSize} height={pieSize}>
                        <Pie
                            data={data}
                            cx={center}
                            cy={center}
                            innerRadius={0}
                            outerRadius={outerRadius}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            label={renderPercentLabel}
                            labelLine={false}
                            paddingAngle={0}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={PIE_COLORS[index % PIE_COLORS.length]} 
                                    stroke="none" 
                                />
                            ))}
                        </Pie>
                    </RechartsPieChart>
                </div>

                {/* Mobile legends - Vertical below chart */}
                <div className="flex sm:hidden flex-col gap-2 mt-2">
                    <div style={{ 
                        background: '#fff', 
                        padding: '6px 10px', 
                        borderRadius: 8, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8 
                    }}>
                        <div style={{ 
                            width: 10, 
                            height: 10, 
                            background: PIE_COLORS[1], 
                            borderRadius: 2 
                        }} />
                        <div style={{ 
                            color: '#0f172a', 
                            fontSize: 11, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6 
                        }}>
                            <span>{dir1 || "Arah 1"}</span>
                            <span style={{ 
                                background: '#0f172a', 
                                color: '#fff', 
                                padding: '2px 6px', 
                                borderRadius: 5, 
                                fontWeight: 700, 
                                fontSize: 10 
                            }}>
                                {percents[1]}%
                            </span>
                        </div>
                    </div>
                    <div style={{ 
                        background: '#fff', 
                        padding: '6px 10px', 
                        borderRadius: 8, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8 
                    }}>
                        <div style={{ 
                            width: 10, 
                            height: 10, 
                            background: PIE_COLORS[0], 
                            borderRadius: 2 
                        }} />
                        <div style={{ 
                            color: '#0f172a', 
                            fontSize: 11, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6 
                        }}>
                            <span>{dir2 || "Arah 2"}</span>
                            <span style={{ 
                                background: '#0f172a', 
                                color: '#fff', 
                                padding: '2px 6px', 
                                borderRadius: 5, 
                                fontWeight: 700, 
                                fontSize: 10 
                            }}>
                                {percents[0]}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
