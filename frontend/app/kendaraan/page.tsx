"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

const KLASIFIKASI_PERKOTAAN = [
	{
		id: 1,
		kelas: "Kendaraan Kelas 1",
		jenis: "Motor",
		ikon: "",
		panjang: "0 m - 2.5 m",
	},
	{
		id: 2,
		kelas: "Kendaraan Kelas 2",
		jenis: "Kendaraan Ringan",
		ikon: "",
		panjang: "2.5 m - 5.5 m",
	},
	{
		id: 3,
		kelas: "Kendaraan Kelas 3",
		jenis: "Kendaraan Berat",
		ikon: "",
		panjang: "5.5 m - 9 m",
	},
];

const KLASIFIKASI_LUAR_KOTA = [
	...KLASIFIKASI_PERKOTAAN,
	{
		id: 1,
		kelas: "Kendaraan Kelas 1",
		jenis: "Motor",
		ikon: "",
		panjang: "0 m - 2.5 m",
	},
	{
		id: 2,
		kelas: "Kendaraan Kelas 2",
		jenis: "Kendaraan Ringan",
		ikon: "",
		panjang: "2.5 m - 5.5 m",
	},
	{
		id: 3,
		kelas: "Kendaraan Kelas 3",
		jenis: "Kendaraan Berat",
		ikon: "",
		panjang: "5.5 m - 9 m",
	},
	{
		id: 4,
		kelas: "Kendaraan Kelas 4",
		jenis: "Bus Besar",
		ikon: "",
		panjang: "9 m - 12.5 m",
	},
	{
		id: 5,
		kelas: "Kendaraan Kelas 5",
		jenis: "Truk Besar",
		ikon: "",
		panjang: "12.5 m",
	},
];

const KLASIFIKASI_BEBAS_HAMBATAN = [
	...KLASIFIKASI_PERKOTAAN,
	{
		id: 1,
		kelas: "Kendaraan Kelas 1",
		jenis: "Motor",
		ikon: "",
		panjang: "0 m - 2.5 m",
	},
	{
		id: 2,
		kelas: "Kendaraan Kelas 2",
		jenis: "Kendaraan Ringan",
		ikon: "",
		panjang: "2.5 m - 5.5 m",
	},
	{
		id: 3,
		kelas: "Kendaraan Kelas 3",
		jenis: "Kendaraan Berat",
		ikon: "",
		panjang: "5.5 m - 9 m",
	},
	{
		id: 4,
		kelas: "Kendaraan Kelas 4",
		jenis: "Bus Besar",
		ikon: "",
		panjang: "9 m - 12.5 m",
	},
];

const KLASIFIKASI_12_KELAS = [
	{
		id: 1,
		kelas: "Kendaraan Kelas 1",
		jenis: "A",
		ikon: "",
		panjang: "1 m - 2 m",
	},
	{
		id: 2,
		kelas: "Kendaraan Kelas 2",
		jenis: "B",
		ikon: "",
		panjang: "2 m - 3 m",
	},
	{
		id: 3,
		kelas: "Kendaraan Kelas 3",
		jenis: "C",
		ikon: "",
		panjang: "3 m - 4 m",
	},
	{
		id: 4,
		kelas: "Kendaraan Kelas 4",
		jenis: "D",
		ikon: "",
		panjang: "4 m - 5 m",
	},
	{
		id: 5,
		kelas: "Kendaraan Kelas 5",
		jenis: "E",
		ikon: "",
		panjang: "5 m - 6 m",
	},
	{
		id: 6,
		kelas: "Kendaraan Kelas 6",
		jenis: "F",
		ikon: "",
		panjang: "6 m - 7 m",
	},
	{
		id: 7,
		kelas: "Kendaraan Kelas 7",
		jenis: "G",
		ikon: "",
		panjang: "7 m - 8 m",
	},
	{
		id: 8,
		kelas: "Kendaraan Kelas 8",
		jenis: "H",
		ikon: "",
		panjang: "8 m - 9 m",
	},
	{
		id: 9,
		kelas: "Kendaraan Kelas 9",
		jenis: "I",
		ikon: "",
		panjang: "9 m - 10 m",
	},
	{
		id: 10,
		kelas: "Kendaraan Kelas 10",
		jenis: "J",
		ikon: "",
		panjang: "10 m - 11 m",
	},
	{
		id: 11,
		kelas: "Kendaraan Kelas 11",
		jenis: "K",
		ikon: "",
		panjang: "11 m - 12 m",
	},
	{
		id: 12,
		kelas: "Kendaraan Kelas 12",
		jenis: "L",
		ikon: "",
		panjang: "12 m",
	},
];

export default function KendaraanPage() {
  const router = useRouter();

  useEffect(() => {
		const role = localStorage.getItem("role");
		if (role !== "superadmin") {
			router.push("/home");
		}
	}, [router]);

	const renderTable = (data: typeof KLASIFIKASI_PERKOTAAN, title: string) => {
		return (
			<div className="bg-white rounded-xl shadow-lg overflow-hidden text-gray-800 max-w-3xl mb-6">
				{/* Header Oranye */}
				<div className="bg-orange-500 px-4 py-3 sm:px-6">
					<span className="font-semibold text-white text-sm sm:text-base">{title}</span>
				</div>

				{/* Isi */}
				<div className="divide-y">
					{data.map((item) => {
						return (
							<div
								key={item.id}
								className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:px-6 sm:py-4 gap-2 sm:gap-4"
							>
								<span className="font-medium text-sm sm:text-base sm:flex-1">{item.kelas}</span>

								<div className="flex items-center justify-between sm:justify-center sm:flex-1">
									<div className="bg-gray-100 px-3 py-1 rounded-full text-xs sm:text-sm text-center">
										{item.jenis}
									</div>
								</div>

								<span className="text-sm sm:text-base text-gray-600 sm:text-gray-800 sm:flex-1 sm:text-right">{item.panjang}</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

  return (
    <main className="min-h-screen bg-[#24345A] text-white font-sans">
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        {/* Judul */}
        <h1 className="text-xl sm:text-2xl font-bold mb-6">KLASIFIKASI KENDARAAN</h1>

        {renderTable(KLASIFIKASI_PERKOTAAN, "Klasifikasi Kendaraan Pada Jalan Perkotaan")}
				{renderTable(
					KLASIFIKASI_LUAR_KOTA,
					"Klasifikasi Kendaraan Pada Jalan Luar Kota"
				)}
				{renderTable(
					KLASIFIKASI_BEBAS_HAMBATAN,
					"Klasifikasi Kendaraan Pada Jalan Bebas Hambatan"
				)}
				{renderTable(KLASIFIKASI_12_KELAS, "Klasifikasi Kendaraan 12 Kelas")}
			</div>
		</main>
	);
}
