"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

const KLASIFIKASI = [
  {
    id: 1,
    kelas: "Kendaraan Kelas 1",
    jenis: "Motor",
    ikon: "🏍️",
    panjang: "0 m - 2.5 m",
  },
  {
    id: 2,
    kelas: "Kendaraan Kelas 2",
    jenis: "Kendaraan Ringan",
    ikon: "🚗",
    panjang: "2.5 m - 5.5 m",
  },
  {
    id: 3,
    kelas: "Kendaraan Kelas 3",
    jenis: "Kendaraan Berat",
    ikon: "🚚",
    panjang: "5.5 m - 9 m",
  },
];

export default function KendaraanPage() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'superadmin') {
        router.push('/home');
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-[#24345A] text-white font-sans">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Judul */}
        <h1 className="text-2xl font-bold mb-6">KLASIFIKASI KENDARAAN</h1>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden text-gray-800 max-w-3xl">
          {/* Header Oranye */}
          <div className="flex items-center justify-between bg-orange-500 px-6 py-3">
            <span className="font-semibold text-white">
              Klasifikasi Kendaraan Pada Jalan Perkotaan
            </span>
            <button className="bg-white text-orange-500 px-3 py-1 rounded-md text-sm font-medium hover:bg-orange-100 flex items-center gap-1">
              ✏️ Ubah
            </button>
          </div>

          {/* Isi */}
          <div className="divide-y">
            {KLASIFIKASI.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <span className="font-medium">{item.kelas}</span>

                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
                  <span>{item.jenis}</span>
                  <span>{item.ikon}</span>
                </div>

                <span className="text-sm">{item.panjang}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
