"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";

type User = {
  id: number;
  username: string;
  email: string;
  level: string;
  lastLogin: string;
};

export default function ManajemenUserPage() {
  // ================= STATE =================
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: "Fitran Husein",
      email: "fitran@mail.com",
      level: "User",
      lastLogin: "2025-06-06 16:41:10",
    },
    {
      id: 2,
      username: "Andreas Calvin",
      email: "andreas@mail.com",
      level: "Admin",
      lastLogin: "2025-06-06 16:41:10",
    },
  ]);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    level: "",
  });

  // ================= LOGIC =================
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.username || !form.email || !form.level) return;

    setUsers([
      ...users,
      {
        id: users.length + 1,
        username: form.username,
        email: form.email,
        level: form.level,
        lastLogin: "-",
      },
    ]);

    setForm({
      username: "",
      email: "",
      password: "",
      confirm: "",
      level: "",
    });

    setShowModal(false);
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
            className="bg-orange-500 hover:bg-orange-600 px-5 py-2 rounded-lg font-semibold"
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
        <div className="bg-white rounded-lg text-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">No</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Level</th>
                <th className="px-4 py-3 text-left">Login Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3">{u.level}</td>
                  <td className="px-4 py-3">{u.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <>
          {/* OVERLAY */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowModal(false)}
          />

          {/* MODAL BOX */}
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-gray-200 w-[720px] rounded-xl p-8 text-black relative">

              {/* CLOSE */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4"
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
                    onChange={(e) =>
                      setForm({ ...form, confirm: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-medium">Level</label>
                  <select
                    className={inputClass}
                    title="Pilih level pengguna"
                    value={form.level}
                    onChange={(e) =>
                      setForm({ ...form, level: e.target.value })
                    }
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
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
