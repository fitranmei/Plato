"use client";
import React, { useEffect, useState } from 'react';
import Header from './header';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  // show sidebar only for lokasi pages
  const showSidebar = pathname.startsWith('/lokasi');

  const [open, setOpen] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    function handleResize() {
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      setIsDesktop(desktop);
      if (desktop && showSidebar) setOpen(true);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showSidebar]);

  // when route changes and sidebar isn't shown, make sure it's closed
  useEffect(() => {
    if (!showSidebar) setOpen(false);
  }, [showSidebar]);

  function toggle() {
    setOpen((s) => !s);
  }

  return (
    <div className="min-h-screen">
      {/* Sidebar (only when showSidebar) and overlay handled here to keep behavior consistent */}
      {showSidebar && <Sidebar controlledOpen={open} setOpen={setOpen} isDesktop={isDesktop} />}

      {/* content area is padded on large screens only when sidebar is present */}
      <div className={showSidebar ? 'lg:pl-64' : ''}>
        <Header onToggleSidebar={showSidebar ? toggle : undefined} />
        {children}
      </div>
    </div>
  );
}
