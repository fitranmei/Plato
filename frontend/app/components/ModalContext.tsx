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
        <div className="fixed right-6 top-6 z-50 animate-fade-in-down">
            <div className={`px-5 py-3 rounded-lg shadow-lg text-white ${
                notification.type === 'error' ? 'bg-red-500' : 'bg-green-500' // Changed default to green for success, or keep white/black if preferred
            }`}>
            {notification.message}
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
