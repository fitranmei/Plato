"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModalContext } from "../components/ModalContext";

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  balai: string;
  last_login: string;
};

export default function ManajemenUserPage() {
  const router = useRouter();
  const { showNotification, setIsModalOpen: setGlobalModalOpen } = useModalContext();
  
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'superadmin') {
        router.push('/home');
    }
  }, [router]);
  
  // ================= STATE =================
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    role: "user",
    balai: "",
  });
  
  useEffect(() => {
    setGlobalModalOpen(showModal);
  }, [showModal, setGlobalModalOpen]);

  const balaiOptions = [
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        router.push('/login');
        return;
    }

    try {
        const res = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data || []);
    } catch (error) {
        console.error("Error fetching users:", error);
    } finally {
        setLoading(false);
    }
  };

  // ================= LOGIC =================
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.username || !form.email || !form.password || !form.balai) {
        showNotification("Semua field wajib diisi", 'error');
        return;
    }

    if (form.password !== form.confirm) {
        showNotification("Password tidak cocok", 'error');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        router.push('/login');
        return;
    }

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: form.username,
                email: form.email,
                password: form.password,
                role: form.role,
                balai: form.balai
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Gagal menyimpan user');
        }

        showNotification("User berhasil disimpan", 'success');
        setShowModal(false);
        setForm({
            username: "",
            email: "",
            password: "",
            confirm: "",
            role: "user",
            balai: "",
        });
        fetchUsers();
    } catch (error: any) {
        showNotification(error.message, 'error');
    }
  };

  const inputClass =
    "w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#24345A]/30";

  // ================= UI =================
  return (
    <main className="min-h-screen bg-[#24345A] text-white font-sans p-8">
      <div className="max-w-6xl mx-auto">

        {/* ===== TITLE ===== */}
        <h1 className="text-2xl font-bold mb-6">MANAJEMEN DATA USER</h1>

        {/* ===== TOP ACTION ===== */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-500 hover:bg-orange-600 px-5 py-2 rounded-lg font-semibold shadow"
          >
            + Tambah Data User
          </button>

          <div className="relative w-60">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Cari user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 py-2 rounded-xl bg-white text-gray-800 border border-white focus:outline-none"
            />
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <div className="bg-white rounded-lg text-gray-800 overflow-hidden shadow">
          {loading ? (
             <div className="p-8 text-center text-gray-500">Loading data...</div>
          ) : (
            <table className="w-full text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-4 py-3 text-left">No</th>
                    <th className="px-4 py-3 text-left">Username</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Balai</th>
                    <th className="px-4 py-3 text-left">Login Terakhir</th>
                </tr>
                </thead>
                <tbody>
                {filteredUsers.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                            Tidak ada data user.
                        </td>
                    </tr>
                ) : (
                    filteredUsers.map((u, i) => (
                        <tr key={u.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">{i + 1}</td>
                        <td className="px-4 py-3 font-medium">{u.username}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3 capitalize">{u.role}</td>
                        <td className="px-4 py-3">{u.balai}</td>
                        <td className="px-4 py-3">{u.last_login ? new Date(u.last_login).toLocaleString() : '-'}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
            <div className="bg-gray-200 w-[720px] rounded-xl p-8 text-black relative">

              {/* CLOSE */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 bg-[#24345A] text-white w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#1e2b4a] transition-colors font-bold shadow-md text-xl"
                title="Tutup"
              >
                <X size={24} />
              </button>

              <h2 className="text-xl font-bold mb-8">TAMBAH DATA USER</h2>

              {/* FORM */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="font-medium">Username</label>
                  <input
                    className={inputClass}
                    placeholder="Masukkan username"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="font-medium">Password</label>
                  <input
                    type="password"
                    className={inputClass}
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="font-medium">Email</label>
                  <input
                    className={inputClass}
                    placeholder="Masukkan email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="font-medium">Confirm Password</label>
                  <input
                    type="password"
                    className={inputClass}
                    placeholder="Konfirmasi password"
                    value={form.confirm}
                    onChange={(e) =>
                      setForm({ ...form, confirm: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="font-medium">Role</label>
                  <select
                    className={inputClass}
                    title="Pilih role pengguna"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium">Balai</label>
                  <select
                    className={inputClass}
                    value={form.balai}
                    onChange={(e) =>
                      setForm({ ...form, balai: e.target.value })
                    }
                  >
                    <option value="">Pilih Balai</option>
                    <option value="Pusat">Pusat</option>
                    {balaiOptions.map((balai) => (
                        <option key={balai} value={balai}>{balai}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SAVE */}
              <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    className="bg-[#24345A] hover:bg-[#1e2b4a] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                    Simpan
                </button>
              </div>
            </div>
          </div>
      )}
    </main>
  );
}