"use client";
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { AreaChart, Area, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMonitoringData } from './hooks/useMonitoringData';
import { DetailCard } from './components/DetailCard';
import { SimpleStats } from './components/SimpleStats';
import { ExportModal } from './components/ExportModal';
import { ChartCard } from './components/Charts/ChartCard';
import { TrafficPieChart } from './components/Charts/TrafficPieChart';
import { TrafficBarChart } from './components/Charts/TrafficBarChart';
import { formatTimestampWithZone } from './utils/dateHelpers';

export default function MonitoringPage() {
    const params = useParams();
    const { 
        location, 
        cameraData, 
        latestTrafficData, 
        barChartData,
        hourlyData,
        loading, 
        userRole 
    } = useMonitoringData(params.id);

    // Export State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");

    const handleExport = () => {
        if (!exportStartDate || !exportEndDate) {
            alert("Harap pilih Tanggal Awal dan Tanggal Akhir terlebih dahulu.");
            return;
        }
        
        const exportUrl = `http://localhost:8080/api/export/summary?location_id=${params.id}&start_date=${exportStartDate}&end_date=${exportEndDate}`;
        window.open(exportUrl, '_blank');
        setShowExportModal(false);
    };

    // Helper to calculate average speed
    const calculateAvgSpeed = (zona: any) => {
        if (!zona || !zona.kelas_data || zona.total_kendaraan === 0) return 0;
        const totalSpeedVolume = zona.kelas_data.reduce((acc: number, curr: any) => {
             return acc + ((curr.kecepatan_rata_rata || curr.kecepatan || 0) * curr.jumlah_kendaraan);
        }, 0);
        return Math.round(totalSpeedVolume / zona.total_kendaraan);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1E293B] text-white flex items-center justify-center">
                Loading Monitoring Data...
            </div>
        );
    }

    if (!location) {
        return (
            <div className="min-h-screen bg-[#1E293B] text-white flex flex-col items-center justify-center gap-4">
                <div className="text-xl font-bold">Location not found.</div>
                <div className="text-gray-400">Requested ID: {params.id}</div>
                <a href="/lokasi" className="text-blue-400 hover:underline">Back to Locations</a>
            </div>
        );
    }

    // Extract direction names
    const dir1 = cameraData?.zona_arah?.[0]?.arah || "Arah 1";
    const dir2 = cameraData?.zona_arah?.[1]?.arah || "Arah 2";

    // Extract zona_arah data
    const dataArah1 = latestTrafficData?.zona_arah_data?.[0];
    const dataArah2 = latestTrafficData?.zona_arah_data?.[1];

    const countArah1 = dataArah1?.total_kendaraan || 0;
    const countArah2 = dataArah2?.total_kendaraan || 0;

    const speed1 = calculateAvgSpeed(dataArah1) || 0;
    const speed2 = calculateAvgSpeed(dataArah2) || 0;

    // Pie chart data
    const pieDataReal = [
        { name: `Arah ke ${dir2}`, value: countArah2 },
        { name: `Arah ke ${dir1}`, value: countArah1 }
    ];

    return (
        <main className="min-h-screen bg-[#1E293B] text-white font-sans pb-10">
            <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 transform scale-90 origin-top">
                
                {/* Section 1: Detail Cards + Camera Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-6">
                        <DetailCard
                            direction={dir1}
                            speed={speed1}
                            locationType={location.tipe_lokasi}
                            arrow="up"
                            data={dataArah1 || null}
                            trafficData={latestTrafficData}
                        />

                        <DetailCard
                            direction={dir2}
                            speed={speed2}
                            locationType={location.tipe_lokasi}
                            arrow="down"
                            data={dataArah2 || null}
                            trafficData={latestTrafficData}
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
                        <p className="text-right text-gray-600 text-sm relative z-10">
                            Update Terakhir: {formatTimestampWithZone(latestTrafficData?.timestamp || null, location.zona_waktu)}
                        </p>
                    </div>
                </div>

                <hr className="border-gray-600" />

                {/* Section 2: Simple Stats */}
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">
                        ARUS KENDARAAN
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SimpleStats direction={dir1} count={countArah1} />
                        <SimpleStats direction={dir2} count={countArah2} />
                    </div>
                </div>

                {/* Section 3: Pie & Bar Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    <TrafficPieChart data={pieDataReal} dir1={dir1} dir2={dir2} />
                    <TrafficBarChart data={barChartData} dir1={dir1} dir2={dir2} />
                </div>

                {/* Section 4: Hourly Graphs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Volume Arah 1 */}
                    <ChartCard title={`Grafik Volume Kendaraan ${dir1}`}>
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
                    <ChartCard title={`Grafik Volume Kendaraan ${dir2}`}>
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
                    <ChartCard title={`Grafik Kecepatan Rata-Rata ${dir1}`}>
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
                    <ChartCard title={`Grafik Kecepatan Rata-Rata ${dir2}`}>
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
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
                startDate={exportStartDate}
                endDate={exportEndDate}
                onStartDateChange={setExportStartDate}
                onEndDateChange={setExportEndDate}
            />
        </main>
    );
}
