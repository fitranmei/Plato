"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  showNotification: (message: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  function showNotification(message: string) {
    setNotification(message);
    setTimeout(() => setNotification(null), 2800);
  }

  return (
    <ModalContext.Provider value={{ isModalOpen, setIsModalOpen, showNotification }}>
      {children}
      {notification && (
        <div className="fixed right-6 top-6 z-50">
          <div className="bg-white text-black px-5 py-3 rounded-lg shadow-lg">
            {notification}
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
