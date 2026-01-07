export interface Location {
    id: string;
    nama_lokasi: string;
    alamat_lokasi: string;
    tipe_lokasi: string;
}

export interface ZonaArah {
    id: string;
    arah: string;
}

export interface CameraData {
    id: string;
    lokasi_id: string;
    zona_arah?: ZonaArah[];
}

export interface KelasData {
    kelas: number;
    jumlah_kendaraan: number;
    kecepatan_rata_rata?: number;
    kecepatan?: number;
}

export interface ZonaArahData {
    zona_arah_id: string;
    total_kendaraan: number;
    kecepatan_rata_rata?: number;
    kelas_data: KelasData[];
}

export interface MKJIAnalysis {
    tingkat_pelayanan: string;
    kapasitas?: number;
    derajat_kejenuhan?: number;
}

export interface PKJIAnalysis {
    tingkat_pelayanan: string;
}

export interface TrafficData {
    id: string;
    lokasi_id: string;
    timestamp: string;
    zona_arah_data: ZonaArahData[];
    mkji_analysis?: MKJIAnalysis;
    pkji_analysis?: PKJIAnalysis;
}

export interface ChartDataPoint {
    date: string;
    arah1: number;
    arah2: number;
}

export interface HourlyDataPoint {
    time: string;
    vol1: number;
    vol2: number;
    speed1: number;
    speed2: number;
}

export interface HourlyAggregation {
    [hour: string]: {
        arah1: { volume: number; totalSpeed: number; count: number };
        arah2: { volume: number; totalSpeed: number; count: number };
    };
}

export interface VehicleIconProps {
    count: number;
    speed: number;
    type: string;
}

export interface DetailCardProps {
    direction: string;
    speed: number;
    locationType: string;
    arrow?: 'up' | 'down';
    data: ZonaArahData | null;
    trafficData: TrafficData | null;
}

export interface SimpleStatsProps {
    direction: string;
    count: number;
}

export interface ChartCardProps {
    title: string;
    children: React.ReactNode;
}
