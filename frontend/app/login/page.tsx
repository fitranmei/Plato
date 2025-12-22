import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
    return (
        <main className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-8 bg-[url('/images/bg-login.png')] bg-cover">
            <div className="flex flex-row">
                <div className="w-1/2">
                    <Image src="/images/logo.png" alt="Logo Dishub" width={300} height={300} className="mr-100" />
                </div>
                <div className="flex flex-col w-1/2 rounded-lg bg-white p-5">
                    <h1 className="font-bold text-blue-dark text-2xl text-center mt-5 mb-10">Selamat Datang !</h1>
                    <span className="mb-2">Silakan isi detail akun anda!</span>
                    <input 
                        id="username"
                        type="text" 
                        placeholder="Username"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800"
                        required
                    />
                    <input 
                        id="password"
                        type="password" 
                        placeholder="Password"
                        className="w-full px-4 py-3 mt-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800"
                        required
                    />
                    <button
                        type="submit"
                        className=" mt-4 w-full bg-blue-900 text-white font-semibold py-3 rounded-lg shadow-sm hover:brightness-110 active:brightness-90 focus:ring-2 focus:ring-brand-500
                        "
                    >
                    Masuk
                    </button>
                </div>
            </div>
            <div className="absolute bottom-6 w-full text-center">
  <span className="font-bold text-white text-sm tracking-widest uppercase opacity-80">
    DINAS PERHUBUNGAN TRAFFIC CENTER
  </span>
</div>    
        </main>
    )
}