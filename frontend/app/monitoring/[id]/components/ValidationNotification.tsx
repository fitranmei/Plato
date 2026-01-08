import React, { useEffect } from 'react';

interface ValidationNotificationProps {
    isVisible: boolean;
    message: string;
    onClose: () => void;
    duration?: number;
}

export const ValidationNotification: React.FC<ValidationNotificationProps> = ({
    isVisible,
    message,
    onClose,
    duration = 3000
}) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full pointer-events-auto animate-in fade-in slide-in-from-top-10 duration-300">
                <div className="p-6 flex flex-col gap-4">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={2} 
                                stroke="currentColor" 
                                className="w-6 h-6 text-red-600"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="text-center">
                        <p className="text-gray-800 font-medium text-base">
                            {message}
                        </p>
                    </div>

                    {/* Button */}
                    <button 
                        onClick={onClose}
                        className="w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-blue-600 text-white font-semibold transition"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
