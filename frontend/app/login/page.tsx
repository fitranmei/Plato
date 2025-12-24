"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login gagal");
            }

            // Simpan token dan role (sesuaikan dengan kebutuhan app)
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            localStorage.setItem("username", data.username || username);

            // Redirect ke home
            router.push("/home");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-8 bg-[url('/images/bg-login.webp')] bg-cover">
            <div className="flex flex-row">
                <div className="w-1/2">
                    <Image src="/images/logo.png" alt="Logo Dishub" width={300} height={300} className="mr-100" />
                </div>
                <form onSubmit={handleLogin} className="flex flex-col w-1/2 rounded-lg bg-white p-5">
                    <h1 className="font-bold text-blue-dark text-2xl text-center mt-5 mb-10">Selamat Datang!</h1>
                    <span className="mb-2">Silakan isi detail akun anda!</span>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <input 
                        id="username"
                        type="text" 
                        placeholder="Username"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <input 
                        id="password"
                        type="password" 
                        placeholder="Password"
                        className="w-full px-4 py-3 mt-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 w-full bg-blue-900 text-white font-semibold py-3 rounded-lg shadow-sm hover:brightness-110 active:brightness-90 focus:ring-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? "Memuat..." : "Masuk"}
                    </button>
                </form>
            </div>
            <div className="absolute bottom-6 w-full text-center">
                <span className="font-bold text-white text-sm tracking-widest uppercase opacity-80">
                    DINAS PERHUBUNGAN TRAFFIC CENTER
                </span>
            </div>    
        </main>
    )
}