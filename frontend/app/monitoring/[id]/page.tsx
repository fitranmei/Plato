"use client";
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Video } from 'lucide-react';
import { useModalContext } from '../../components/ModalContext';
import { AreaChart, Area, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMonitoringData } from './hooks/useMonitoringData';
import { DetailCard } from './components/DetailCard';
import { SimpleStats } from './components/SimpleStats';
import { ExportModal } from './components/ExportModal';
import { ChartCard } from './components/Charts/ChartCard';
import { TrafficPieChart } from './components/Charts/TrafficPieChart';
import { TrafficBarChart } from './components/Charts/TrafficBarChart';
import { formatTimestampWithZone } from './utils/dateHelpers';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

// Component untuk HLS Video Player
function HLSPlayer({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => console.log("Autoplay blocked:", e));
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.log("HLS Error:", data);
            });

            return () => {
                hls.destroy();
            };
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            video.src = src;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => console.log("Autoplay blocked:", e));
            });
        }
    }, [src]);

    return (
        <video
            ref={videoRef}
            controls
            muted
            playsInline
            className="w-full h-full object-contain"
        />
    );
}

export default function MonitoringPage() {
    const params = useParams();
    const { showNotification } = useModalContext();
    const { 
        location, 
        cameraData, 
        latestTrafficData, 
        barChartData,
        hourlyData,
        loading, 
        userRole 
    } = useMonitoringData(params.id);

    // State Sumber Video
    const [videoSource, setVideoSource] = useState<{
        type: 'hls' | 'youtube' | 'image' | 'rtsp' | 'none',
        url: string,
        embedUrl?: string,
        isStreaming?: boolean,
        message?: string
    } | null>(null);
    const [loadingVideo, setLoadingVideo] = useState(true);

    // Export State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");

    // Fetch Video Source
    useEffect(() => {
        const fetchVideoSource = async () => {
            if (!params.id) return;
            
            setLoadingVideo(true);
            const token = localStorage.getItem('token');
            console.log(`[Monitoring] Fetching video source for ${params.id}...`);
            
            try {
                const response = await fetch(`/api/locations/${params.id}/source/playable`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log(`[Monitoring] Response status: ${response.status}`);

                if (response.ok) {
                    const data = await response.json();
                    console.log('[Monitoring] Video source data:', data);
                    setVideoSource({
                        type: data.type || 'none',
                        url: data.url || '',
                        embedUrl: data.embed_url,
                        isStreaming: data.is_streaming,
                        message: data.message
                    });
                } else {
                    console.warn('[Monitoring] Failed to fetch video source');
                    setVideoSource({ type: 'none', url: '', message: 'Source tidak tersedia' });
                }
            } catch (error) {
                console.error('[Monitoring] Error fetching video source:', error);
                setVideoSource({ type: 'none', url: '', message: 'Error loading video source' });
            } finally {
                setLoadingVideo(false);
            }
        };
        
        fetchVideoSource();
    }, [params.id]);

    const handleExport = () => {
        if (!exportStartDate || !exportEndDate) {
            showNotification("Harap pilih Tanggal Awal dan Tanggal Akhir terlebih dahulu.", 'error');
            return;
        }
        
        // Convert dates to ISO format with time
        const startDateTime = new Date(exportStartDate);
        startDateTime.setHours(0, 0, 0, 0);
        const endDateTime = new Date(exportEndDate);
        endDateTime.setHours(23, 59, 59, 999);
        
        const token = localStorage.getItem('token');
        const exportUrl = `/api/traffic-raw-data/export-excel?lokasi_id=${params.id}&start_time=${startDateTime.toISOString()}&end_time=${endDateTime.toISOString()}`;
        
        // Fetch with authorization header then trigger download
        fetch(exportUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Export gagal');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `traffic_data_${params.id}_${exportStartDate}_${exportEndDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('Export berhasil!', 'success');
        })
        .catch(error => {
            showNotification('Export gagal: ' + error.message, 'error');
        });
        
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

    const interval = latestTrafficData?.interval_menit || 5;
    const multiplier = 60 / interval;

    const countArah1 = Math.round((dataArah1?.total_kendaraan || 0) * multiplier);
    const countArah2 = Math.round((dataArah2?.total_kendaraan || 0) * multiplier);

    const speed1 = calculateAvgSpeed(dataArah1) || 0;
    const speed2 = calculateAvgSpeed(dataArah2) || 0;

    // Pie chart data
    const pieDataReal = [
        { name: `Arah ke ${dir2}`, value: countArah2 },
        { name: `Arah ke ${dir1}`, value: countArah1 }
    ];

    return (
        <main className="min-h-screen bg-[#1E293B] text-white font-sans pb-10">
            <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 transform scale-90 origin-top">
                
                {/* Section 1: Detail Cards + Camera Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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

                    <div className="bg-white rounded-xl shadow-lg h-full min-h-[400px] flex flex-col relative overflow-hidden">
                        {/* Video Player / Feed */}
                        <div className="flex-1 relative bg-black flex items-center justify-center">
                            {loadingVideo ? (
                                <div className="text-white">Loading video...</div>
                            ) : videoSource?.type === 'hls' && videoSource.isStreaming ? (
                                <HLSPlayer src={videoSource.url} />
                            ) : videoSource?.type === 'youtube' && videoSource.embedUrl ? (
                                <iframe
                                    src={videoSource.embedUrl}
                                    className="w-full h-full"
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                />
                            ) : videoSource?.type === 'image' ? (
                                <img src={videoSource.url} alt="Location" className="w-full h-full object-contain" />
                            ) : videoSource?.type === 'rtsp' && !videoSource.isStreaming ? (
                                <div className="text-white text-center p-4">
                                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="mb-2">{videoSource.message}</p>
                                    <p className="text-sm text-gray-400">URL: {videoSource.url}</p>
                                    {userRole === 'superadmin' && (
                                        <button
                                            onClick={async () => {
                                                const token = localStorage.getItem('token');
                                                try {
                                                    const res = await fetch(`/api/streams/${params.id}/start`, {
                                                        method: 'POST',
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });
                                                    if (res.ok) {
                                                        showNotification('Stream dimulai', 'success');
                                                        // Refresh video source
                                                        setTimeout(() => window.location.reload(), 2000);
                                                    } else {
                                                        const err = await res.json();
                                                        showNotification(err.error || 'Gagal memulai stream', 'error');
                                                    }
                                                } catch (error) {
                                                    showNotification('Error memulai stream', 'error');
                                                }
                                            }}
                                            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                                        >
                                            Start RTSP Stream
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-white text-center p-4">
                                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Video source belum dikonfigurasi untuk lokasi ini</p>
                                    <p className="text-sm text-gray-400 mt-2">Hubungi admin untuk menambahkan source</p>
                                </div>
                            )}
                        </div>
                        {/* Footer with timestamp */}
                        <div className="bg-white p-4 border-t border-gray-200">
                            <p className="text-right text-gray-600 text-sm">
                                Update Terakhir: {formatTimestampWithZone(latestTrafficData?.timestamp || null, (location as any).zona_waktu)}
                            </p>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-600" />

                {/* Section 2: Simple Stats */}
                <div className="text-center">
                    <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center justify-center gap-2">
                        ARUS KENDARAAN
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <SimpleStats direction={dir1} count={countArah1} />
                        <SimpleStats direction={dir2} count={countArah2} />
                    </div>
                </div>

                {/* Section 3: Pie & Bar Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mt-4">
                    <TrafficPieChart data={pieDataReal} dir1={dir1} dir2={dir2} />
                    <TrafficBarChart data={barChartData} dir1={dir1} dir2={dir2} />
                </div>

                {/* Section 4: Hourly Graphs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4">
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
