"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  function showNotification(message: string, type: 'success' | 'error' = 'success') {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2800);
  }

  return (
    <ModalContext.Provider value={{ isModalOpen, setIsModalOpen, showNotification }}>
      {children}
      {notification && (
        <div className="fixed right-6 top-6 z-50 animate-slide-in-right">
          <div className={`px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 min-w-[280px] ${
            notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          }`}>
            {/* Icon */}
            {notification.type === 'error' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {/* Message */}
            <span className="flex-1">{notification.message}</span>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within ModalProvider');
  }
  return context;
}
