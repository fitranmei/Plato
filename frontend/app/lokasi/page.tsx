"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Location {
    id: string;
    nama_lokasi: string;
    alamat_lokasi: string;
    latitude: number;
    longitude: number;
    keterangan: string;
}

export default function LokasiPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchLocations = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const res = await fetch('/api/locations', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!res.ok) throw new Error('Failed to fetch data');
                const jsonData = await res.json();
                // Assuming the API returns { data: [...] }
                setLocations(jsonData.data || []);
            } catch (error) {
                console.error("Error fetching locations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, [router]);

    return (
        <main className="min-h-screen bg-[#24345A] text-white font-sans">
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">DATA LOKASI</h1>
                    <div className="flex items-center gap-4">
                        <Link href="/lokasi/tambah" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg shadow">
                            + Tambah Data Lokasi
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-lg overflow-hidden text-gray-800">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading data...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-700">
                                    <tr>
                                        <th className="px-4 py-3">No</th>
                                        <th className="px-4 py-3">Nama Lokasi</th>
                                        <th className="px-4 py-3">Alamat</th>
                                        <th className="px-4 py-3">Latitude</th>
                                        <th className="px-4 py-3">Longitude</th>
                                        <th className="px-4 py-3">Keterangan</th>
                                        <th className="px-4 py-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {locations.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                                                Tidak ada data lokasi.
                                            </td>
                                        </tr>
                                    ) : (
                                        locations.map((r, index) => (
                                            <tr key={r.id} className="border-t hover:bg-gray-50">
                                                <td className="px-4 py-3">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium">{r.nama_lokasi}</td>
                                                <td className="px-4 py-3">{r.alamat_lokasi}</td>
                                                <td className="px-4 py-3">{r.latitude}</td>
                                                <td className="px-4 py-3">{r.longitude}</td>
                                                <td className="px-4 py-3">{r.keterangan || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <Link href={`/monitoring/${r.id}`} className="text-sm text-blue-600 hover:underline font-semibold">
                                                            Monitoring
                                                        </Link>
                                                        <Link href={`/lokasi/${r.id}/edit`} className="text-sm text-orange-600 hover:underline">
                                                            Edit
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!loading && locations.length > 0 && (
                    <div className="mt-4 text-gray-200 text-sm">
                        Showing {locations.length} entries
                    </div>
                )}
            </div>
        </main>
    );
}
