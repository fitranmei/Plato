"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, MapPin, Video, Truck, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Sidebar({ controlledOpen, setOpen, isDesktop }: { controlledOpen?: boolean; setOpen?: (v: boolean) => void; isDesktop?: boolean }) {
  const [openLocal, setOpenLocal] = useState<boolean>(false);
  const open = typeof controlledOpen === 'boolean' ? controlledOpen : openLocal;
  const setOpenUsed = setOpen || setOpenLocal;
  const pathname = usePathname();

  // Logic resize window (untuk UX responsif)
  const [isDesktopLocal, setIsDesktopLocal] = useState<boolean>(false);
  const desktop = typeof isDesktop === 'boolean' ? isDesktop : isDesktopLocal;

  useEffect(() => {
    if (typeof controlledOpen === 'boolean' || typeof setOpen === 'function') return;

    function onToggle() {
      setOpenLocal((v) => !v);
    }
    window.addEventListener('toggleSidebar', onToggle as EventListener);

    function handleResize() {
      const isD = window.matchMedia('(min-width: 1024px)').matches;
      setIsDesktopLocal(isD);
      if (isD) setOpenLocal(true);
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('toggleSidebar', onToggle as EventListener);
    };
  }, [controlledOpen, setOpen]);

  // Tutup sidebar saat ganti halaman di HP
  useEffect(() => {
    function onRoute() {
      if (!desktop) setOpenUsed(false);
    }
    window.addEventListener('hashchange', onRoute);
    return () => window.removeEventListener('hashchange', onRoute);
  }, [desktop, setOpenUsed]);

  return (
    <>
      {/* Overlay hitam (Cuma muncul di HP saat menu terbuka) */}
      {open && !desktop && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpenUsed(false)}
          aria-hidden
        />
      )}

      {/* SIDEBAR UTAMA */}
      <aside
        // PERBAIKAN DI SINI:
        // 1. Hapus 'lg:translate-x-0' (Biar dia mau sembunyi kalau open=false)
        // 2. Pertahankan 'lg:fixed' (Biar melayang)
        className={`fixed top-0 left-0 h-full z-50 transform bg-gray-100 text-gray-900 transition-transform duration-300 ease-in-out shadow-lg 
        ${open ? 'translate-x-0' : '-translate-x-full'}
        w-64 lg:fixed lg:block border-r border-gray-200`} 
        aria-hidden={open ? false : true}
      >
        <div className="h-full flex flex-col">
          
          {/* Header Sidebar (Logo P) */}
          {/* <div className="p-4 border-b h-16 flex items-center">
            <div className="flex items-center gap-3">
              <div className="font-bold text-lg tracking-tight">Admin Panel</div>
            </div>
          </div> */}

          {/* Menu Navigasi */}
          <nav className="flex-1 overflow-auto p-3">
            <ul className="space-y-1">
              <li>
                <Link href="/home" className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors font-medium ${pathname === '/home' ? 'bg-blue-100 text-black font-bold' : 'text-gray-400'}`}>
                  <Home size={20} /> <span>Beranda</span>
                </Link>
              </li>

              <li className="mt-4 mb-2 text-xs font-bold uppercase text-gray-400 px-3 tracking-wider">Manajemen Data</li>
              <li>
                <Link href="/lokasi" className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors font-medium ${pathname === '/lokasi' ? 'bg-blue-100 text-black font-bold' : 'text-gray-400'}`}>
                  <MapPin size={20} /> <span>Data Lokasi</span>
                </Link>
              </li>
              <li>
                <Link href="/kamera" className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors font-medium ${pathname === '/kamera' ? 'bg-blue-100 text-black font-bold' : 'text-gray-400'}`}>
                  <Video size={20} /> <span>Data Kamera</span>
                </Link>
              </li>
              <li>
                <Link href="/kendaraan" className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors font-medium ${pathname === '/kendaraan' ? 'bg-blue-100 text-black font-bold' : 'text-gray-400'}`}>
                  <Truck size={20} /> <span>Klasifikasi Kendaraan</span>
                </Link>
              </li>

              <li className="mt-4 mb-2 text-xs font-bold uppercase text-gray-400 px-3 tracking-wider">Manajemen User</li>
              <li>
                <Link href="/manajemen-user" className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors font-medium ${pathname === '/manajemen-user' ? 'bg-blue-100 text-black font-bold' : 'text-gray-400'}`}>
                  <Users size={20} /> <span>Data User</span>
                </Link>
              </li>
            </ul>
          </nav>

          {/* Footer Sidebar (Opsional) */}
          {/* <div className="p-4 border-t text-xs text-center text-gray-400">
            &copy; 2025 Intens
          </div> */}
        </div>
      </aside>
    </>
  );
}