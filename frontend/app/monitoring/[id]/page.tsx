
"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, AreaChart, Area, LineChart, Line, CartesianGrid, ResponsiveContainer } from 'recharts';
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

// Mock Data for Hourly Graphs (00:00 - 23:00)
const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i.toString().padStart(2, '0')}:00`,
    vol1: Math.floor(Math.random() * 300) + 50,
    vol2: Math.floor(Math.random() * 300) + 50,
    speed1: Math.floor(Math.random() * 40) + 30,
    speed2: Math.floor(Math.random() * 40) + 30,
}));

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
    const [cameraData, setCameraData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Mock Data State
    const [smpData, setSmpData] = useState({ arah1: 0, arah2: 0 });
    const [kilometer, setKilometer] = useState(0);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Export State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");

    const router = useRouter();

    const handleExport = () => {
        if (!exportStartDate || !exportEndDate) {
            alert("Harap pilih Tanggal Awal dan Tanggal Akhir terlebih dahulu.");
            return;
        }
        
        // TODO: Ganti URL ini dengan endpoint backend yang sebenarnya nanti
        // Format request biasanya: /api/export?location_id=...&start=...&end=...
        const exportUrl = `http://localhost:8080/api/export/summary?location_id=${params.id}&start_date=${exportStartDate}&end_date=${exportEndDate}`;
        
        console.log("Downloading from:", exportUrl);
        
        // Membuka URL di tab baru untuk memicu download
        window.open(exportUrl, '_blank');
        
        setShowExportModal(false);
    };

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

        const fetchData = async () => {
            try {
                // 1. Fetch Location
                console.log(`Fetching location from /api/locations/${params.id}`);
                const resLoc = await fetch(`/api/locations/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!resLoc.ok) throw new Error('Failed to fetch location');
                const jsonLoc = await resLoc.json();
                setLocation(jsonLoc.data);

                // 2. Fetch Camera for Direction Names
                const resCam = await fetch(`/api/cameras/lokasi/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resCam.ok) {
                    const jsonCam = await resCam.json();
                    if (jsonCam.data && Array.isArray(jsonCam.data) && jsonCam.data.length > 0) {
                        setCameraData(jsonCam.data[0]);
                    }
                }
                
                // Simulate fetching dynamic data
                setSmpData({ 
                    arah1: Math.floor(Math.random() * 200) + 50, 
                    arah2: Math.floor(Math.random() * 200) + 50 
                });
                setKilometer(Math.floor(Math.random() * 10) + 5);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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

    const dir1 = cameraData?.zona_arah?.[0]?.arah || "Arah 1";
    const dir2 = cameraData?.zona_arah?.[1]?.arah || "Arah 2";

    return (
        <main className="min-h-screen bg-[#1E293B] text-white font-sans pb-10">

            <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 transform scale-90 origin-top">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-6">
                        <DetailCard
                            direction={dir1}
                            speed={Math.floor(Math.random() * 60) + 40}
                            locationType={location.tipe_lokasi}
                        />

                        <DetailCard
                            direction={dir2}
                            speed={Math.floor(Math.random() * 60) + 60}
                            locationType={location.tipe_lokasi}
                        />

                        {userRole !== 'user' && (
                            <button 
                                onClick={() => setShowExportModal(true)}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition"
                            >
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
                        <SimpleStats direction={dir1} count={smpData.arah1} />
                        <SimpleStats direction={dir2} count={smpData.arah2} />
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

                        {/* LHR Card */}
                        <div className="bg-white rounded-xl p-5 mt-6 text-center w-full max-w-sm shadow-lg text-gray-800 border border-gray-100">
                            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">LHR Periode Ini</div>
                            <div className="text-4xl font-extrabold text-[#0f172a] flex items-baseline justify-center gap-2">
                                {Math.round(barData.reduce((acc, curr) => acc + (curr.sumedang || 0) + (curr.cimalaka || 0), 0) / barData.length).toLocaleString('id-ID')} 
                                <span className="text-sm text-gray-500 font-bold">SMP/Hari</span>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-2 font-medium bg-gray-50 py-1 px-2 rounded-full inline-block">
                                (Dihitung dari rata-rata tanggal {barData[0].date.substring(0, 5)} s.d. {barData[barData.length - 1].date.substring(0, 5)})
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 4: Hourly Graphs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Volume Arah 1 */}
                    <ChartCard title="Grafik Volume Kendaraan Arah 1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData}>
                                <defs>
                                    <linearGradient id="colorVol1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#5EB5C4" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#5EB5C4" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="time" style={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                                <YAxis style={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="vol1" stroke="#5EB5C4" fillOpacity={1} fill="url(#colorVol1)" name="Volume" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Volume Arah 2 */}
                    <ChartCard title="Grafik Volume Kendaraan Arah 2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData}>
                                <defs>
                                    <linearGradient id="colorVol2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#5EB5C4" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#5EB5C4" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="time" style={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                                <YAxis style={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="vol2" stroke="#5EB5C4" fillOpacity={1} fill="url(#colorVol2)" name="Volume" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Speed Arah 1 */}
                    <ChartCard title="Grafik Kecepatan Rata-Rata Kendaraan Arah 1">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="time" style={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                                <YAxis style={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="speed1" stroke="#F59E0B" strokeWidth={3} dot={false} name="Kecepatan (km/jam)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Speed Arah 2 */}
                    <ChartCard title="Grafik Kecepatan Rata-Rata Kendaraan Arah 2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="time" style={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                                <YAxis style={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="speed2" stroke="#F59E0B" strokeWidth={3} dot={false} name="Kecepatan (km/jam)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">Export Data Summary</h3>
                            <button onClick={() => setShowExportModal(false)} className="text-gray-500 hover:text-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Awal</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                                    value={exportStartDate}
                                    onChange={(e) => setExportStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                                    value={exportEndDate}
                                    onChange={(e) => setExportEndDate(e.target.value)}
                                />
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex gap-2 items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                </svg>
                                <p>Data yang diexport adalah ringkasan volume dan kecepatan rata-rata per kelas kendaraan dalam rentang tanggal yang dipilih.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowExportModal(false)}
                                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-medium transition"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleExport}
                                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md transition flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                Download Excel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function ChartCard({ title, children }: any) {
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
}


const TRAFFIC_CONFIG: Record<string, { color: string; textColor: string }> = {
  "Sangat Lancar": { color: "#2E7D32", textColor: "text-white" },
  "Lancar":        { color: "#66BB6A", textColor: "text-black" },
  "Normal":        { color: "#FDD835", textColor: "text-black" },
  "Padat":         { color: "#FB8C00", textColor: "text-white" },
  "Sangat Padat":  { color: "#E53935", textColor: "text-white" },
  "Macet Total":   { color: "#212121", textColor: "text-white" },
};

const getTrafficStyle = (status: string) => {
  return TRAFFIC_CONFIG[status] || { color: "#9CA3AF", textColor: "text-white" }; // Default gray
};

const STATUS_KEYS = Object.keys(TRAFFIC_CONFIG);

function DetailCard({  direction, speed, locationType }: any) {
    const is12Classes = locationType === '12_kelas';
    const vehicles = is12Classes 
        ? Array.from({ length: 12 }, (_, i) => `Kelas ${i + 1}`)
        : ["Motor", "Mobil", "Truk", "Bus", "Kontainer"];
    
    // Determine status randomly or based on speed (mock logic)
    // In real app, this should come from props
    let status = "Lancar";
    if (speed < 10) status = "Macet Total";
    else if (speed < 20) status = "Sangat Padat";
    else if (speed < 40) status = "Padat";
    else if (speed < 60) status = "Normal";
    else if (speed < 80) status = "Lancar";
    else status = "Sangat Lancar";

    const style = getTrafficStyle(status);

    return (
        <div className="bg-white rounded-xl overflow-hidden text-gray-800 shadow-lg">
            <div className={`p-3 flex justify-between items-center font-bold ${style.textColor}`} style={{ backgroundColor: style.color }}>
                <div className='flex items-center'>
                    <div className="p-2 rounded-lg text-black bg-white/20 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                        </svg>
                    </div>
                    <span className="ml-2">{direction}</span>
                </div>
                <div className="flex items-center flex-row gap-2">
                    <span className=' text-end'>{status.toUpperCase()}</span>
                </div>
            </div>
            <div className="p-4">
                <div className={`mb-2 border-b pt-2 pb-2 ${is12Classes ? 'grid grid-cols-6 gap-y-6 gap-x-2' : 'flex justify-between px-4 md:px-10'}`}>
                    {vehicles.map((v, i) => (
                        <VehicleIcon 
                            key={i} 
                            count={Math.floor(Math.random() * 500) + 50} 
                            speed={Math.floor(Math.random() * 60) + 20} 
                            type={v} 
                        />
                    ))}
                </div>
                <div className="text-right">
                    <span className="text-xs font-semibold mr-2 text-gray-500">Kecepatan Rata-Rata</span>
                    <span className="text-lg font-bold">{speed}</span>
                    <span className="text-xs font-semibold ml-1 text-gray-500">km/jam</span>
                </div>
            </div>
        </div>
    );
}

function VehicleIcon({ count, speed, type }: any) {
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
                        <span className="font-bold text-lg mt-1">{count}</span>
                        <span className="text-xs font-semibold text-gray-500">{speed} km/jam</span>
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