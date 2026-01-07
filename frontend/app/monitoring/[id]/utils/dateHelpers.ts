/**
 * Format timestamp to Indonesian locale with WIB timezone
 */
export const formatTimestampWIB = (timestamp: string | null): string => {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    }) + ' WIB';
};

/**
 * Format date for chart labels (DD/MM/YYYY)
 */
export const formatDateKey = (date: Date): string => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

/**
 * Get date range for last N days including today
 */
export const getDateRange = (days: number): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    
    return { startDate, endDate };
};

/**
 * Generate hourly data points (00:00 - 23:00) with mock data
 */
export const generateHourlyData = () => {
    return Array.from({ length: 24 }, (_, i) => ({
        time: `${i.toString().padStart(2, '0')}:00`,
        vol1: Math.floor(Math.random() * 300) + 50,
        vol2: Math.floor(Math.random() * 300) + 50,
        speed1: Math.floor(Math.random() * 40) + 30,
        speed2: Math.floor(Math.random() * 40) + 30,
    }));
};

/**
 * Aggregate traffic data by hour for both directions
 */
export const aggregateHourlyData = (trafficData: any[]) => {
    const hourlyAgg: Record<string, { 
        arah1: { volume: number; totalSpeed: number; count: number };
        arah2: { volume: number; totalSpeed: number; count: number };
    }> = {};

    // Initialize all 24 hours
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        hourlyAgg[hour] = {
            arah1: { volume: 0, totalSpeed: 0, count: 0 },
            arah2: { volume: 0, totalSpeed: 0, count: 0 }
        };
    }

    // Aggregate data
    trafficData.forEach((traffic: any) => {
        const date = new Date(traffic.timestamp);
        const hour = date.getHours().toString().padStart(2, '0');

        if (traffic.zona_arah_data && Array.isArray(traffic.zona_arah_data)) {
            // Arah 1
            if (traffic.zona_arah_data[0]) {
                const data1 = traffic.zona_arah_data[0];
                hourlyAgg[hour].arah1.volume += data1.total_kendaraan || 0;
                
                // Calculate weighted average speed
                if (data1.kelas_data && Array.isArray(data1.kelas_data)) {
                    data1.kelas_data.forEach((kelas: any) => {
                        const speed = kelas.kecepatan_rata_rata || kelas.kecepatan || 0;
                        const count = kelas.jumlah_kendaraan || 0;
                        hourlyAgg[hour].arah1.totalSpeed += speed * count;
                        hourlyAgg[hour].arah1.count += count;
                    });
                }
            }

            // Arah 2
            if (traffic.zona_arah_data[1]) {
                const data2 = traffic.zona_arah_data[1];
                hourlyAgg[hour].arah2.volume += data2.total_kendaraan || 0;
                
                if (data2.kelas_data && Array.isArray(data2.kelas_data)) {
                    data2.kelas_data.forEach((kelas: any) => {
                        const speed = kelas.kecepatan_rata_rata || kelas.kecepatan || 0;
                        const count = kelas.jumlah_kendaraan || 0;
                        hourlyAgg[hour].arah2.totalSpeed += speed * count;
                        hourlyAgg[hour].arah2.count += count;
                    });
                }
            }
        }
    });

    // Convert to array format for charts
    return Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        const agg = hourlyAgg[hour];
        
        return {
            time: `${hour}:00`,
            vol1: agg.arah1.volume,
            vol2: agg.arah2.volume,
            speed1: agg.arah1.count > 0 ? Math.round(agg.arah1.totalSpeed / agg.arah1.count) : 0,
            speed2: agg.arah2.count > 0 ? Math.round(agg.arah2.totalSpeed / agg.arah2.count) : 0
        };
    });
};

