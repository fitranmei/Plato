// NOTE: full file replaced below
"use client";
import React from 'react';
import Image from 'next/image';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import Header from "../components/header";

// Render percent label (angka) positioned slightly outside the outerRadius
function renderPercentLabel(props: any) {
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
}

function renderLegend(props: any) {
    const { payload } = props;
    if (!payload) return null;
    const total = pieData.reduce((s: number, p: any) => s + (p.value || 0), 0);
    // horizontal white boxed legend with name + percent
    return (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            {payload.map((entry: any, idx: number) => {
                const item: any = pieData.find((p) => p.name === entry.value) || {};
                const pct = total ? Math.round(((item.value || 0) / total) * 100) : 0;
                return (
                    <div key={`legend-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 12, height: 12, background: entry.color, borderRadius: 3 }} />
                            <span style={{ color: '#0f172a', fontSize: 14 }}>{entry.value}</span>
                        </div>
                        <div style={{ background: '#fff', padding: '8px 10px', borderRadius: 10, display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#0f172a', fontSize: 14, fontWeight: 700 }}>{pct}</span>
                            <span style={{ color: '#0f172a', fontSize: 12, marginLeft: 4 }}>%</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const pieData = [
    { name: 'Arah ke Cimalaka', value: 52 },
    { name: 'Arah ke Sumedang Kota', value: 48 }
];
const pieColors = ['#5EB5C4', '#E5E7EB'];

// compute simple percentages for legend badges
const _pieTotal = pieData.reduce((s: number, p: any) => s + (p.value || 0), 0) || 1;
const PIE_PERCENTS = pieData.map(p => Math.round(((p.value || 0) / _pieTotal) * 100));

const PIE_SIZE = 400;
const CENTER = Math.floor(PIE_SIZE / 2);
const OUTER_RADIUS = Math.floor(PIE_SIZE * 0.37);
const LEGEND_OFFSET = Math.floor(PIE_SIZE * 0.78);

const barData = [
    { date: '13/12/2025', sumedang: 120, cimalaka: 100 },
    { date: '14/12/2025', sumedang: 80, cimalaka: 90 },
    { date: '15/12/2025', sumedang: 110, cimalaka: 95 }
];

export default function MonitoringPage() {
    return (
        <main className="min-h-screen bg-[#1E293B] text-white font-sans pb-10">
            <Header />

            <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-6">
                        <DetailCard
                            headerColor="bg-[#D1F232]"
                            direction="Arah ke Sumedang Kota"
                            status="PADAT"
                            textColor="text-black"
                            speed={100}
                        />

                        <DetailCard
                            headerColor="bg-[#FAFF00]"
                            direction="Arah ke Cimalaka"
                            status="NORMAL"
                            textColor="text-black"
                            speed={80}
                        />

                        <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Export Data Summary
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg h-full min-h-[400px] flex flex-col justify-end p-4 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <span className="text-xl font-semibold">Live Camera Feed</span>
                        </div>
                        <p className="text-right text-gray-600 text-sm relative z-10">Update Terakhir: 19:00:02</p>
                    </div>
                </div>

                <hr className="border-gray-600" />

                <div className="text-center">
                    <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">ARUS KENDARAAN</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SimpleStats direction="Arah ke Sumedang Kota" count={80} />
                        <SimpleStats direction="Arah ke Cimalaka" count={80} />
                    </div>
                </div>

                {/* SECTION 3: Grafik */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    {/* Pie/Donut */}
                                        <div className="flex flex-col items-center relative">
                                                <h3 className="font-bold text-lg mb-4 text-white">KOMPOSISI ARAH</h3>
                                                <div style={{ position: 'relative', width: PIE_SIZE, height: PIE_SIZE }}>
                                                    <PieChart width={PIE_SIZE} height={PIE_SIZE}>
                                                        <Pie
                                                            data={pieData}
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
                                                            {pieData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} stroke="none" />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>

                                                    {/* Left white legend box */}
                                                    <div style={{ position: 'absolute', left: CENTER - OUTER_RADIUS - 130, top: '50%', transform: 'translateY(-50%)' }}>
                                                        <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <div style={{ width: 14, height: 14, background: pieColors[1], borderRadius: 3 }} />
                                                            <div style={{ color: '#0f172a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span>Arah ke Sumedang Kota</span>
                                                                <span style={{ background: '#0f172a', color: '#fff', padding: '4px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>{PIE_PERCENTS[1]}%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right white legend box */}
                                                    <div style={{ position: 'absolute', right: CENTER - OUTER_RADIUS - 130, top: '50%', transform: 'translateY(-50%)' }}>
                                                        <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <div style={{ width: 14, height: 14, background: pieColors[0], borderRadius: 3 }} />
                                                            <div style={{ color: '#0f172a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span>Arah ke Cimalaka</span>
                                                                <span style={{ background: '#0f172a', color: '#fff', padding: '4px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>{PIE_PERCENTS[0]}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                        </div>

                    {/* Bar chart */}
                    <div className="flex flex-col items-center w-full">
                        <h3 className="font-bold text-lg mb-4 text-center">GRAFIK TOTAL JUMLAH<br/>KENDARAAN DUA ARAH PER HARI</h3>
                        <BarChart width={350} height={300} data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="sumedang" fill="#5EB5C4" name="Sumedang Kota" />
                            <Bar dataKey="cimalaka" fill="#E5E7EB" name="Cimalaka" />
                        </BarChart>
                    </div>
                </div>

                {/* Placeholder graphs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <PlaceholderGraph title="Grafik Volume Kendaraan Arah ke Sumedang Kota" color="bg-[#5EB5C4]" />
                    <PlaceholderGraph title="Grafik Volume Kendaraan Arah ke Cimalaka" color="bg-[#5EB5C4]" />
                    <PlaceholderGraph title="Grafik Kecepatan Rata-Rata Kendaraan Arah ke Sumedang Kota" color="bg-[#5EB5C4]" />
                    <PlaceholderGraph title="Grafik Kecepatan Rata-Rata Kendaraan Arah ke Cimalaka" color="bg-[#5EB5C4]" />
                </div>
            </div>
        </main>
    );
}

function DetailCard({ headerColor, textColor, direction, status, speed }: any) {
    return (
        <div className="bg-white rounded-xl overflow-hidden text-gray-800 shadow-lg">
            <div className={`${headerColor} ${textColor} p-3 flex justify-between items-center font-bold`}>
                <div className='flex items-center'>
                    <div className="p-2 rounded-lg text-black">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                        </svg>
                    </div>
                    <span>{direction}</span>
                </div>
                <div className="flex items-center flex-row gap-2">
                    <span className=' text-end'>{status}</span>
                </div>
            </div>
            <div className="p-4">
                <div className="flex justify-between mb-4 border-b pt-4 pb-15 px-20">
                    <VehicleIcon label="30" sub="km/jam" type="Motor" />
                    <VehicleIcon label="30" sub="km/jam" type="Mobil" />
                    <VehicleIcon label="30" sub="km/jam" type="Truk" />
                    <VehicleIcon label="30" sub="km/jam" type="Bus" />
                    <VehicleIcon label="30" sub="km/jam" type="Kontainer" />
                </div>
                <div className="text-right">
                    <span className="text-sm font-semibold mr-2">Kecepatan Rata-Rata</span>
                    <span className="text-4xl font-bold">{speed}</span>
                    <span className="text-sm font-semibold ml-1">km/jam</span>
                </div>
            </div>
        </div>
    );
}

function VehicleIcon({ label, sub, type }: any) {
        const key = (type || '').toLowerCase();
        let imageName = 'car.png';
        if (key.includes('motor')) imageName = 'motor.png';
        else if (key.includes('mobil') || key.includes('car')) imageName = 'car.png';
        else if (key.includes('truk') || key.includes('truck')) imageName = 'truck.png';
        else if (key.includes('bus')) imageName = 'bus.png';
        else if (key.includes('kontainer') || key.includes('container')) imageName = 'container.png';

        return (
                <div className="flex flex-col items-center">
                    <Image
                        src={`/images/${imageName}`}
                        alt={type ? `Logo ${type}` : 'vehicle'}
                        width={40}
                        height={40}
                    />
                        <span className="font-bold text-xs">{label}</span>
                        <span className="text-[10px] text-gray-500">{sub}</span>
                </div>
        );
}

function SimpleStats({ direction, count }: any) {
    return (
        <div className="bg-white rounded-xl p-6 flex justify-between items-center text-gray-800 shadow">
            <div className="flex items-center gap-4">
                <Image
                  src="/images/car.png"
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
}

function PlaceholderGraph({ title, color }: any) {
    return (
        <div className="rounded-xl overflow-hidden shadow-lg bg-white h-48 flex flex-col">
            <div className={`${color} p-4 text-center font-bold text-white`}>{title}</div>
            <div className="flex-1 bg-white"></div>
        </div>
    );
}