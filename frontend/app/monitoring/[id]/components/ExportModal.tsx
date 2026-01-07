import React from 'react';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: () => void;
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    onExport,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Export Data Summary</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={2} 
                            stroke="currentColor" 
                            className="w-6 h-6"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-6 flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Awal
                        </label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                            value={startDate}
                            onChange={(e) => onStartDateChange(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Akhir
                        </label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                            value={endDate}
                            onChange={(e) => onEndDateChange(e.target.value)}
                        />
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex gap-2 items-start">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={2} 
                            stroke="currentColor" 
                            className="w-5 h-5 shrink-0 mt-0.5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        <p>
                            Data yang diexport adalah ringkasan volume dan kecepatan rata-rata per kelas kendaraan dalam rentang tanggal yang dipilih.
                        </p>
                    </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-medium transition"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={onExport}
                        className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md transition flex items-center gap-2"
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={2} 
                            stroke="currentColor" 
                            className="w-4 h-4"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download Excel
                    </button>
                </div>
            </div>
        </div>
    );
};
