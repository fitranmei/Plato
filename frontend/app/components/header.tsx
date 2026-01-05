"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; 
import { usePathname, useRouter, useParams } from "next/navigation";
import { Search, LogOut, ArrowLeft, Menu, MapPin, Video, Truck, Users } from "lucide-react";

export default function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  
  // State dropdown khusus Home
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 1. Cek Mode Halaman
  const isHome = pathname === "/home" || pathname === "/";
  const isAdminPage = 
    pathname?.startsWith('/lokasi') || 
    pathname?.startsWith('/kamera') || 
    pathname?.startsWith('/klasifikasi') || 
    pathname?.startsWith('/manajemen-user');

  const [monitoringTitle, setMonitoringTitle] = useState("TFC - LOADING...");

  useEffect(() => {
    if (pathname?.startsWith("/monitoring/")) {
      setMonitoringTitle("Loading...");
      let id = Array.isArray(params?.id) ? params.id[0] : params?.id;
      
      // Fallback: parse pathname if useParams doesn't capture the ID (e.g. if Header is outside the route segment)
      if (!id) {
        const parts = pathname.split("/");
        id = parts[parts.length - 1];
      }

      if (id) {
        const fetchLocationName = async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/locations/${id}`, {
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });
            if (res.ok) {
              const jsonData = await res.json();
              // Adjust based on API response structure. 
              // Based on page.tsx: setLocation(jsonData.data); -> location.nama_lokasi
              if (jsonData.data && jsonData.data.nama_lokasi) {
                  setMonitoringTitle(jsonData.data.nama_lokasi);
              }
            }
          } catch (e) {
            console.error("Failed to fetch location name for header", e);
          }
        };
        fetchLocationName();
      }
    }
  }, [pathname, params]);

  // Logic Judul Halaman Detail
  let title = "Dashboard";
  if (pathname?.startsWith("/monitoring")) title = monitoringTitle;

  const [username, setUsername] = useState("User");
  const [role, setRole] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      router.push("/login");
    }
  };

  // Klik luar tutup dropdown home
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
           // MODE 1: HOME (Logo)
           <div className="relative h-9 w-9">
             <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
           </div>
        ) : isAdminPage ? (
           // MODE 2: ADMIN PAGE (Hamburger Sidebar + Judul "Admin Monitoring")
           <div className="flex items-center gap-4">
             {/* Tombol Hamburger pembuka Sidebar */}
             <button 
               onClick={onToggleSidebar} 
               className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
             >
                <Menu size={28} strokeWidth={2.5} />
             </button>
          
           </div>
        ) : (
           // MODE 3: DETAIL MONITORING (Back + Judul Lokasi)
           <div className="flex items-center gap-3">
             <button 
               onClick={() => router.back()} 
               className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
             >
                 <ArrowLeft size={24} strokeWidth={2.5} />
             </button>
             <h1 className="text-xl font-bold text-black tracking-tight uppercase">
                 {title}
             </h1>
           </div>
        )}
      </div>


      {/* --- BAGIAN KANAN --- */}
      <div className="flex items-center gap-4">
        {isHome || pathname?.startsWith("/monitoring/") ? (
           // KANAN HOME & MONITORING: Nama + Dropdown Menu
           <div className="flex items-center gap-3 relative" ref={menuRef}>
             <span className="font-bold text-base text-black hidden md:block">{username}</span>
             <button 
               onClick={() => setIsOpen(!isOpen)}  
               className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
             >
                <Menu size={28} strokeWidth={2.5} />
             </button>
             
             {/* Dropdown Menu Home */}
             {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-2">
                    {(role === 'superadmin') && (
                      <>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Manajemen Data</div>
                        <Link href="/lokasi" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"><MapPin size={18}/> Lokasi SINDILA</Link>
                        <Link href="/kamera" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"><Video size={18}/> Kamera SINDILA</Link>
                        <Link href="/kendaraan" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"><Truck size={18}/> Klasifikasi Kendaraan</Link>
                        <div className="my-1 border-t border-gray-100"></div>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Manajemen User</div>
                        <Link href="/manajemen-user" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"><Users size={18}/> Manajemen User</Link>
                        <div className="my-1 border-t border-gray-100"></div>
                      </>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 text-left"><LogOut size={18}/> Logout</button>
                </div>
             )}
           </div>
        ) : (
           // KANAN ADMIN & MONITORING: Nama + Icon Logout
           <div className="flex items-center gap-4">
             <span className="font-bold text-base text-black hidden md:block">{username}</span>
             <button onClick={handleLogout} className="hover:bg-gray-100 p-1.5 rounded-lg transition-colors group" title="Logout">
                 <LogOut size={24} strokeWidth={2.5} className="text-black group-hover:text-red-600 transition-colors" />
             </button>
           </div>
        )}
      </div>

    </header>
  );
}