/**
 * Configuration for traffic status colors and styling
 */
export const TRAFFIC_CONFIG: Record<string, { color: string; textColor: string }> = {
    "Sangat Lancar": { color: "#2E7D32", textColor: "text-white" },
    "Lancar":        { color: "#66BB6A", textColor: "text-black" },
    "Normal":        { color: "#FDD835", textColor: "text-black" },
    "Padat":         { color: "#FB8C00", textColor: "text-white" },
    "Sangat Padat":  { color: "#E53935", textColor: "text-white" },
    "Macet Total":   { color: "#212121", textColor: "text-white" },
};

/**
 * Map MKJI/PKJI Level of Service (A-F) to Indonesian status
 */
export const LOS_TO_STATUS: Record<string, string> = {
    "A": "Sangat Lancar",
    "B": "Lancar",
    "C": "Normal",
    "D": "Padat",
    "E": "Sangat Padat",
    "F": "Macet Total"
};

/**
 * Get traffic style based on status
 */
export const getTrafficStyle = (status: string) => {
    return TRAFFIC_CONFIG[status] || { color: "#9CA3AF", textColor: "text-white" };
};

/**
 * Chart color configuration
 */
export const CHART_COLORS = {
    primary: '#5EB5C4',
    secondary: '#E5E7EB',
    warning: '#F59E0B',
};

export const PIE_COLORS = ['#5EB5C4', '#E5E7EB'];

export const BAR_COLOR_MAP: Record<string, string> = {
    'Sumedang Kota': '#5EB5C4',
    'Cimalaka': '#E5E7EB',
    sumedang: '#5EB5C4',
    cimalaka: '#E5E7EB'
};

/**
 * Pie chart dimensions
 */
export const PIE_SIZE = 400;
export const PIE_SIZE_MOBILE = 280;
export const CENTER = Math.floor(PIE_SIZE / 2);
export const CENTER_MOBILE = Math.floor(PIE_SIZE_MOBILE / 2);
export const OUTER_RADIUS = Math.floor(PIE_SIZE * 0.37);
export const OUTER_RADIUS_MOBILE = Math.floor(PIE_SIZE_MOBILE * 0.37);
