# PLATO - Traffic Monitoring System

PLATO adalah sistem pemantauan lalu lintas berbasis web yang dirancang untuk menganalisis dan memvisualisasikan data lalu lintas secara real-time. Sistem ini mengintegrasikan analisis kamera CCTV, klasifikasi kendaraan, dan pelaporan data statistik untuk membantu manajemen lalu lintas.

## 🏗️ Arsitektur Sistem

Proyek ini menggunakan arsitektur **Microservices** sederhana yang disatukan menggunakan Docker:

*   **Frontend**: Dibangun dengan **Next.js 14** (TypeScript), menyajikan antarmuka dashboard yang responsif dan interaktif.
*   **Backend**: Dibangun dengan **Go (Golang)**, menangani logika bisnis, pengolahan data lalu lintas, dan API RESTful.
*   **Database**: **MongoDB** sebagai penyimpanan data NoSQL untuk fleksibilitas data log dan monitoring.
*   **Reverse Proxy**: **Nginx** menangani routing permintaan antara frontend dan backend serta melayani aplikasi ke pengguna.

## 📂 Struktur Direktori

```
PLATO/
├── backend/            # Source code API (Go)
├── frontend/           # Source code UI (Next.js)
├── nginx/              # Konfigurasi Reverse Proxy
├── docker-compose.yml  # Orkestrasi container
└── README.md           # Dokumentasi Proyek
```

## 🚀 Cara Menjalankan (Quick Start)

Prasyarat: Pastikan **Docker** dan **Docker Compose** sudah terinstal di komputer/server Anda.

1.  **Clone Repository** (jika belum):
    ```bash
    git clone <repository_url>
    cd PLATO
    ```

2.  **Jalankan Aplikasi**:
    Gunakan perintah berikut untuk membangun dan menjalankan semua service:
    ```bash
    docker-compose up -d --build
    ```

3.  **Akses Aplikasi**:
    Setelah semua container berjalan, buka browser dan akses:
    *   **Web Dashboard**: [http://localhost:8000](http://localhost:8000)
    *   **API Endpoint**: `http://localhost:8000/api/`

## 🛠️ Manajemen Data (Seeder)

Untuk mengisi database dengan data awal (Super Admin, Data Balai, Klasifikasi Kendaraan), Anda dapat menggunakan *seeder* yang sudah tersedia di container backend.

Jalankan perintah berikut saat container sedang berjalan:

```bash
# Menjalankan semua seeder (Admin, Klasifikasi, Balai)
docker compose exec backend ./seeder

# Menjalankan seeder spesifik
docker compose exec backend ./seeder -type=superadmin
docker compose exec backend ./seeder -type=klasifikasi
```

## 🔧 Pengembangan (Development)

Jika Anda ingin menjalankan layanan secara manual tanpa Docker (untuk debugging):

### Backend (Go)
1.  Masuk ke folder `backend`.
2.  Pastikan MongoDB berjalan lokal.
3.  Konfigurasi `.env` sesuai kebutuhan.
4.  Jalankan: `go run cmd/main.go`

### Frontend (Next.js)
1.  Masuk ke folder `frontend`.
2.  Install dependensi: `npm install`.
3.  Jalankan: `npm run dev`.
4.  Akses di `http://localhost:3000`.

## 📝 Catatan Penting
*   **Konfigurasi Nginx**: Pengaturan domain dan SSL dapat diatur di folder `nginx/nginx.conf`.
*   **Persistensi Data**: Data MongoDB disimpan dalam volume docker `mongo-data` agar tidak hilang saat container direstart.
