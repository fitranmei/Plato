import React from 'react';
import { BAR_COLOR_MAP } from '../../utils/chartConfig';

interface CustomBarTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

export const CustomBarTooltip: React.FC<CustomBarTooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
        <div style={{ 
            background: '#fff', 
            color: '#0f172a', 
            padding: 10, 
            borderRadius: 8, 
            boxShadow: '0 6px 18px rgba(2,6,23,0.18)' 
        }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</div>
            {payload.map((p: any, i: number) => {
                const color = p.color || p.fill || BAR_COLOR_MAP[p.name] || BAR_COLOR_MAP[p.dataKey] || '#333';
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span style={{ 
                            width: 12, 
                            height: 12, 
                            background: color, 
                            borderRadius: 3, 
                            display: 'inline-block' 
                        }} />
                        <span style={{ fontSize: 13 }}>
                            {p.name} : <strong style={{ marginLeft: 6 }}>{p.value}</strong>
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
