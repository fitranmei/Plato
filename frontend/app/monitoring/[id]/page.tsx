
"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useParams, useRouter } from 'next/navigation';

// Bar color mapping for tooltip swatches
const BAR_COLOR_MAP: Record<string, string> = {
    'Sumedang Kota': '#5EB5C4',
    'Cimalaka': '#E5E7EB',
    sumedang: '#5EB5C4',
    cimalaka: '#E5E7EB'
};

function CustomBarTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div style={{ background: '#fff', color: '#0f172a', padding: 10, borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.18)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</div>
            {payload.map((p: any, i: number) => {
                const color = p.color || p.fill || BAR_COLOR_MAP[p.name] || BAR_COLOR_MAP[p.dataKey] || '#333';
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span style={{ width: 12, height: 12, background: color, borderRadius: 3, display: 'inline-block' }} />
                        <span style={{ fontSize: 13 }}>{p.name} : <strong style={{ marginLeft: 6 }}>{p.value}</strong></span>
                    </div>
                );
            })}
        </div>
    );
}


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

interface Location {
    id: string;
    nama_lokasi: string;
    alamat_lokasi: string;
    tipe_lokasi: string;
    // Add other fields as needed
}

export default function MonitoringPage() {
    const params = useParams();
    const [location, setLocation] = useState<Location | null>(null);
    const [loading, setLoading] = useState(true);

    // Mock Data State
    const [smpData, setSmpData] = useState({ arah1: 0, arah2: 0 });
    const [kilometer, setKilometer] = useState(0);
    const [userRole, setUserRole] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        if (!params.id) return;

        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        setUserRole(role);

        if (!token) {
            router.push('/login');
            return;
        }

        console.log("Monitoring Page: ID from params:", params.id);

        const fetchLocation = async () => {
            try {
                console.log(`Fetching location from /api/locations/${params.id}`);
                const res = await fetch(`/api/locations/${params.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log("Fetch response status:", res.status);
                
                if (!res.ok) {
                    const text = await res.text();
                    console.error("Fetch error body:", text);
                    throw new Error('Failed to fetch location');
                }
                
                const jsonData = await res.json();
                console.log("Fetch response json:", jsonData);
                setLocation(jsonData.data);
                
                // Simulate fetching dynamic data
                setSmpData({ 
                    arah1: Math.floor(Math.random() * 200) + 50, 
                    arah2: Math.floor(Math.random() * 200) + 50 
                });
                setKilometer(Math.floor(Math.random() * 10) + 5);

            } catch (error) {
                console.error("Error fetching location:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocation();
    }, [params.id, router]);

    if (loading) {
        return <div className="min-h-screen bg-[#1E293B] text-white flex items-center justify-center">Loading Monitoring Data...</div>;
    }

    if (!location) {
        return (
            <div className="min-h-screen bg-[#1E293B] text-white flex flex-col items-center justify-center gap-4">
                <div className="text-xl font-bold">Location not found.</div>
                <div className="text-gray-400">Requested ID: {params.id}</div>
                <div className="text-sm text-gray-500">Check console for details.</div>
                <a href="/lokasi" className="text-blue-400 hover:underline">Back to Locations</a>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#1E293B] text-white font-sans pb-10">

            <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 transform scale-90 origin-top">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-6">
                        <DetailCard
                            headerColor="bg-[#D1F232]"
                            direction="Arah 1"
                            status="PADAT"
                            textColor="text-black"
                            speed={Math.floor(Math.random() * 60) + 40}
                            locationType={location.tipe_lokasi}
                        />

                        <DetailCard
                            headerColor="bg-[#FAFF00]"
                            direction="Arah 2"
                            status="NORMAL"
                            textColor="text-black"
                            speed={Math.floor(Math.random() * 60) + 60}
                            locationType={location.tipe_lokasi}
                        />

                        {userRole !== 'user' && (
                            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                Export Data Summary
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-lg h-full min-h-[400px] flex flex-col justify-end p-4 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <span className="text-xl font-semibold">Live Camera Feed (ID: {location.id})</span>
                        </div>
                        <p className="text-right text-gray-600 text-sm relative z-10">Update Terakhir: {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>

                <hr className="border-gray-600" />

                <div className="text-center">
                    <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">ARUS KENDARAAN</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SimpleStats direction="Arah 1" count={smpData.arah1} />
                        <SimpleStats direction="Arah 2" count={smpData.arah2} />
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
                                                                <span>Arah 1</span>
                                                                <span style={{ background: '#0f172a', color: '#fff', padding: '4px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>{PIE_PERCENTS[1]}%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right white legend box */}
                                                    <div style={{ position: 'absolute', right: CENTER - OUTER_RADIUS - 130, top: '50%', transform: 'translateY(-50%)' }}>
                                                        <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <div style={{ width: 14, height: 14, background: pieColors[0], borderRadius: 3 }} />
                                                            <div style={{ color: '#0f172a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span>Arah 2</span>
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
                            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
                            <Legend wrapperStyle={{ color: '#ffffff' }} />
                            <Bar dataKey="sumedang" fill="#5EB5C4" name="Arah 1" />
                            <Bar dataKey="cimalaka" fill="#E5E7EB" name="Arah 2" />
                        </BarChart>
                    </div>
                </div>

                {/* Placeholder graphs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <PlaceholderGraph title="Grafik Volume Kendaraan Arah 1" color="bg-[#5EB5C4]" />
                    <PlaceholderGraph title="Grafik Volume Kendaraan Arah 2" color="bg-[#5EB5C4]" />
                    <PlaceholderGraph title="Grafik Kecepatan Rata-Rata Kendaraan Arah 1" color="bg-[#5EB5C4]" />
                    <PlaceholderGraph title="Grafik Kecepatan Rata-Rata Kendaraan Arah 2" color="bg-[#5EB5C4]" />
                </div>
            </div>
        </main>
    );
}

function DetailCard({ headerColor, textColor, direction, status, speed, locationType }: any) {
    const is12Classes = locationType === '12_kelas';
    const vehicles = is12Classes 
        ? Array.from({ length: 12 }, (_, i) => `Kelas ${i + 1}`)
        : ["Motor", "Mobil", "Truk", "Bus", "Kontainer"];

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
                <div className={`mb-4 border-b pt-4 pb-4 ${is12Classes ? 'grid grid-cols-6 gap-y-6 gap-x-2' : 'flex justify-between px-4 md:px-10'}`}>
                    {vehicles.map((v, i) => (
                        <VehicleIcon key={i} label={Math.floor(Math.random() * 50) + 10} sub="km/jam" type={v} />
                    ))}
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
        
        if (key === 'kelas 1') imageName = 'motor.png';
        else if (key === 'kelas 2' || key === 'kelas 3') imageName = 'car.png';
        else if (key === 'kelas 4' || key === 'kelas 5') imageName = 'bus.png';
        else if (key.includes('kelas')) imageName = 'truck.png';
        else if (key.includes('motor')) imageName = 'motor.png';
        else if (key.includes('mobil') || key.includes('car')) imageName = 'car.png';
        else if (key.includes('truk') || key.includes('truck')) imageName = 'truck.png';
        else if (key.includes('bus')) imageName = 'bus.png';
        else if (key.includes('kontainer') || key.includes('container')) imageName = 'container.png';

        return (
                <div className="flex flex-col items-center">
                    <span className="font-bold text-[10px] mb-1 text-center">{type}</span>
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