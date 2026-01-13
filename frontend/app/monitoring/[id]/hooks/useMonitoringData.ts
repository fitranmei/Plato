import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Location, CameraData, TrafficData, ChartDataPoint, HourlyDataPoint } from '../types/monitoring.types';
import { formatDateKey, aggregateHourlyData } from '../utils/dateHelpers';

interface UseMonitoringDataReturn {
    location: Location | null;
    cameraData: CameraData | null;
    latestTrafficData: TrafficData | null;
    barChartData: ChartDataPoint[];
    hourlyData: HourlyDataPoint[];
    loading: boolean;
    userRole: string | null;
    kilometer: number;
}

export const useMonitoringData = (locationId: string | string[]): UseMonitoringDataReturn => {
    const router = useRouter();
    const [location, setLocation] = useState<Location | null>(null);
    const [cameraData, setCameraData] = useState<CameraData | null>(null);
    const [latestTrafficData, setLatestTrafficData] = useState<TrafficData | null>(null);
    const [barChartData, setBarChartData] = useState<ChartDataPoint[]>([]);
    const [hourlyData, setHourlyData] = useState<HourlyDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [kilometer, setKilometer] = useState(0);

    useEffect(() => {
        if (!locationId) return;

        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        setUserRole(role);

        if (!token) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Fetch Location
                const resLoc = await fetch(`/api/locations/${locationId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!resLoc.ok) throw new Error('Failed to fetch location');
                const jsonLoc = await resLoc.json();
                setLocation(jsonLoc.data);

                // 2. Fetch Camera for Direction Names
                const resCam = await fetch(`/api/cameras/lokasi/${locationId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resCam.ok) {
                    const jsonCam = await resCam.json();
                    if (jsonCam.data && Array.isArray(jsonCam.data) && jsonCam.data.length > 0) {
                        setCameraData(jsonCam.data[0]);
                    }
                }

                // 3. Fetch Latest Traffic Data
                const resTraffic = await fetch(`/api/traffic-data/lokasi/${locationId}/latest`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resTraffic.ok) {
                    const jsonTraffic = await resTraffic.json();
                    if (jsonTraffic.data) {
                       setLatestTrafficData(jsonTraffic.data);
                    }
                }
                
                // 4. Fetch Historical Traffic Data (Last 7 days for bar chart)
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 6);
                // Reset to start of day in UTC to capture full day's data
                startDate.setUTCHours(0, 0, 0, 0);
                endDate.setUTCHours(23, 59, 59, 999);
                
                const resHistorical = await fetch(
                    `/api/traffic-data?lokasi_id=${locationId}&start_time=${startDate.toISOString()}&end_time=${endDate.toISOString()}&limit=1000`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                
                if (resHistorical.ok) {
                    const jsonHistorical = await resHistorical.json();
                    const historicalData = jsonHistorical.data || [];
                    
                    // Group by date and sum total_kendaraan per zona_arah
                    const dailyData: Record<string, { arah1: number, arah2: number }> = {};
                    
                    historicalData.forEach((traffic: any) => {
                        const date = new Date(traffic.timestamp);
                        const dateKey = formatDateKey(date);
                        
                        if (!dailyData[dateKey]) {
                            dailyData[dateKey] = { arah1: 0, arah2: 0 };
                        }
                        
                        if (traffic.zona_arah_data && Array.isArray(traffic.zona_arah_data)) {
                            if (traffic.zona_arah_data[0]) {
                                dailyData[dateKey].arah1 += traffic.zona_arah_data[0].total_kendaraan || 0;
                            }
                            if (traffic.zona_arah_data[1]) {
                                dailyData[dateKey].arah2 += traffic.zona_arah_data[1].total_kendaraan || 0;
                            }
                        }
                    });
                    
                    // Convert to array format for chart (last 7 days)
                    const chartData = [];
                    for (let i = 6; i >= 0; i--) {
                        const date = new Date();
                        // Use UTC date to match the timestamp processing
                        const utcDate = new Date(Date.UTC(
                            date.getUTCFullYear(),
                            date.getUTCMonth(),
                            date.getUTCDate() - i
                        ));
                        const dateKey = formatDateKey(utcDate);
                        
                        chartData.push({
                            date: dateKey,
                            arah1: dailyData[dateKey]?.arah1 || 0,
                            arah2: dailyData[dateKey]?.arah2 || 0
                        });
                    }
                    
                    setBarChartData(chartData);
                }
                
                // 5. Fetch Today's Hourly Traffic Data
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const endOfDay = new Date(today);
                endOfDay.setHours(23, 59, 59, 999);
                
                const resToday = await fetch(
                    `/api/traffic-data?lokasi_id=${locationId}&start_time=${today.toISOString()}&end_time=${endOfDay.toISOString()}&limit=10000`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                
                if (resToday.ok) {
                    const jsonToday = await resToday.json();
                    const todayData = jsonToday.data || [];
                    
                    // Aggregate by hour
                    const hourlyAggregated = aggregateHourlyData(todayData);
                    setHourlyData(hourlyAggregated);
                } else {
                    // If no data, set empty hourly data
                    setHourlyData(Array.from({ length: 24 }, (_, i) => ({
                        time: `${i.toString().padStart(2, '0')}:00`,
                        vol1: 0,
                        vol2: 0,
                        speed1: 0,
                        speed2: 0
                    })));
                }
                
                // Mock kilometer data
                setKilometer(Math.floor(Math.random() * 10) + 5);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [locationId, router]);

    return {
        location,
        cameraData,
        latestTrafficData,
        barChartData,
        hourlyData,
        loading,
        userRole,
        kilometer
    };
};
