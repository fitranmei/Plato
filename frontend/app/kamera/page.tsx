"use client";
import React from 'react';
import Link from 'next/link';

const SAMPLE_ROWS = [
	{ id: 1, name: 'TFC - Samoja', address: 'Jl. Raya Cirebon - Bandung', keterangan: 'Available' , daftarkamera: 'Kamera A' },
	{ id: 2, name: 'TFC - Padasuka', address: 'Jl. Raya Padasuka' , keterangan: 'Available' , daftarkamera: 'Kamera B'},
];

export default function LokasiPage() {
	return (
		<main className="min-h-screen bg-[#24345A] text-white font-sans">
			<div className="p-8 max-w-6xl mx-auto">
					<div className="flex items-center justify-between mb-6">
						<h1 className="text-2xl font-bold">DATA KAMERA</h1>
						<div className="flex items-center gap-4">
							<Link href="/lokasi/tambah" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg shadow">
								+ Tambah Data Kamera
							</Link>
						</div>
					</div>

				<div className="bg-white rounded-lg overflow-hidden">
					<table className="min-w-full text-sm text-left text-gray-700">
						<thead className="bg-gray-100">
							<tr>
								<th className="px-4 py-3">No</th>
								<th className="px-4 py-3">Nama Lokasi</th>
								<th className="px-4 py-3">Alamat</th>
								<th className="px-4 py-3">Keterangan</th>
								<th className="px-4 py-3">Daftar Kamera</th>
							</tr>
						</thead>
						<tbody>
							{SAMPLE_ROWS.map((r) => (
								<tr key={r.id} className="border-t">
									<td className="px-4 py-3">{r.id}</td>
									<td className="px-4 py-3">{r.name}</td>
									<td className="px-4 py-3">{r.address}</td>
                                    <td className="px-4 py-3">{r.keterangan}</td>
                                    <td className="px-4 py-3">{r.daftarkamera}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="mt-4 text-gray-200">Showing 1 to {SAMPLE_ROWS.length} of {SAMPLE_ROWS.length} entries</div>
				<div className="mt-4 flex justify-end gap-2">
					<button className="px-3 py-1 rounded bg-white text-gray-800">Previous</button>
					<div className="px-3 py-1 rounded bg-orange-500">1</div>
					<button className="px-3 py-1 rounded bg-white text-gray-800">Next</button>
				</div>
			</div>
		</main>
	);
}
