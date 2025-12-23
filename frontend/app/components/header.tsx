"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; 
import { usePathname, useRouter } from "next/navigation";
import { Search, LogOut, ArrowLeft, Menu, MapPin, Video, Truck, Users } from "lucide-react";

export default function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // State untuk Dropdown Menu di Home
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/home" || pathname === "/";

  // Logic Judul Halaman
  let title = "Dashboard";
  if (pathname?.startsWith("/lokasi")) title = "DATA LOKASI";
  else if (pathname?.startsWith("/kamera")) title = "DATA KAMERA";
  else if (pathname?.startsWith("/klasifikasi")) title = "KLASIFIKASI KENDARAAN";
  else if (pathname?.startsWith("/monitoring")) title = "TFC - Cimayor";
  else if (pathname?.startsWith("/manajemen-user")) title = "MANAJEMEN USER";

  // Fitur: Klik di luar menu untuk menutup dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 px-6 flex items-center justify-between text-black shadow-sm h-16 transition-all">

      {/* --- BAGIAN KIRI --- */}
      <div className="flex items-center gap-4">
        {isHome ? (
           // MODE HOME: Logo
           <div className="relative h-9 w-9">
             <Image 
               src="/images/logo.png" 
               alt="Logo Dishub" 
               fill 
               className="object-contain"
             />
           </div>
        ) : (
           // MODE LAIN: Tombol Back + Judul
           <div className="flex items-center gap-3">
             <button 
               onClick={() => router.back()} 
               className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
             >
                 <ArrowLeft size={24} strokeWidth={2.5} className="text-black" />
             </button>
             <h1 className="text-lg md:text-xl font-bold text-black tracking-tight uppercase">
                 {title}
             </h1>
           </div>
        )}
      </div>

      {/* --- BAGIAN TENGAH: Search Bar --- */}
      <div className="flex-1 flex justify-center px-4 md:px-10">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all font-medium text-sm"
          />
        </div>
      </div>

      {/* --- BAGIAN KANAN --- */}
      <div className="flex items-center gap-4">
        {isHome ? (
           // MODE HOME: Nama + Hamburger + Dropdown
           <div className="flex items-center gap-3 relative" ref={menuRef}>
             
             {/* 1. Nama User (Baru Ditambahkan) */}
             <span className="font-bold text-base text-black hidden md:block">
                 Andreas Calvin
             </span>

             {/* 2. Tombol Hamburger */}
             <button 
               onClick={() => setIsOpen(!isOpen)} 
               className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
             >
                <Menu size={28} strokeWidth={2.5} className="text-black" />
             </button>

             {/* 3. DROPDOWN MENU (Muncul saat diklik) */}
             {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Group: Manajemen Data */}
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Manajemen Data
                    </div>
                    <Link href="/lokasi" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
                        <MapPin size={18} /> Lokasi SINDILA
                    </Link>
                    <Link href="/kamera" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
                        <Video size={18} /> Kamera SINDILA
                    </Link>
                    <Link href="/klasifikasi" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
                        <Truck size={18} /> Klasifikasi Kendaraan
                    </Link>

                    <div className="my-1 border-t border-gray-100"></div>

                    {/* Group: Manajemen User */}
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Manajemen User
                    </div>
                    <Link href="/manajemen-user" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
                        <Users size={18} /> Manajemen Data User
                    </Link>

                    <div className="my-1 border-t border-gray-100"></div>

                    {/* Logout */}
                    <Link href="/login" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={18} /> Logout
                    </Link>
                </div>
             )}
           </div>
        ) : (
           // MODE MONITORING: Nama + Logout Icon Biasa
           <div className="flex items-center gap-4">
             <span className="font-bold text-base text-black hidden md:block">
                 Andreas Calvin
             </span>
             <Link href="/login" className="hover:bg-gray-100 p-1.5 rounded-lg transition-colors group" title="Logout">
                 <LogOut size={24} strokeWidth={2.5} className="text-black group-hover:text-red-600 transition-colors" />
             </Link>
           </div>
        )}
      </div>

    </header>
  );
}