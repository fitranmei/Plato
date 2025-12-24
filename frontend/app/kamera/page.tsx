"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useModalContext } from "../components/ModalContext";

type Kamera = {
  id: number;
  tipe: string;
  arah1: string;
  zona1: string;
  arah2: string;
  zona2: string;
  lokasi: string;
};

export default function KameraPage() {
  const { setIsModalOpen } = useModalContext();

  // ================= STATE =================
  const [kameras, setKameras] = useState<Kamera[]>([
    {
      id: 1,
      tipe: "Kamera A",
      arah1: "Utara",
      zona1: "Z1",
      arah2: "Selatan",
      zona2: "Z2",
      lokasi: "Jl. Raya Cirebon - Bandung",
    },
  ]);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    tipe: "",
    arah1: "",
    zona1: "",
    arah2: "",
    zona2: "",
    lokasi: "",
  });

  useEffect(() => {
    setIsModalOpen(showModal);
  }, [showModal, setIsModalOpen]);

  // ================= LOGIC =================
  const handleSave = () => {
    if (!form.tipe || !form.lokasi) return;

    setKameras([
      ...kameras,
      {
        id: kameras.length + 1,
        ...form,
      },
    ]);

    setForm({
      tipe: "",
      arah1: "",
      zona1: "",
      arah2: "",
      zona2: "",
      lokasi: "",
    });

    setShowModal(false);
  };

  const inputClass =
    "w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#24345A]/30";

  // ================= UI =================
  return (
    <main className="min-h-screen bg-[#24345A] text-white font-sans">
      <div className="p-8 max-w-6xl mx-auto">

        {/* ===== TITLE & ACTION ===== */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">DATA KAMERA</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg shadow"
          >
            + Tambah Data Kamera
          </button>
        </div>

        {/* ===== TABLE ===== */}
        <div className="bg-white rounded-lg overflow-hidden text-gray-800">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Tipe Kamera</th>
                <th className="px-4 py-3">Arah 1</th>
                <th className="px-4 py-3">ID Zona 1</th>
                <th className="px-4 py-3">Arah 2</th>
                <th className="px-4 py-3">ID Zona 2</th>
                <th className="px-4 py-3">Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {kameras.map((k, i) => (
                <tr key={k.id} className="border-t">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3">{k.tipe}</td>
                  <td className="px-4 py-3">{k.arah1}</td>
                  <td className="px-4 py-3">{k.zona1}</td>
                  <td className="px-4 py-3">{k.arah2}</td>
                  <td className="px-4 py-3">{k.zona2}</td>
                  <td className="px-4 py-3">{k.lokasi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL TAMBAH KAMERA ================= */}
      {showModal && (
        <>
          {/* OVERLAY */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowModal(false)}
          />

          {/* MODAL */}
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-gray-200 w-[760px] rounded-xl p-8 text-black relative">

              {/* CLOSE */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4"
                title="Tutup"
              >
                <X size={24} />
              </button>

              <h2 className="text-xl font-bold mb-8">
                TAMBAH DATA KAMERA
              </h2>

              {/* FORM */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label>Tipe Kamera</label>
                  <input
                    className={inputClass}
                    placeholder="Masukkan tipe kamera"
                    value={form.tipe}
                    onChange={(e) =>
                      setForm({ ...form, tipe: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Arah 2</label>
                  <input
                    className={inputClass}
                    placeholder="Masukkan arah 2"
                    value={form.arah2}
                    onChange={(e) =>
                      setForm({ ...form, arah2: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Arah 1 ke</label>
                  <input
                    className={inputClass}
                    placeholder="Masukkan arah 1"
                    value={form.arah1}
                    onChange={(e) =>
                      setForm({ ...form, arah1: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>ID Zona Arah 2</label>
                  <input
                    className={inputClass}
                    placeholder="Masukkan ID zona arah 2"
                    value={form.zona2}
                    onChange={(e) =>
                      setForm({ ...form, zona2: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>ID Zona Arah 1</label>
                  <input
                    className={inputClass}
                    placeholder="Masukkan ID zona arah 1"
                    value={form.zona1}
                    onChange={(e) =>
                      setForm({ ...form, zona1: e.target.value })
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
    </main>
  );
}
