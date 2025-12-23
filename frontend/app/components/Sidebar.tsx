"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, MapPin, Video, Truck, Users } from 'lucide-react';

export default function Sidebar({ controlledOpen, setOpen, isDesktop }: { controlledOpen?: boolean; setOpen?: (v: boolean) => void; isDesktop?: boolean }) {
  // If parent provides controlledOpen, use it; otherwise behave uncontrolled (legacy)
  const [openLocal, setOpenLocal] = useState<boolean>(false);
  const open = typeof controlledOpen === 'boolean' ? controlledOpen : openLocal;
  const setOpenUsed = setOpen || setOpenLocal;

  // If parent does not control the sidebar, initialize local resize/listeners
  const [isDesktopLocal, setIsDesktopLocal] = useState<boolean>(false);
  const desktop = typeof isDesktop === 'boolean' ? isDesktop : isDesktopLocal;

  useEffect(() => {
    // only run uncontrolled behavior when parent didn't provide a controller
    if (typeof controlledOpen === 'boolean' || typeof setOpen === 'function') return;

    function onToggle() {
      setOpenLocal((v) => !v);
    }
    // custom event from Header
    window.addEventListener('toggleSidebar', onToggle as EventListener);

    // detect desktop / mobile and set initial open state
    function handleResize() {
      const isD = window.matchMedia('(min-width: 1024px)').matches;
      setIsDesktopLocal(isD);
      // keep sidebar open on desktop, closed on mobile unless previously opened
      if (isD) setOpenLocal(true);
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('toggleSidebar', onToggle as EventListener);
    };
  }, [controlledOpen, setOpen]);

  // close on navigation on small screens (only when uncontrolled or controlled via prop)
  useEffect(() => {
    function onRoute() {
      if (!desktop) setOpenUsed(false);
    }
    window.addEventListener('hashchange', onRoute);
    return () => window.removeEventListener('hashchange', onRoute);
  }, [desktop, setOpenUsed]);

  return (
    <>
      {/* overlay for mobile when open */}
      {open && !desktop && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpenUsed(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 transform bg-gray-100 text-gray-900 transition-transform duration-300 ease-in-out shadow-lg ${open ? 'translate-x-0' : '-translate-x-full'} w-64 lg:translate-x-0 lg:block`}
        aria-hidden={!open}
      >
        <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-indigo-700 flex items-center justify-center text-white">P</div>
            <div className="font-bold">Admin Monitoring</div>
          </div>
        </div>

        <nav className="flex-1 overflow-auto p-2">
          <ul className="space-y-1">
            <li>
              <Link href="/home" className="flex items-center gap-3 p-3 rounded hover:bg-gray-200">
                <Home size={18} /> <span>Beranda</span>
              </Link>
            </li>

            <li className="mt-2 text-xs uppercase text-gray-500 px-3">Manajemen Data</li>
            <li>
              <Link href="/lokasi" className="flex items-center gap-3 p-3 rounded hover:bg-gray-200">
                <MapPin size={18} /> <span>Data Lokasi</span>
              </Link>
            </li>
            <li>
              <Link href="/kamera" className="flex items-center gap-3 p-3 rounded hover:bg-gray-200">
                <Video size={18} /> <span>Data Kamera</span>
              </Link>
            </li>
            <li>
              <Link href="/klasifikasi" className="flex items-center gap-3 p-3 rounded hover:bg-gray-200">
                <Truck size={18} /> <span>Klasifikasi Kendaraan</span>
              </Link>
            </li>

            <li className="mt-4 text-xs uppercase text-gray-500 px-3">Manajemen User</li>
            <li>
              <Link href="/manajemen-user" className="flex items-center gap-3 p-3 rounded hover:bg-gray-200">
                <Users size={18} /> <span>Data User</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={() => setOpenUsed(!open)}
            className="w-full text-left text-sm text-gray-700 p-2 rounded hover:bg-gray-200"
          >
            Toggle Menu
          </button>
        </div>
      </div>
      </aside>
    </>
    );
}
