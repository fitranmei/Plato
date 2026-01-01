"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useModalContext } from '../components/ModalContext';


const SAMPLE_ROWS = [
	{ id: 1, name: 'TFC - Samoja', address: 'Jl. Raya Cirebon - Bandung', latitude: -6.863448, longitude: 107.897248 },
	{ id: 2, name: 'TFC - Padasuka', address: 'Jl. Raya Padasuka', latitude: -6.862000, longitude: 107.900000 },
];

export default function LokasiPage() {
	const inputClass =
		"w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#24345A]/30";

	const [rows, setRows] = useState(SAMPLE_ROWS);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [step, setStep] = useState(1);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [form, setForm] = useState({
		name: '',
		address: '',
		type: '',
		latitude: '',
		longitude: '',
		utc: '',
		note: '',

		// step 2
		roadType: '',
		vehicleClass: '',
		laneCount: '',
		speedLimit: '',
		interval: '',
		percent: '',

		// step 3
		visibility: 'private',
	});

	const { showNotification } = useModalContext();

	function openModal() {
		setIsModalOpen(true);
		setStep(1);
	}

	function closeModal() {
		setIsModalOpen(false);
	}

	function validateStep1() {
		const required = ['name', 'address', 'type', 'latitude', 'longitude'];
		const newErr: Record<string, string> = {};
		required.forEach((k) => {
			if (!form[k as keyof typeof form] || String(form[k as keyof typeof form]).trim() === '') {
				newErr[k] = 'Wajib Diisi';
			}
		});
		if (form.latitude && isNaN(Number(form.latitude))) {
			newErr.latitude = 'Harus berupa angka';
		}
		if (form.longitude && isNaN(Number(form.longitude))) {
			newErr.longitude = 'Harus berupa angka';
		}
		setErrors(newErr);
		return Object.keys(newErr).length === 0;
	}

	function validateStep2() {
		const required = ['roadType', 'vehicleClass', 'laneCount', 'speedLimit'];
		const newErr: Record<string, string> = {};
		required.forEach((k) => {
			if (!form[k as keyof typeof form] || String(form[k as keyof typeof form]).trim() === '') {
				newErr[k] = 'Wajib Diisi';
			}
		});
		if (form.laneCount && isNaN(Number(form.laneCount))) {
			newErr.laneCount = 'Harus berupa angka';
		}
		if (form.speedLimit && isNaN(Number(form.speedLimit))) {
			newErr.speedLimit = 'Harus berupa angka';
		}
		setErrors(newErr);
		return Object.keys(newErr).length === 0;
	}

	function validateStep3() {
		const required = ['visibility'];
		const newErr: Record<string, string> = {};
		required.forEach((k) => {
			if (!form[k as keyof typeof form] || String(form[k as keyof typeof form]).trim() === '') {
				newErr[k] = 'Wajib Diisi';
			}
		});
		setErrors(newErr);
		return Object.keys(newErr).length === 0;
	}

	function nextStep() {
		if (step === 1) {
			if (!validateStep1()) return; // don't advance
		} else if (step === 2) {
			if (!validateStep2()) return; // don't advance
		} else if (step === 3) {
			if (!validateStep3()) return; // don't advance
		}
		setStep((s) => Math.min(3, s + 1));
	}

	function prevStep() {
		setStep((s) => Math.max(1, s - 1));
	}

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
		const { name, value } = e.target;
		setForm((f) => ({ ...f, [name]: value }));
		setErrors((prev) => {
			if (!prev[name]) return prev;
			const next = { ...prev } as Record<string, string>;
			delete next[name];
			return next;
		});
	}

	function handleSave() {
		if (!validateStep1()) {
			setStep(1);
			return;
		}

		// Add the new location to the table
		const newRow = {
			id: rows.length + 1,
			name: form.name,
			address: form.address,
			latitude: Number(form.latitude),
			longitude: Number(form.longitude),
		};
		setRows((prevRows) => [...prevRows, newRow]);

		showNotification('Lokasi berhasil disimpan');
		closeModal();
	}

	return (
		<main className="min-h-screen bg-[#24345A] text-white font-sans">
			<div className="p-8 max-w-6xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold">DATA LOKASI</h1>
					<div className="flex items-center gap-4">
						<button onClick={openModal} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg shadow">
							+ Tambah Data Lokasi
						</button>
					</div>
				</div>

				<div className="bg-white rounded-lg overflow-hidden shadow">
					<div className="p-4">
						<table className="min-w-full text-sm text-left text-gray-700 border-separate" style={{ borderSpacing: '0 8px' }}>
							<thead>
								<tr className="text-gray-500 text-xs uppercase">
									<th className="px-4 py-3 text-left">No</th>
									<th className="px-4 py-3 text-left">Nama Lokasi</th>
									<th className="px-4 py-3 text-left">Alamat</th>
									<th className="px-4 py-3 text-left">Latitude</th>
									<th className="px-4 py-3 text-left">Longitude</th>
									<th className="px-4 py-3 text-left">Keterangan</th>
									<th className="px-4 py-3 text-left">Aksi</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((r) => (
									<tr key={r.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
										<td className="px-4 py-3 align-top w-12">{r.id}</td>
										<td className="px-4 py-3 align-top">{r.name}</td>
										<td className="px-4 py-3 align-top">{r.address}</td>
										<td className="px-4 py-3 align-top">{r.latitude}</td>
										<td className="px-4 py-3 align-top">{r.longitude}</td>
										<td className="px-4 py-3 align-top">-</td>
										<td className="px-4 py-3 align-top">
											<div className="flex gap-2">
												<Link href={`/lokasi/${r.id}`} className="text-sm text-blue-600 hover:underline">Lihat</Link>
												<Link href={`/lokasi/${r.id}/edit`} className="text-sm text-orange-600 hover:underline">Edit</Link>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className="mt-4 text-gray-200">Showing 1 to {rows.length} of {rows.length} entries</div>
				<div className="mt-4 flex justify-end gap-2">
					<button className="px-3 py-1 rounded bg-white text-gray-800">Previous</button>
					<div className="px-3 py-1 rounded bg-orange-500">1</div>
					<button className="px-3 py-1 rounded bg-white text-gray-800">Next</button>
				</div>

				{isModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center">
						<div className="absolute inset-0 bg-black/60" />
						<div className="bg-gray-200 w-[760px] rounded-xl p-8 text-black relative">
							<button onClick={closeModal} className="absolute top-4 right-4" title="Tutup">×</button>
							<div className="mb-4">
								<h2 className="text-lg font-semibold">TAMBAH DATA LOKASI</h2>
								<div className="flex items-center gap-6 text-sm text-gray-500 mt-2">
									<div className="flex items-center gap-2">
										<div className={`flex items-center justify-center w-7 h-7 rounded-full ${step===1? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>1</div>
										<span className={`text-xs ${step===1 ? 'font-bold text-blue-600' : ''}`}>Identitas Lokasi</span>
									</div>
									<div className="flex items-center gap-2">
										<div className={`flex items-center justify-center w-7 h-7 rounded-full ${step===2? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>2</div>
										<span className={`text-xs ${step===2 ? 'font-bold text-blue-600' : ''}`}>Karakteristik Jalan</span>
									</div>
									<div className="flex items-center gap-2">
										<div className={`flex items-center justify-center w-7 h-7 rounded-full ${step===3? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>3</div>
										<span className={`text-xs ${step===3 ? 'font-bold text-blue-600' : ''}`}>Publikasi</span>
									</div>
								</div>
							</div>

							<div>
								{step === 1 && (
									<div className="grid grid-cols-2 gap-6">
										<div>
											<label>Nama Lokasi</label>
											<input name="name" value={form.name} onChange={handleChange} placeholder="Masukkan nama lokasi" className={inputClass} />
											{errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
										</div>
										<div>
											<label>Alamat Lokasi</label>
											<input name="address" value={form.address} onChange={handleChange} placeholder="Masukkan alamat lokasi" className={inputClass} />
											{errors.address && <div className="text-red-600 text-sm mt-1">{errors.address}</div>}
										</div>
										<div>
											<label>Tipe Lokasi</label>
											<input name="type" value={form.type} onChange={handleChange} placeholder="Masukkan tipe lokasi" className={inputClass} />
											{errors.type && <div className="text-red-600 text-sm mt-1">{errors.type}</div>}
										</div>
										<div>
											<label>Latitude</label>
											<input name="latitude" value={form.latitude} onChange={handleChange} placeholder="Masukkan latitude" className={inputClass} />
											{errors.latitude && <div className="text-red-600 text-sm mt-1">{errors.latitude}</div>}
										</div>
										<div>
											<label>Longitude</label>
											<input name="longitude" value={form.longitude} onChange={handleChange} placeholder="Masukkan longitude" className={inputClass} />
											{errors.longitude && <div className="text-red-600 text-sm mt-1">{errors.longitude}</div>}
										</div>
										<div>
											<label>UTC</label>
											<input name="utc" value={form.utc} onChange={handleChange} placeholder="Masukkan zona waktu UTC" className={inputClass} />
										</div>
										<div className="col-span-2">
											<label>Keterangan</label>
											<textarea name="note" value={form.note} onChange={handleChange} placeholder="Masukkan keterangan" className={inputClass} />
										</div>
									</div>
								)}

								{step === 2 && (
									<div className="grid grid-cols-2 gap-6">
										<div>
											<label>Tipe Jalan</label>
											<input name="roadType" value={form.roadType} onChange={handleChange} placeholder="Masukkan tipe jalan" className={`${inputClass} ${errors.roadType ? 'border-red-600' : ''}`} />
											{errors.roadType && <div className="text-red-600 text-sm mt-1">{errors.roadType}</div>}
										</div>
										<div>
											<label>Klasifikasi Kendaraan</label>
											<input name="vehicleClass" value={form.vehicleClass} onChange={handleChange} placeholder="Masukkan klasifikasi kendaraan" className={`${inputClass} ${errors.vehicleClass ? 'border-red-600' : ''}`} />
											{errors.vehicleClass && <div className="text-red-600 text-sm mt-1">{errors.vehicleClass}</div>}
										</div>
										<div>
											<label>Jumlah Jalur</label>
											<input type="number" name="laneCount" value={form.laneCount} onChange={handleChange} placeholder="Masukkan jumlah jalur" className={`${inputClass} ${errors.laneCount ? 'border-red-600' : ''}`} />
											{errors.laneCount && <div className="text-red-600 text-sm mt-1">{errors.laneCount}</div>}
										</div>
										<div>
											<label>Batas Kecepatan</label>
											<input type="number" name="speedLimit" value={form.speedLimit} onChange={handleChange} placeholder="Masukkan batas kecepatan" className={`${inputClass} ${errors.speedLimit ? 'border-red-600' : ''}`} />
											{errors.speedLimit && <div className="text-red-600 text-sm mt-1">{errors.speedLimit}</div>}
										</div>
									</div>
								)}

								{step === 3 && (
									<div className="grid grid-cols-2 gap-6">
										<div>
											<label>Visibilitas</label>
											<select name="visibility" value={form.visibility} onChange={handleChange} className={`${inputClass} ${errors.visibility ? 'border-red-600' : ''}`}>
												<option value="private">Private</option>
												<option value="public">Public</option>
											</select>
											{errors.visibility && <div className="text-red-600 text-sm mt-1">{errors.visibility}</div>}
										</div>
										<div className="col-span-2">
											<label>Catatan Publikasi</label>
											<textarea name="note" value={form.note} onChange={handleChange} placeholder="Masukkan catatan publikasi" className={inputClass} />
										</div>
									</div>
								)}
							</div>

							<div className="mt-6 flex justify-between">
								<div>
									{step > 1 && (
										<button onClick={prevStep} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Sebelumnya</button>
									)}
								</div>
								<div className="flex gap-2">
									{step < 3 && (
										<button onClick={nextStep} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Selanjutnya</button>
									)}
									{step === 3 && (
										<>
											<button onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Batal</button>
											<button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">SIMPAN</button>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
