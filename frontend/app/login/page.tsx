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
            localStorage.setItem("region", data.region);

            // Redirect ke home
            router.push("/home");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-8 bg-[url('/images/bg-login.webp')] bg-cover relative">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
            
            <div className="flex flex-row items-center justify-center gap-20 w-full max-w-6xl z-10">
                <div className="flex justify-center">
                    <Image src="/images/logo.png" alt="Logo Dishub" width={380} height={380} className="object-contain drop-shadow-2xl" />
                </div>
                <form onSubmit={handleLogin} className="flex flex-col w-[480px] rounded-3xl bg-white p-10 shadow-2xl">
                    <h1 className="font-bold text-[#24345A] text-3xl text-center mb-2">Selamat Datang!</h1>
                    <span className="mb-8 text-gray-500 text-center text-sm">Silakan isi detail akun anda!</span>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <input 
                            id="username"
                            type="text" 
                            placeholder="Username"
                            className="w-full px-6 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#24345A] focus:ring-2 focus:ring-[#24345A]/20 outline-none transition-all text-gray-800 placeholder-gray-400"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <input 
                            id="password"
                            type="password" 
                            placeholder="Password"
                            className="w-full px-6 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#24345A] focus:ring-2 focus:ring-[#24345A]/20 outline-none transition-all text-gray-800 placeholder-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-8 w-full bg-[#24345A] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#1e2b4a] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                    >
                        {loading ? "Memuat..." : "Masuk"}
                    </button>
                </form>
            </div>
            <div className="absolute bottom-8 w-full text-center z-10">
                <span className="font-bold text-white text-sm tracking-[0.2em] uppercase opacity-90 drop-shadow-md">
                    DINAS PERHUBUNGAN TRAFFIC CENTER
                </span>
            </div>    
        </main>
    )
}