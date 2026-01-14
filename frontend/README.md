# Dokumentasi Frontend PLATO

## Ringkasan Proyek
Aplikasi frontend PLATO dibangun menggunakan **Next.js 14** dengan App Router. Aplikasi ini berfungsi sebagai dashboard pemantauan lalu lintas (Traffic Monitoring System) yang berinteraksi dengan API backend Go.

## Teknologi Utama
- **Framework:** Next.js 14 (App Router)
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS
- **Peta:** React Leaflet & Leaflet CSS
- **Visualisasi Data:** Recharts
- **Icon:** Heroicons (via SVG langsung) / React Icons

## Struktur Direktori
```
frontend/
├── app/                  # Direktori utama Next.js App Router
│   ├── components/       # Komponen UI reusable (Header, Sidebar, Map, Charts)
│   ├── home/             # Halaman Dashboard Utama
│   ├── login/            # Halaman Login
│   ├── lokasi/           # Manajemen Data Lokasi
│   ├── monitoring/       # Halaman Detail Monitoring per Lokasi
│   ├── kamera/           # Halaman Manajemen Kamera
│   ├── kendaraan/        # Halaman Klasifikasi Kendaraan
│   ├── manajemen-user/   # Halaman Admin User (RBAC)
│   ├── globals.css       # Style global & Tailwind directives
│   ├── layout.tsx        # Root layout aplikasi
│   └── page.tsx          # Root page (redirects to /login)
├── public/               # Aset statis (images, icons)
├── tailwind.config.ts    # Konfigurasi Tailwind
└── next.config.mjs       # Konfigurasi Next.js
```

## Arsitektur & Pola Desain

### 1. Layout & Shell (`AppShell.tsx`)
Aplikasi menggunakan pola "App Shell" untuk membungkus semua halaman yang membutuhkan otentikasi.
- **Path:** `app/components/AppShell.tsx`
- **Fungsi:** 
  - Mengecek otentikasi (Token di LocalStorage).
  - Merender `Sidebar` dan `Header` secara kondisional (tidak dirender di halaman login).
  - Mengelola state global UI (loading states).

### 2. Otentikasi & Otorisasi
Otentikasi dilakukan sepenuhnya di sisi klien (Client-Side Auth).
- **Login:** Token JWT disimpan di `localStorage` setelah login berhasil.
- **Proteksi Rute:** `AppShell` akan me-redirect user ke `/login` jika token tidak ditemukan.
- **RBAC (Role-Based Access Control):** 
  - Role user disimpan di `localStorage` (`role`).
  - **Sidebar (`Sidebar.tsx`)** menyembunyikan menu tertentu (misal: "Manajemen User") jika role bukan `Super Admin`.

### 3. Manajemen State
- **Local State:** Menggunakan `useState` dan `useEffect` untuk data per halaman.
- **Global State:** Menggunakan React Context (`ModalContext.tsx`) untuk notifikasi global dan state modal, menghindari penggunaan library state management berat seperti Redux.

### 4. Integrasi Peta (`MapWrapper` & `MapPicker`)
Peta diimplementasikan menggunakan `react-leaflet`.
- Karena Leaflet membutuhkan window object, komponen peta dimuat secara **Dynamic Import** dengan `ssr: false`.
- Lokasi dan status lalu lintas (Lancar/Padat/Macet) dirender sebagai Marker dengan warna dinamis.

### 5. Visualisasi Data
Halaman monitoring (`app/monitoring/[id]`) menggunakan library **Recharts** untuk menampilkan grafik lalu lintas real-time.

## Komponen Kunci

### `Sidebar.tsx`
Navigasi utama aplikasi. Menu yang ditampilkan dinamis berdasarkan role user.
- **Lokasi:** `app/components/Sidebar.tsx`

### `Header.tsx`
Header bagian atas yang menampilkan judul halaman dinamis dan tombol profil/logout.
- **Lokasi:** `app/components/Header.tsx`

### `HomeCard.tsx`
Kartu ringkasan untuk setiap lokasi di halaman dashboard utama. Menampilkan status koneksi, SMP (Satuan Mobil Penumpang), dan status kelancaran.

## Panduan Pengembangan

### Menjalankan Development Server
```bash
npm install
npm run dev
```

### Build untuk Produksi
```bash
npm run build
npm start
```

### Konfigurasi Environment
Pastikan file `.env` atau variable environment server dikonfigurasi dengan URL backend yang sesuai jika tidak menggunakan proxy Nginx default.

## Deployment
Aplikasi ini di-containerisasi menggunakan **Docker**. File `Dockerfile` tersedia di root direktori frontend untuk build production image.
