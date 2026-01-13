"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { useModalContext } from '../components/ModalContext';

interface Location {
    id: string;
    nama_lokasi: string;
    alamat_lokasi: string;
    latitude: number;
    longitude: number;
    balai: string;
    keterangan: string;
}

export default function LokasiPage() {
    const { showNotification, setIsModalOpen: setGlobalModalOpen } = useModalContext();
    const [locations, setLocations] = useState<Location[]>([]);
    const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'superadmin') {
            router.push('/home');
        }
    }, [router]);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    useEffect(() => {
        setGlobalModalOpen(isModalOpen);
    }, [isModalOpen, setGlobalModalOpen]);
    
    const provinces = [
        "BPJN-I-Banda-Aceh",
        "BBPJN-II-Medan",
        "BBPJN-III-Padang",
        "BPJN-IV-Jambi",
        "BBPJN-V-Palembang",
        "BBPJN-VI-Jakarta",
        "BBPJN-VII-Semarang",
        "BBPJN-VIII-Surabaya",
        "BBPJN-IX-Mataram",
        "BPJN-X-Kupang",
        "BBPJN-XI-Banjarmasin",
        "BBPJN-XII-Balikpapan",
        "BBPJN-XIII-Makassar",
        "BPJN-XIV-Palu",
        "BPJN-XV-Manado",
        "BPJN-XVI-Ambon",
        "BPJN-XVII-Manokwari",
        "BBPJN-XVIII-Jayapura",
        "Balai-Jembatan-Khusus-dan-Terowongan",
        "BPJN-XIX-Bandar-Lampung",
        "BPJN-XX-Pontianak",
        "BPJN-XXI-Kendari",
        "BPJN-XXII-Merauke"
    ];
    
    const initialForm = {
        // Step 1
        nama_lokasi: '',
        alamat_lokasi: '',
        balai: '',
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
        publik: 'true',
        hide_lokasi: 'false',

        // Step 4 - Source
        source_type: 'link',
        source_link: '',
    };

    const [form, setForm] = useState(initialForm);

    // Confirmation State
    const [confirmation, setConfirmation] = useState<{ message: string, onConfirm: () => void } | null>(null);

    const inputClass = "w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#24345A]/30 text-sm";

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
                setFilteredLocations(jsonData.data || []);
            } catch (error) {
                console.error("Error fetching locations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, [router]);

    useEffect(() => {
        // Filter locations based on search term
        const filtered = locations.filter((location) => 
            location.nama_lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.alamat_lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.balai.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredLocations(filtered);
    }, [searchTerm, locations]);

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
        const required = ['nama_lokasi', 'alamat_lokasi', 'balai', 'tipe_lokasi', 'latitude', 'longitude'];
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
        setStep((s) => Math.min(4, s + 1));
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
                balai: data.balai,
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
                interval: String(Math.round(data.interval / 60)), // Convert seconds to minutes
                publik: String(data.publik),
                hide_lokasi: String(data.hide_lokasi),
                source_type: 'link',
                source_link: '',
            });

            // Fetch source if exists
            try {
                const sourceRes = await fetch(`/api/locations/${id}/source`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (sourceRes.ok) {
                    const sourceData = await sourceRes.json();
                    const source = sourceData.data;
                    setForm(prev => ({
                        ...prev,
                        source_type: source.source_type || 'link',
                        source_link: source.source_type === 'link' ? source.source_data : '',
                    }));
                }
            } catch (sourceError) {
                console.log('No source found for this location');
            }

            setEditingId(id);
            setIsModalOpen(true);
            setStep(1);
        } catch (error) {
            console.error("Error fetching location details:", error);
            showNotification("Gagal mengambil data lokasi", 'error');
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
            balai: form.balai,
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
            interval: parseInt(form.interval) * 60, // Convert minutes to seconds
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

            const responseData = await res.json();
            const locationId = editingId || responseData.data?.id;

            // Save source (wajib)
            if (locationId && form.source_type) {
                try {
                    const sourcePayload: any = {
                        source_type: form.source_type
                    };
                    
                    if (form.source_type === 'link') {
                        if (!form.source_link) {
                            showNotification('URL Link harus diisi', 'error');
                            return;
                        }
                        sourcePayload.source_data = form.source_link;
                    } else if (form.source_type === 'image') {
                        // Gambar akan diambil dari model kamera, kirim placeholder
                        sourcePayload.source_data = 'camera_image';
                    }

                    const sourceMethod = editingId ? 'PUT' : 'POST';
                    const sourceRes = await fetch(`/api/locations/${locationId}/source`, {
                        method: sourceMethod,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(sourcePayload)
                    });

                    if (!sourceRes.ok) {
                        const sourceErr = await sourceRes.json();
                        console.error('Error saving source:', sourceErr);
                        showNotification('Lokasi disimpan, tapi source gagal ditambahkan', 'error');
                    }
                } catch (sourceError) {
                    console.error('Error saving source:', sourceError);
                }
            }

            showNotification(`Lokasi berhasil ${editingId ? 'diupdate' : 'disimpan'}`, 'success');
            closeModal();
            // Redirect to camera creation if new location
            if (!editingId && responseData.data?.nama_lokasi) {
                setTimeout(() => {
                    const lokasiName = responseData.data.nama_lokasi;
                    const lokasiId = responseData.data.id;
                    router.push(`/kamera?openModal=true&lokasi=${encodeURIComponent(lokasiName)}&lokasiId=${lokasiId}`);
                }, 1000);
            } else {
                // Refresh data
                setTimeout(() => window.location.reload(), 1500); 
            } 
        } catch (error: any) {
            showNotification(error.message, 'error');
        }
    }

    async function handleDelete(id: string) {
        setConfirmation({
            message: 'Apakah Anda yakin ingin menghapus lokasi ini?',
            onConfirm: async () => {
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

                    showNotification('Lokasi berhasil dihapus', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error: any) {
                    showNotification(error.message, 'error');
                }
                setConfirmation(null);
            }
        });
    }

    return (
        <main className="min-h-screen bg-[#24345A] text-white font-sans">
            <div className="p-4 sm:p-8 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                    <h1 className="text-2xl font-bold">DATA LOKASI</h1>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full sm:w-64">
                            <input 
                                type="text"
                                placeholder="Cari lokasi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 absolute right-3 top-2.5 text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.5 5.5a7.5 7.5 0 0 0 10.5 10.5Z" />
                            </svg>
                        </div>
                        <button onClick={openModal} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg shadow whitespace-nowrap">
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
                                        <th className="px-4 py-3">Balai</th>
                                        <th className="px-4 py-3">Latitude</th>
                                        <th className="px-4 py-3">Longitude</th>
                                        <th className="px-4 py-3">Keterangan</th>
                                        <th className="px-4 py-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLocations.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                                                Tidak ada data lokasi.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLocations.map((r, index) => (
                                            <tr key={r.id} className="border-t hover:bg-gray-50">
                                                <td className="px-4 py-3">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium">{r.nama_lokasi}</td>
                                                <td className="px-4 py-3">{r.alamat_lokasi}</td>
                                                <td className="px-4 py-3">{r.balai}</td>
                                                <td className="px-4 py-3">{r.latitude}</td>
                                                <td className="px-4 py-3">{r.longitude}</td>
                                                <td className="px-4 py-3">{r.keterangan || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleEdit(r.id)} 
                                                            className="p-1.5 border rounded hover:bg-gray-50 text-blue-600"
                                                            title="Edit Lokasi"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(r.id)} 
                                                            className="p-1.5 border rounded hover:bg-red-50 text-red-600"
                                                            title="Hapus Lokasi"
                                                        >
                                                            <Trash2 size={16} />
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

                {!loading && filteredLocations.length > 0 && (
                    <div className="mt-4 text-gray-200 text-sm">
                        Showing {filteredLocations.length} entries
                    </div>
                )}

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60" />
                        <div className="bg-gray-200 w-full max-w-[600px] rounded-xl p-4 sm:p-5 text-black relative max-h-[90vh] overflow-y-auto">
                            <button 
                                onClick={closeModal} 
                                className="absolute top-3 right-3 bg-[#24345A] text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#1e2b4a] transition-colors font-bold shadow-md text-lg" 
                                title="Tutup"
                            >
                                ×
                            </button>
                            <div className="mb-3">
                                <h2 className="text-xl font-semibold">{editingId ? 'EDIT DATA LOKASI' : 'TAMBAH DATA LOKASI'}</h2>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center justify-center w-6 h-6 text-xs rounded-full ${step===1? 'bg-[#24345A] text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>1</div>
                                        <span className={`text-xs ${step===1 ? 'font-bold text-[#24345A]' : ''}`}>Identitas</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center justify-center w-6 h-6 text-xs rounded-full ${step===2? 'bg-[#24345A] text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>2</div>
                                        <span className={`text-xs ${step===2 ? 'font-bold text-[#24345A]' : ''}`}>Karakteristik</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center justify-center w-6 h-6 text-xs rounded-full ${step===3? 'bg-[#24345A] text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>3</div>
                                        <span className={`text-xs ${step===3 ? 'font-bold text-[#24345A]' : ''}`}>Publikasi</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center justify-center w-6 h-6 text-xs rounded-full ${step===4? 'bg-[#24345A] text-white font-bold' : 'bg-gray-200 text-gray-600'}`}>4</div>
                                        <span className={`text-xs ${step===4 ? 'font-bold text-[#24345A]' : ''}`}>Source</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                {step === 1 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-medium">Nama Lokasi</label>
                                            <input name="nama_lokasi" value={form.nama_lokasi} onChange={handleChange} placeholder="Masukkan nama lokasi" className={inputClass} />
                                            {errors.nama_lokasi && <div className="text-red-600 text-xs mt-1">{errors.nama_lokasi}</div>}
                                        </div>
                                        <div>
											<label className="text-sm font-medium">Alamat Lokasi</label>
											<input name="alamat_lokasi" value={form.alamat_lokasi} onChange={handleChange} placeholder="Masukkan alamat lokasi" className={inputClass} />
											{errors.alamat_lokasi && <div className="text-red-600 text-xs mt-1">{errors.alamat_lokasi}</div>}
										</div>
										<div>
											<label className="text-sm font-medium">Balai</label>
                                            <select name="balai" value={form.balai} onChange={handleChange} className={inputClass}>
                                                <option value="">Pilih balai</option>
                                                {provinces.map((prov) => (
                                                    <option key={prov} value={prov}>{prov}</option>
                                                ))}
                                            </select>
											{errors.balai && <div className="text-red-600 text-xs mt-1">{errors.balai}</div>}
										</div>
										<div>
											<label className="text-sm font-medium">Tipe Lokasi</label>
                                            <select name="tipe_lokasi" value={form.tipe_lokasi} onChange={handleChange} className={inputClass}>
                                                <option value="perkotaan">Perkotaan</option>
                                                <option value="luar_kota">Luar Kota</option>
                                                <option value="bebas_hambatan">Bebas Hambatan</option>
                                                <option value="12_kelas">12 Kelas</option>
                                            </select>
											{errors.tipe_lokasi && <div className="text-red-600 text-xs mt-1">{errors.tipe_lokasi}</div>}
										</div>
										<div>
											<label className="text-sm font-medium">Latitude</label>
											<input name="latitude" value={form.latitude} onChange={handleChange} placeholder="Contoh: -6.1234" className={inputClass} />
											{errors.latitude && <div className="text-red-600 text-xs mt-1">{errors.latitude}</div>}
										</div>
										<div>
											<label className="text-sm font-medium">Longitude</label>
											<input name="longitude" value={form.longitude} onChange={handleChange} placeholder="Contoh: 107.1234" className={inputClass} />
											{errors.longitude && <div className="text-red-600 text-xs mt-1">{errors.longitude}</div>}
										</div>
										<div>
											<label className="text-sm font-medium">Zona Waktu (UTC)</label>
											<input name="zona_waktu" value={form.zona_waktu} onChange={handleChange} placeholder="Contoh: 7" className={inputClass} />
                                            {errors.zona_waktu && <div className="text-red-600 text-xs mt-1">{errors.zona_waktu}</div>}
										</div>
										<div className="col-span-2">
											<label className="text-sm font-medium">Keterangan</label>
											<textarea name="keterangan" value={form.keterangan} onChange={handleChange} placeholder="Masukkan keterangan tambahan" className={`${inputClass} h-20`} />
										</div>
									</div>
								)}

								{step === 2 && (
									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="text-sm font-medium">Tipe Arah</label>
                                            <select name="tipe_arah" value={form.tipe_arah} onChange={handleChange} className={inputClass}>
                                                <option value="22ud">2/2 UD</option>
                                                <option value="42d">4/2 D</option>
                                                <option value="42ud">4/2 UD</option>
                                                <option value="62d">6/2 D</option>
                                            </select>
										</div>
										<div>
											<label className="text-sm font-medium">Lebar Jalur (meter)</label>
                                            <select name="lebar_jalur" value={form.lebar_jalur} onChange={handleChange} className={inputClass}>
                                                {[5, 6, 7, 8, 9, 10, 11].map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
										</div>
                                        <div>
											<label className="text-sm font-medium">Persentase</label>
                                            <select name="persentase" value={form.persentase} onChange={handleChange} className={inputClass}>
                                                {["50-50", "55-45", "60-40", "65-35", "70-30"].map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
										</div>
                                        <div>
											<label className="text-sm font-medium">Tipe Hambatan</label>
                                            <select name="tipe_hambatan" value={form.tipe_hambatan} onChange={handleChange} className={inputClass}>
                                                <option value="bahu_jalan">Bahu Jalan</option>
                                                <option value="kereb">Kereb</option>
                                            </select>
										</div>
										<div>
											<label className="text-sm font-medium">Kelas Hambatan</label>
                                            <select name="kelas_hambatan" value={form.kelas_hambatan} onChange={handleChange} className={inputClass}>
                                                <option value="VL">Very Low (VL)</option>
                                                <option value="L">Low (L)</option>
                                                <option value="M">Medium (M)</option>
                                                <option value="H">High (H)</option>
                                                <option value="VH">Very High (VH)</option>
                                            </select>
										</div>
										<div>
											<label className="text-sm font-medium">Ukuran Kota (Juta Penduduk)</label>
											<input name="ukuran_kota" value={form.ukuran_kota} onChange={handleChange} placeholder="Contoh: 1.5" className={inputClass} />
                                            {errors.ukuran_kota && <div className="text-red-600 text-xs mt-1">{errors.ukuran_kota}</div>}
										</div>
                                        <div>
											<label className="text-sm font-medium">Interval (Menit)</label>
                                            <select name="interval" value={form.interval} onChange={handleChange} className={inputClass}>
                                                {[1, 3, 5, 10, 15, 20, 30, 60].map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
										</div>
									</div>
								)}

								{step === 3 && (
									<div className="grid grid-cols-1 gap-3">
                                        <div>
											<label className="text-sm font-medium">Sembunyikan Lokasi</label>
											<select name="hide_lokasi" value={form.hide_lokasi} onChange={handleChange} className={inputClass}>
												<option value="false">Tampilkan</option>
												<option value="true">Sembunyikan</option>
											</select>
										</div>
									</div>
								)}

								{step === 4 && (
									<div className="grid grid-cols-1 gap-4">
										<div>
											<label className="text-sm font-medium">Tipe Source <span className="text-red-500">*</span></label>
											<select 
												name="source_type" 
												value={form.source_type} 
												onChange={handleChange} 
												className={inputClass}
											>
												<option value="link">Link Video</option>
												<option value="image">Gambar</option>
											</select>
										</div>

										{form.source_type === 'link' && (
											<div>
												<label className="text-sm font-medium">URL Video <span className="text-red-500">*</span></label>
												<input 
													name="source_link" 
													value={form.source_link} 
													onChange={handleChange} 
													placeholder="Masukkan URL video" 
													className={inputClass}
													required
												/>
												{errors.source_link && <div className="text-red-600 text-xs mt-1">{errors.source_link}</div>}
											</div>
										)}
									</div>
								)}
							</div>                            <div className="mt-5 flex justify-between items-center">
                                <div>
                                    {step > 1 && (
                                        <button 
                                            onClick={prevStep} 
                                            className="bg-[#24345A] hover:bg-[#1e2b4a] text-white font-semibold py-2 px-4 text-sm rounded-lg transition-colors"
                                        >
                                            Sebelumnya
                                        </button>
                                    )}
                                </div>
                                <div>
                                    {step < 4 ? (
                                        <button 
                                            onClick={nextStep} 
                                            className="bg-[#24345A] hover:bg-[#1e2b4a] text-white font-semibold py-2 px-4 text-sm rounded-lg transition-colors"
                                        >
                                            Selanjutnya
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleSave} 
                                            className="bg-[#24345A] hover:bg-[#1e2b4a] text-white font-semibold py-2 px-4 text-sm rounded-lg transition-colors"
                                        >
                                            Simpan
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {confirmation && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmation(null)} />
                        <div className="bg-white w-[400px] rounded-xl p-6 text-center relative shadow-2xl transform transition-all scale-100">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-yellow-100">
                                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Konfirmasi</h3>
                            <p className="text-gray-600 mb-6">{confirmation.message}</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setConfirmation(null)}
                                    className="flex-1 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={confirmation.onConfirm}
                                    className="flex-1 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}