"use client";

import React, { useState, useEffect, Suspense } from "react";
import { X, Video, Pencil, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useModalContext } from "../components/ModalContext";

type Kamera = {
  id: string;
  tipe_kamera: string;
  zona_arah: { id_zona_arah: string; arah: string }[];
  lokasi_penempatan: string;
  lokasi_id: string;
  api_key?: string;
};

type Location = {
  id: string;
  nama_lokasi: string;
  alamat_lokasi: string;
  keterangan: string;
};

function KameraPageContent() {
  const { setIsModalOpen, showNotification } = useModalContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openParam = searchParams.get('openModal');
  const lokasiParam = searchParams.get('lokasi');
  const lokasiIdParam = searchParams.get('lokasiId');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'superadmin') {
        router.push('/home');
    }
  }, [router]);
  
  // ================= STATE =================
  const [locations, setLocations] = useState<Location[]>([]);
  const [kameras, setKameras] = useState<Kamera[]>([]); // For the modal list
  const [showModal, setShowModal] = useState(false); // Add Camera Modal
  const [showListModal, setShowListModal] = useState(false); // List Camera Modal
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Record<string, boolean>>({});
  const [confirmation, setConfirmation] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const [form, setForm] = useState({
    tipe: "",
    arah1: "",
    arah2: "",
    lokasi: "",
    lokasi_id: "",
  });

  useEffect(() => {
    if (openParam === 'true') {
      setShowModal(true);
      if (lokasiParam) {
        setForm(prev => ({ ...prev, lokasi: lokasiParam }));
      }
      if (lokasiIdParam) {
        setForm(prev => ({ ...prev, lokasi_id: lokasiIdParam }));
      }
    }
  }, [openParam, lokasiParam, lokasiIdParam]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/locations', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLocations(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }
  };

  const fetchCamerasByLocation = async (lokasiId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cameras/lokasi/${lokasiId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setKameras(data.data || []);
      } else {
        setKameras([]);
      }
    } catch (error) {
        console.error("Failed to fetch cameras by location:", error);
        setKameras([]);
    }
  };

  const openCameraList = (loc: Location) => {
      setSelectedLocation(loc);
      fetchCamerasByLocation(loc.id);
      setShowListModal(true);
  };

  const openEditModal = (camera: Kamera) => {
      setEditId(camera.id);
      const arah1 = camera.zona_arah?.[0]?.arah || "";
      const arah2 = camera.zona_arah?.[1]?.arah || "";
      
      setForm({
          tipe: camera.tipe_kamera,
          arah1: arah1,
          arah2: arah2,
          lokasi: camera.lokasi_penempatan,
          lokasi_id: camera.lokasi_id,
      });
      
      setShowListModal(false);
      setShowModal(true);
  };

  const handleDelete = async (cameraId: string) => {
      setConfirmation({
          message: 'Yakin ingin menghapus kamera ini?',
          onConfirm: async () => {
              setConfirmation(null);
              try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`/api/cameras/${cameraId}`, {
                      method: 'DELETE',
                      headers: {
                          'Authorization': `Bearer ${token}`
                      }
                  });

                  if (!res.ok) {
                      const errData = await res.json();
                      throw new Error(errData.error || 'Gagal menghapus kamera');
                  }

                  showNotification && showNotification('Kamera berhasil dihapus');
                  
                  // Refresh camera list
                  if (selectedLocation) {
                      fetchCamerasByLocation(selectedLocation.id);
                  }
              } catch (error: any) {
                  showNotification && showNotification(error.message, 'error');
              }
          }
      });
  };

  useEffect(() => {
    setIsModalOpen(showModal || showListModal);
  }, [showModal, showListModal, setIsModalOpen]);

  // ================= LOGIC =================
  const handleSave = async () => {
    // Basic validation
    if (!form.tipe) {
      showNotification && showNotification('Tipe kamera harus diisi', 'error');
      return;
    }
    if (!form.lokasi) {
      showNotification && showNotification('Lokasi penempatan harus diisi', 'error');
      return;
    }
    if (!form.lokasi_id) {
      showNotification && showNotification('ID Lokasi hilang (Silakan refresh/buka dari halaman Lokasi)', 'error');
      return;
    }
    if (!form.arah1) {
      showNotification && showNotification('Arah 1 harus diisi', 'error');
      return;
    }

    // Construct zona_arah payload conditionally
    const zonaArahPayload = [{ arah: form.arah1 }];
    if (form.arah2) {
      zonaArahPayload.push({ arah: form.arah2 });
    }

    const payload = {
        tipe_kamera: form.tipe,
        zona_arah: zonaArahPayload,
        lokasi_penempatan: form.lokasi,
        lokasi_id: form.lokasi_id,
        api_key: "", // Optional or generated by backend
        keterangan: ""
    };

    try {
        const token = localStorage.getItem('token');
        let res;
        
        if (editId) {
            // Edit Mode
            res = await fetch(`/api/cameras/${editId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
        } else {
            // Create Mode
            res = await fetch('/api/cameras', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
        }

        if (!res.ok) {
            const errData = await res.json();
            // Extract meaningful error message
            let errorMsg = errData.error || (editId ? 'Gagal mengupdate kamera' : 'Gagal menyimpan kamera');
            
            // Check for duplicate key error
            if (errorMsg.includes('dup key') || errorMsg.includes('duplicate')) {
                errorMsg = 'Zona arah sudah ada di database. Silakan hubungi admin untuk membersihkan data atau gunakan nama arah yang berbeda.';
            }
            
            throw new Error(errorMsg);
        }

        const result = await res.json();

        setShowModal(false);
        showNotification && showNotification(editId ? 'Kamera berhasil diupdate' : 'Kamera berhasil disimpan');
        
        setForm({
            tipe: "",
            arah1: "",
            arah2: "",
            lokasi: "",
            lokasi_id: "",
        });
        setEditId(null);
        
        // Refresh data (maybe redirect to list view or something, or nothing since we show location list now)
        // Perhaps open the list modal?
        if (form.lokasi_id && form.lokasi) {
            const loc = locations.find(l => l.id === form.lokasi_id) || {
                id: form.lokasi_id,
                nama_lokasi: form.lokasi,
                alamat_lokasi: '',
                keterangan: ''
            };
            openCameraList(loc);
        }

    } catch (error: any) {
        showNotification && showNotification(error.message, 'error');
    }
  };

  const inputClass =
    "w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#24345A]/30";

  // ================= UI =================
  return (
    <main className="min-h-screen bg-[#24345A] text-white font-sans">
      <div className="p-4 sm:p-8 max-w-6xl mx-auto">

        {/* ===== TITLE & ACTION ===== */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">DATA KAMERA</h1>
        </div>

        {/* ===== TABLE ===== */}
        <div className="bg-white rounded-lg overflow-hidden text-gray-800">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Lokasi</th>
                <th className="px-4 py-3">Alamat</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3 text-center">Daftar Kamera</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc, i) => (
                <tr key={loc.id} className="border-t">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-[#24345A]">{loc.nama_lokasi}</td>
                  <td className="px-4 py-3">{loc.alamat_lokasi}</td>
                  <td className="px-4 py-3">{loc.keterangan || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                        onClick={() => openCameraList(loc)}
                        className="p-2 border rounded hover:bg-gray-50 text-gray-600"
                        title="Lihat Kamera"
                    >
                        <Video size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {locations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
                Belum ada data lokasi
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL LIHAT KAMERA ================= */}
      {showListModal && selectedLocation && (
        <>
            <div
                className="fixed inset-0 bg-black/60 z-40"
                onClick={() => setShowListModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-[900px] rounded-xl p-4 sm:p-8 text-black relative max-h-[80vh] overflow-y-auto">
                    <button
                        onClick={() => setShowListModal(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-black"
                    >
                        <X size={24} />
                    </button>
                    
                    <h2 className="text-xl font-bold mb-2">Daftar Kamera</h2>
                    <p className="text-gray-500 mb-6">Lokasi: {selectedLocation.nama_lokasi}</p>

                     <table className="min-w-full text-sm text-left border rounded-lg">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 border-b">No</th>
                            <th className="px-4 py-3 border-b">Tipe Kamera</th>
                            <th className="px-4 py-3 border-b">Arah 1</th>
                            <th className="px-4 py-3 border-b">ID Zona 1</th>
                            <th className="px-4 py-3 border-b">Arah 2</th>
                            <th className="px-4 py-3 border-b">ID Zona 2</th>
                            <th className="px-4 py-3 border-b">API Key</th>
                            <th className="px-4 py-3 border-b text-center">Aksi</th>
                        </tr>
                        </thead>
                        <tbody>
                        {kameras.length > 0 ? (
                            kameras.map((k, i) => (
                                <tr key={k.id} className="border-b">
                                <td className="px-4 py-3">{i + 1}</td>
                                <td className="px-4 py-3">{k.tipe_kamera}</td>
                                <td className="px-4 py-3">{k.zona_arah?.[0]?.arah || '-'}</td>
                                <td className="px-4 py-3">{k.zona_arah?.[0]?.id_zona_arah || '-'}</td>
                                <td className="px-4 py-3">{k.zona_arah?.[1]?.arah || '-'}</td>
                                <td className="px-4 py-3">{k.zona_arah?.[1]?.id_zona_arah || '-'}</td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => setVisibleApiKeys(prev => ({ ...prev, [k.id]: !prev[k.id] }))}
                                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border"
                                    >
                                        {visibleApiKeys[k.id] ? (
                                            <span className="font-mono text-[10px]">{k.api_key || '-'}</span>
                                        ) : (
                                            <span>••••••••</span>
                                        )}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => openEditModal(k)}
                                            className="p-1.5 border rounded hover:bg-gray-50 text-blue-600"
                                            title="Edit Kamera"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(k.id)}
                                            className="p-1.5 border rounded hover:bg-red-50 text-red-600"
                                            title="Hapus Kamera"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                    Tidak ada data kamera di lokasi ini
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>

                     <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => {
                                setShowListModal(false);
                                setEditId(null);
                                setForm({
                                    tipe: "",
                                    arah1: "",
                                    arah2: "",
                                    lokasi: selectedLocation.nama_lokasi,
                                    lokasi_id: selectedLocation.id,
                                });
                                setShowModal(true);
                            }}
                            className="bg-[#24345A] text-white px-4 py-2 rounded hover:bg-[#1a2642]"
                        >
                            + Tambah Kamera di Sini
                        </button>
                     </div>
                </div>
            </div>
        </>
      )}

      {/* ================= MODAL TAMBAH KAMERA ================= */}
      {showModal && (
        <>
          {/* OVERLAY */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowModal(false)}
          />

          {/* MODAL */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-200 w-full max-w-[720px] rounded-xl p-4 sm:p-8 text-black relative max-h-[90vh] overflow-y-auto">

              {/* CLOSE */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4"
                title="Tutup"
              >
                <X size={24} />
              </button>

              <h2 className="text-lg sm:text-xl font-bold mb-6 sm:mb-8">
                {editId ? "EDIT DATA KAMERA" : "TAMBAH DATA KAMERA"}
              </h2>

              {/* FORM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label>Tipe Kamera</label>
                  <select
                    className={inputClass}
                    value={form.tipe}
                    onChange={(e) =>
                      setForm({ ...form, tipe: e.target.value })
                    }
                  >
                    <option value="" disabled>Pilih tipe kamera</option>
                    <option value="trafficam">Trafficam</option>
                    <option value="x_stream">X-Stream</option>
                    <option value="thermicam">Thermicam</option>
                    <option value="cctv">CCTV</option>
                  </select>
                </div>

                <div>
                  <label>Arah Jalur 1</label>
                  <input
                    className={inputClass}
                    placeholder="Contoh: Ke Palembang"
                    value={form.arah1}
                    onChange={(e) =>
                      setForm({ ...form, arah1: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Arah Jalur 2</label>
                  <input
                    className={inputClass}
                    placeholder="Contoh: Ke Jakarta"
                    value={form.arah2}
                    onChange={(e) =>
                      setForm({ ...form, arah2: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Lokasi Penempatan Kamera</label>
                  <input
                    className={inputClass}
                    placeholder="Masukkan lokasi kamera"
                    value={form.lokasi}
                    onChange={(e) =>
                      setForm({ ...form, lokasi: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* SAVE */}
              <button
                onClick={handleSave}
                className="mt-10 w-full bg-[#24345A] text-white py-3 rounded-lg font-bold text-lg"
              >
                SIMPAN
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= CONFIRMATION MODAL ================= */}
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
    </main>
  );
}

export default function KameraPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#24345A] flex items-center justify-center text-white">Loading...</div>}>
      <KameraPageContent />
    </Suspense>
  );
}


