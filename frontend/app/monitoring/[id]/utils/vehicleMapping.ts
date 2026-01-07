/**
 * Map vehicle class name to corresponding image file
 */
export const getVehicleImage = (type: string): string => {
    const key = (type || '').toLowerCase();
    
    // Map based on class number
    if (key === 'kelas 1') return 'motor.svg';
    if (key === 'kelas 2') return 'car.svg';
    if (key === 'kelas 3') return 'kelas 3.svg';
    if (key === 'kelas 4') return 'truck.svg';
    if (key === 'kelas 5') return 'bus.svg';
    if (key === 'kelas 6') return 'kelas 6.svg';
    if (key === 'kelas 7') return 'kelas 7.svg';
    if (key === 'kelas 8') return 'kelas 8.svg';
    if (key === 'kelas 9') return 'kelas 9.svg';
    if (key === 'kelas 10') return 'kelas 10.svg';
    if (key === 'kelas 11') return 'container.svg';
    if (key === 'kelas 12') return 'kelas 12.svg';
    
    // Fallback for text-based categories (5-class system)
    if (key.includes('motor')) return 'motor.svg';
    if (key.includes('mobil') || key.includes('car')) return 'car.svg';
    if (key.includes('truk') || key.includes('truck')) return 'truck.svg';
    if (key.includes('bus')) return 'bus.svg';
    if (key.includes('kontainer') || key.includes('container')) return 'container.svg';
    
    return 'car.svg'; // Default
};
