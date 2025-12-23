"use client";
import React, { useEffect, useState } from 'react';
import Header from './header';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  
  // UPDATE DISINI: Daftar halaman yang punya Sidebar
  const showSidebar = 
    pathname.startsWith('/lokasi') || 
    pathname.startsWith('/kamera') || 
    pathname.startsWith('/kendaraan') || 
    pathname.startsWith('/manajemen-user');

  const [open, setOpen] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    function handleResize() {
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      setIsDesktop(desktop);
      // Kalau di desktop & halaman admin, sidebar otomatis terbuka
      if (desktop && showSidebar) setOpen(true);
      // Kalau di mobile, sidebar tutup dulu
      if (!desktop) setOpen(false); 
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showSidebar]);

  useEffect(() => {
    if (!showSidebar) setOpen(false);
  }, [showSidebar]);

  function toggle() {
    setOpen((s) => !s);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar logic */}
      {showSidebar && <Sidebar controlledOpen={open} setOpen={setOpen} isDesktop={isDesktop} />}

      {/* Geser konten ke kanan kalau sidebar muncul */}
      <div className={`${showSidebar && open ? 'lg:pl-64' : ''} transition-all duration-300`}>
        <Header onToggleSidebar={showSidebar ? toggle : undefined} />
        {children}
      </div>
    </div>
  );
}