import React from 'react';
import { 
    PieChart as RechartsPieChart, 
    Pie, 
    Cell 
} from 'recharts';
import { PIE_SIZE, CENTER, OUTER_RADIUS, PIE_COLORS } from '../../utils/chartConfig';

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
    const total = data.reduce((s, p) => s + p.value, 0) || 1;
    const percents = data.map(p => Math.round((p.value / total) * 100));

    return (
        <div className="flex flex-col items-center relative">
            <h3 className="font-bold text-lg mb-4 text-white">KOMPOSISI ARAH</h3>
            <div style={{ position: 'relative', width: PIE_SIZE, height: PIE_SIZE }}>
                <RechartsPieChart width={PIE_SIZE} height={PIE_SIZE}>
                    <Pie
                        data={data}
                        cx={CENTER}
                        cy={CENTER}
                        innerRadius={0}
                        outerRadius={OUTER_RADIUS}
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

                {/* Left legend box - Arah 1 */}
                <div style={{ 
                    position: 'absolute', 
                    left: CENTER - OUTER_RADIUS - 130, 
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

                {/* Right legend box - Arah 2 */}
                <div style={{ 
                    position: 'absolute', 
                    right: CENTER - OUTER_RADIUS - 130, 
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
        </div>
    );
};
