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

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const initialForm = {
        // Step 1
        nama_lokasi: '',
        alamat_lokasi: '',
        tipe_lokasi: 'perkotaan',
        latitude: '',
        longitude: '',
        zona_waktu: '',
        keterangan: '',

        // Step 2
        tipe_arah: '22ud',
        lebar_jalur: '5',
        persentase: '50-50',
        tipe_hambatan: 'bahu_jalan',
        kelas_hambatan: 'VL',
        ukuran_kota: '',
        interval: '15',

        // Step 3
        publik: 'false',
        hide_lokasi: 'false',
    };

    const [form, setForm] = useState(initialForm);

    const inputClass = "w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#24345A]/30";

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
                setLocations(jsonData.data || []);
            } catch (error) {
                console.error("Error fetching locations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, [router]);

    function openModal() {
        setForm(initialForm);
        setEditingId(null);
        setIsModalOpen(true);
        setStep(1);
    }

    function closeModal() {
        setIsModalOpen(false);
    }

    function validateStep1() {
        const required = ['nama_lokasi', 'alamat_lokasi', 'tipe_lokasi', 'latitude', 'longitude'];
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
        if (form.zona_waktu && isNaN(Number(form.zona_waktu))) {
            newErr.zona_waktu = 'Harus berupa angka';
        }
        setErrors(newErr);
        return Object.keys(newErr).length === 0;
    }

    function validateStep2() {
        const required = ['tipe_arah', 'lebar_jalur', 'persentase', 'tipe_hambatan', 'kelas_hambatan', 'interval'];
        const newErr: Record<string, string> = {};
        required.forEach((k) => {
            if (!form[k as keyof typeof form] || String(form[k as keyof typeof form]).trim() === '') {
                newErr[k] = 'Wajib Diisi';
            }
        });
        if (form.ukuran_kota && isNaN(Number(form.ukuran_kota))) {
            newErr.ukuran_kota = 'Harus berupa angka';
        }
        setErrors(newErr);
        return Object.keys(newErr).length === 0;
    }

    function validateStep3() {
        // No strict validation needed for booleans/selects that have default values
        return true;
    }

    function nextStep() {
        if (step === 1) {
            if (!validateStep1()) return;
        } else if (step === 2) {
            if (!validateStep2()) return;
        } else if (step === 3) {
            if (!validateStep3()) return;
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

    async function handleEdit(id: string) {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`/api/locations/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch location details');
            const jsonData = await res.json();
            const data = jsonData.data;

            setForm({
                nama_lokasi: data.nama_lokasi,
                alamat_lokasi: data.alamat_lokasi,
                tipe_lokasi: data.tipe_lokasi,
                latitude: String(data.latitude),
                longitude: String(data.longitude),
                zona_waktu: String(data.zona_waktu),
                keterangan: data.keterangan,
                tipe_arah: data.tipe_arah,
                lebar_jalur: String(data.lebar_jalur),
                persentase: data.persentase,
                tipe_hambatan: data.tipe_hambatan,
                kelas_hambatan: data.kelas_hambatan,
                ukuran_kota: String(data.ukuran_kota),
                interval: String(data.interval),
                publik: String(data.publik),
                hide_lokasi: String(data.hide_lokasi),
            });
            setEditingId(id);
            setIsModalOpen(true);
            setStep(1);
        } catch (error) {
            console.error("Error fetching location details:", error);
            alert("Gagal mengambil data lokasi");
        }
    }

    async function handleSave() {
        if (!validateStep1() || !validateStep2()) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const payload = {
            nama_lokasi: form.nama_lokasi,
            alamat_lokasi: form.alamat_lokasi,
            tipe_lokasi: form.tipe_lokasi,
            tipe_arah: form.tipe_arah,
            lebar_jalur: parseInt(form.lebar_jalur),
            persentase: form.persentase,
            tipe_hambatan: form.tipe_hambatan,
            kelas_hambatan: form.kelas_hambatan,
            ukuran_kota: parseFloat(form.ukuran_kota) || 0,
            latitude: parseFloat(form.latitude),
            longitude: parseFloat(form.longitude),
            zona_waktu: parseFloat(form.zona_waktu) || 7, // Default UTC+7
            interval: parseInt(form.interval),
            publik: form.publik === 'true',
            hide_lokasi: form.hide_lokasi === 'true',
            keterangan: form.keterangan
        };

        const url = editingId ? `/api/locations/${editingId}` : '/api/locations';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Gagal menyimpan lokasi');
            }

            alert(`Lokasi berhasil ${editingId ? 'diupdate' : 'disimpan'}`);
            closeModal();
            // Refresh data
            window.location.reload(); 
        } catch (error: any) {
            alert(error.message);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Apakah Anda yakin ingin menghapus lokasi ini?')) return;

        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`/api/locations/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Gagal menghapus lokasi');
            }

            alert('Lokasi berhasil dihapus');
            window.location.reload();
        } catch (error: any) {
            alert(error.message);
        }
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

                <div className="bg-white rounded-lg overflow-hidden text-gray-800 shadow">
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
                                                        <button onClick={() => handleDelete(r.id)} className="text-sm text-red-600 hover:underline font-semibold">
                                                            Delete
                                                        </button>
                                                        <button onClick={() => handleEdit(r.id)} className="text-sm text-orange-600 hover:underline">
                                                            Edit
                                                        </button>
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

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/60" />
                        <div className="bg-gray-200 w-[760px] rounded-xl p-8 text-black relative">
                            <button 
                                onClick={closeModal} 
                                className="absolute top-4 right-4 bg-[#24345A] text-white w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#1e2b4a] transition-colors font-bold shadow-md text-xl" 
                                title="Tutup"
                            >
                                ×
                            </button>
                            <div className="mb-4">
                                <h2 className="text-2xl font-semibold">{editingId ? 'EDIT DATA LOKASI' : 'TAMBAH DATA LOKASI'}</h2>
                                <div className="flex items-center gap-6 text-sm text-gray-500 mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center justify-center w-7 h-7 rounded-full ${step===1? 'bg-[#24345A] text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>1</div>
                                        <span className={`text-xs ${step===1 ? 'font-bold text-[#24345A]' : ''}`}>Identitas Lokasi</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center justify-center w-7 h-7 rounded-full ${step===2? 'bg-[#24345A] text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>2</div>
                                        <span className={`text-xs ${step===2 ? 'font-bold text-[#24345A]' : ''}`}>Karakteristik Jalan</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center justify-center w-7 h-7 rounded-full ${step===3? 'bg-[#24345A] text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>3</div>
                                        <span className={`text-xs ${step===3 ? 'font-bold text-[#24345A]' : ''}`}>Publikasi</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                {step === 1 && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label>Nama Lokasi</label>
                                            <input name="nama_lokasi" value={form.nama_lokasi} onChange={handleChange} placeholder="Masukkan nama lokasi" className={inputClass} />
                                            {errors.nama_lokasi && <div className="text-red-600 text-sm mt-1">{errors.nama_lokasi}</div>}
                                        </div>
                                        <div>
											<label>Alamat Lokasi</label>
											<input name="alamat_lokasi" value={form.alamat_lokasi} onChange={handleChange} placeholder="Masukkan alamat lokasi" className={inputClass} />
											{errors.alamat_lokasi && <div className="text-red-600 text-sm mt-1">{errors.alamat_lokasi}</div>}
										</div>
										<div>
											<label>Tipe Lokasi</label>
                                            <select name="tipe_lokasi" value={form.tipe_lokasi} onChange={handleChange} className={inputClass}>
                                                <option value="perkotaan">Perkotaan</option>
                                                <option value="luar_kota">Luar Kota</option>
                                                <option value="bebas_hambatan">Bebas Hambatan</option>
                                                <option value="12_kelas">12 Kelas</option>
                                            </select>
											{errors.tipe_lokasi && <div className="text-red-600 text-sm mt-1">{errors.tipe_lokasi}</div>}
										</div>
										<div>
											<label>Latitude</label>
											<input name="latitude" value={form.latitude} onChange={handleChange} placeholder="Contoh: -6.1234" className={inputClass} />
											{errors.latitude && <div className="text-red-600 text-sm mt-1">{errors.latitude}</div>}
										</div>
										<div>
											<label>Longitude</label>
											<input name="longitude" value={form.longitude} onChange={handleChange} placeholder="Contoh: 107.1234" className={inputClass} />
											{errors.longitude && <div className="text-red-600 text-sm mt-1">{errors.longitude}</div>}
										</div>
										<div>
											<label>Zona Waktu (UTC)</label>
											<input name="zona_waktu" value={form.zona_waktu} onChange={handleChange} placeholder="Contoh: 7" className={inputClass} />
                                            {errors.zona_waktu && <div className="text-red-600 text-sm mt-1">{errors.zona_waktu}</div>}
										</div>
										<div className="col-span-2">
											<label>Keterangan</label>
											<textarea name="keterangan" value={form.keterangan} onChange={handleChange} placeholder="Masukkan keterangan tambahan" className={inputClass} />
										</div>
									</div>
								)}

								{step === 2 && (
									<div className="grid grid-cols-2 gap-6">
										<div>
											<label>Tipe Arah</label>
                                            <select name="tipe_arah" value={form.tipe_arah} onChange={handleChange} className={inputClass}>
                                                <option value="22ud">2/2 UD</option>
                                                <option value="42d">4/2 D</option>
                                                <option value="42ud">4/2 UD</option>
                                                <option value="62d">6/2 D</option>
                                            </select>
										</div>
										<div>
											<label>Lebar Jalur (meter)</label>
                                            <select name="lebar_jalur" value={form.lebar_jalur} onChange={handleChange} className={inputClass}>
                                                {[5, 6, 7, 8, 9, 10, 11].map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
										</div>
                                        <div>
											<label>Persentase</label>
                                            <select name="persentase" value={form.persentase} onChange={handleChange} className={inputClass}>
                                                {["50-50", "55-45", "60-40", "65-35", "70-30"].map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
										</div>
                                        <div>
											<label>Tipe Hambatan</label>
                                            <select name="tipe_hambatan" value={form.tipe_hambatan} onChange={handleChange} className={inputClass}>
                                                <option value="bahu_jalan">Bahu Jalan</option>
                                                <option value="kereb">Kereb</option>
                                            </select>
										</div>
										<div>
											<label>Kelas Hambatan</label>
                                            <select name="kelas_hambatan" value={form.kelas_hambatan} onChange={handleChange} className={inputClass}>
                                                <option value="VL">Very Low (VL)</option>
                                                <option value="L">Low (L)</option>
                                                <option value="M">Medium (M)</option>
                                                <option value="H">High (H)</option>
                                                <option value="VH">Very High (VH)</option>
                                            </select>
										</div>
										<div>
											<label>Ukuran Kota (Juta Penduduk)</label>
											<input name="ukuran_kota" value={form.ukuran_kota} onChange={handleChange} placeholder="Contoh: 1.5" className={inputClass} />
                                            {errors.ukuran_kota && <div className="text-red-600 text-sm mt-1">{errors.ukuran_kota}</div>}
										</div>
                                        <div>
											<label>Interval (Menit)</label>
                                            <select name="interval" value={form.interval} onChange={handleChange} className={inputClass}>
                                                {[1, 3, 5, 10, 15, 20, 30, 60].map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
										</div>
									</div>
								)}

								{step === 3 && (
									<div className="grid grid-cols-2 gap-6">
										<div>
											<label>Visibilitas Publik</label>
											<select name="publik" value={form.publik} onChange={handleChange} className={inputClass}>
												<option value="false">Private</option>
												<option value="true">Public</option>
											</select>
										</div>
                                        <div>
											<label>Sembunyikan Lokasi</label>
											<select name="hide_lokasi" value={form.hide_lokasi} onChange={handleChange} className={inputClass}>
												<option value="false">Tampilkan</option>
												<option value="true">Sembunyikan</option>
											</select>
										</div>
									</div>
								)}
							</div>                            <div className="mt-8 flex justify-between items-center">
                                <div>
                                    {step > 1 && (
                                        <button 
                                            onClick={prevStep} 
                                            className="bg-[#24345A] hover:bg-[#1e2b4a] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                                        >
                                            Sebelumnya
                                        </button>
                                    )}
                                </div>
                                <div>
                                    {step < 3 ? (
                                        <button 
                                            onClick={nextStep} 
                                            className="bg-[#24345A] hover:bg-[#1e2b4a] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                                        >
                                            Selanjutnya
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleSave} 
                                            className="bg-[#24345A] hover:bg-[#1e2b4a] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                                        >
                                            Simpan
                                        </button>
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