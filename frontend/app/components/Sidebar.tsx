"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, MapPin, Video, Truck, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Sidebar({ controlledOpen, setOpen, isDesktop, isDark }: { controlledOpen?: boolean; setOpen?: (v: boolean) => void; isDesktop?: boolean; isDark?: boolean }) {
  const [openLocal, setOpenLocal] = useState<boolean>(false);
  const open = typeof controlledOpen === 'boolean' ? controlledOpen : openLocal;
  const setOpenUsed = setOpen || setOpenLocal;
  const pathname = usePathname();

  const [isDesktopLocal, setIsDesktopLocal] = useState<boolean>(false);
  const desktop = typeof isDesktop === 'boolean' ? isDesktop : isDesktopLocal;

  const [role, setRole] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

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

  useEffect(() => {
    function onRoute() {
      if (!desktop) setOpenUsed(false);
    }
    window.addEventListener('hashchange', onRoute);
    return () => window.removeEventListener('hashchange', onRoute);
  }, [desktop, setOpenUsed]);

  return (
    <>
      {open && !desktop && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpenUsed(false)}
          aria-hidden
        />
      )}

      <aside
      className={`fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out shadow-lg
      ${open ? 'translate-x-0' : '-translate-x-full'}
      w-64 lg:fixed lg:block border-r border-gray-200
      bg-gray-50 text-gray-900
      ${isDark ? 'opacity-25 pointer-events-none transition-opacity duration-300' : 'opacity-100 transition-opacity duration-300'}
      `}
>


        <div className="h-full flex flex-col">
          
          <nav className="flex-1 overflow-auto p-3">
            <ul className="space-y-1">
              <li>
                <Link href="/home" className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors font-medium ${pathname === '/home' ? 'bg-blue-100 text-black font-bold' : 'text-gray-400'}`}>
                  <Home size={20} /> <span>Beranda</span>
                </Link>
              </li>

              {(role === 'admin' || role === 'superadmin') && (
                <>
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
                </>
              )}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}