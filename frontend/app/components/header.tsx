import Image from "next/image";
import { LogOut,Search } from "lucide-react";


export default function Header() {
  return (
    <header className="w-full bg-white shadow-sm px-6 py-3 flex items-center justify-between">
      
      <div className="flex items-center gap-3">
        <Image
          src="/images/logo.png"
          alt="Logo Dishub"
          width={40}
          height={40}
        />
      </div>

      <div className="flex-1 flex justify-center px-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari lokasi / TFC"
            className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-medium text-gray-800">
          USER
        </span>

        <button className="text-gray-600 hover:text-red-600">
          <LogOut size={20} />
        </button>
      </div>

    </header>
  );
}
