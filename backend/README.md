# Dokumentasi Backend PLATO

## Daftar Isi
1. [Gambaran Umum](#gambaran-umum)
2. [Fitur Utama](#fitur-utama)
3. [Struktur Folder](#struktur-folder)
4. [Konfigurasi](#konfigurasi)
5. [Model Data](#model-data)
6. [API Endpoints](#api-endpoints)
7. [Middleware](#middleware)
8. [Services](#services)
9. [Cara Menjalankan](#cara-menjalankan)

---

## Gambaran Umum

Backend PLATO adalah sistem pengelolaan data lalu lintas yang dibangun menggunakan:
- **Bahasa**: Go (Golang)
- **Framework**: Fiber v2
- **Database**: MongoDB
- **Autentikasi**: JWT (JSON Web Token)

Sistem ini berfungsi untuk:
- Menerima data dari kamera lalu lintas
- Mengelola lokasi pemantauan
- Menganalisis data lalu lintas menggunakan metode **MKJI 1997** dan **PKJI 2023**
- Menghitung kapasitas jalan dan tingkat pelayanan

---

## Fitur Utama

### 1. Manajemen Lokasi dengan Source Media
- **Dukungan Multi-Source**: Setiap lokasi dapat memiliki source berupa link YouTube atau gambar
- **Validasi Otomatis**: Link YouTube divalidasi secara real-time
- **Pemrosesan Gambar**: Upload gambar dalam format base64, otomatis dikonversi ke WebP
- **Generasi Gambar Kosong**: Sistem dapat membuat gambar placeholder kosong untuk lokasi baru
- **Cleanup Otomatis**: Gambar lama dihapus saat diganti atau lokasi dihapus

### 2. Keamanan API Key Kamera
- **Generasi Otomatis**: API key selalu dibuat oleh sistem backend, tidak dapat diubah user
- **Immutability**: API key tidak dapat diupdate setelah kamera dibuat
- **Unik Otomatis**: Sistem memastikan API key unik di seluruh sistem

### 3. Seeder Superadmin yang Robust
- **Upsert Logic**: Superadmin dapat dibuat tanpa batas dengan logika replace berdasarkan ID
- **Data Konsisten**: Mencegah duplikasi dan memastikan data superadmin selalu terbaru
- **Isolasi API**: Superadmin hanya dapat dibuat melalui seeder, bukan API publik

### 4. Dokumentasi dan Logging dalam Bahasa Indonesia
- **Komentar Kode**: Semua komentar dalam kode telah diterjemahkan ke bahasa Indonesia
- **Logging Konsisten**: Pesan log error dan informasi menggunakan bahasa Indonesia
- **Dokumentasi Lengkap**: README dan dokumentasi internal dalam bahasa Indonesia

---

## Struktur Folder

```
backend/
├── cmd/                    # Entry point aplikasi
│   ├── main.go            # File utama untuk menjalankan server
│   └── seeder/            # Script untuk mengisi data awal
├── config/                 # Konfigurasi aplikasi
│   └── config.go          # Membaca environment variables
├── controllers/            # Handler untuk setiap endpoint
│   ├── user.controller.go
│   ├── camera.controller.go
│   ├── location.controller.go
│   ├── traffic_data.controller.go
│   └── ...
├── database/               # Koneksi dan indexing database
│   └── mongo.go
├── middleware/             # Middleware autentikasi
│   └── auth.go
├── models/                 # Struktur data dan fungsi database
│   ├── user.go
│   ├── camera.go
│   ├── location.go
│   ├── traffic_data.go
│   ├── mkji.go            # Perhitungan MKJI 1997
│   ├── pkji.go            # Perhitungan PKJI 2023
│   └── ...
├── routes/                 # Definisi routing API
│   └── routes.go
├── services/               # Background services
│   ├── traffic_collector.go
│   └── dummy_data_generator.go
├── utils/                  # Fungsi utilitas
│   ├── jwt.go             # Generate dan validasi JWT
│   └── password.go        # Hash dan verifikasi password
├── .env                    # Environment variables (tidak di-commit)
├── Dockerfile              # Docker build configuration
├── go.mod                  # Go module dependencies
└── go.sum                  # Go module checksums
```

---

## Konfigurasi

### Environment Variables (.env)

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `APP_PORT` | Port server | `8080` |
| `MONGO_URI` | URL koneksi MongoDB | `mongodb://localhost:27017` |
| `DB_NAME` | Nama database | `plato` |
| `JWT_SECRET` | Secret key untuk JWT | `your-secret-key` |

---

## Model Data

### 1. User (Pengguna)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | string | ID unik (UA001, AA001) |
| `username` | string | Nama pengguna |
| `email` | string | Email pengguna |
| `password` | string | Password (ter-hash) |
| `role` | string | Peran: `user`, `admin`, `superadmin` |
| `balai` | string | Balai terkait (BPJN/BBPJN) |
| `last_login` | datetime | Waktu login terakhir |

**Role Hierarchy:**
- `superadmin`: Akses penuh ke semua fitur
- `admin`: Akses ke manajemen data dan analisis
- `user`: Akses hanya untuk melihat data

---

### 2. Location (Lokasi)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | string | ID unik (LOC-00001) |
| `user_id` | string | ID user pemilik |
| `balai` | string | Balai terkait |
| `nama_lokasi` | string | Nama lokasi |
| `alamat_lokasi` | string | Alamat lengkap |
| `tipe_lokasi` | string | `perkotaan`, `luar_kota`, `bebas_hambatan`, `12_kelas` |
| `tipe_arah` | string | `22ud`, `42d`, `42ud`, `62d` |
| `lebar_jalur` | int | Lebar jalur (5-11 meter) |
| `persentase` | string | Pembagian arah: `50-50`, `55-45`, dst |
| `tipe_hambatan` | string | `bahu_jalan`, `kereb` |
| `kelas_hambatan` | string | `VL`, `L`, `M`, `H`, `VH` |
| `ukuran_kota` | float | Ukuran kota (juta penduduk) |
| `latitude` | float | Koordinat latitude |
| `longitude` | float | Koordinat longitude |
| `zona_waktu` | float | Offset waktu dari UTC |
| `interval` | int | Interval pengambilan data (detik) |
| `publik` | bool | Apakah lokasi publik |
| `hide_lokasi` | bool | Apakah lokasi disembunyikan |
| `keterangan` | string | Catatan tambahan |

**Source Media Lokasi:**
Setiap lokasi dapat memiliki source media yang terpisah dari data lokasi utama:

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `source_type` | string | Tipe source: `link` atau `image` |
| `source_data` | string | URL YouTube (untuk link) atau path gambar (untuk image) |

**Validasi Source:**
- **Link**: Harus berupa URL YouTube yang valid (youtu.be atau youtube.com)
- **Image**: Dapat berupa base64 string yang akan dikonversi ke WebP
- **Fallback**: Jika gagal memproses gambar, sistem akan menggunakan gambar placeholder

**Pilihan Tipe Lokasi:**
- `perkotaan`: Jalan di area perkotaan
- `luar_kota`: Jalan di luar kota
- `bebas_hambatan`: Jalan tol/bebas hambatan
- `12_kelas`: Klasifikasi 12 kelas kendaraan

---

### 3. Camera (Kamera)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | string | ID unik (CAM-00001) |
| `tipe_kamera` | string | `trafficam`, `x_stream`, `thermicam`, `cctv` |
| `zona_arah` | array | Daftar zona dan arah |
| `lokasi_penempatan` | string | Keterangan penempatan |
| `api_key` | string | API key untuk autentikasi kamera |
| `keterangan` | string | Catatan tambahan |
| `lokasi_id` | string | ID lokasi terhubung |

**Zona Arah Camera:**
- Minimal 1 zona, maksimal 8 zona
- Setiap zona memiliki `id_zona_arah` dan `arah` (nama arah)

**Catatan API Key:**
- API key **selalu di-generate otomatis** oleh sistem backend
- API key **tidak dapat diubah** setelah kamera dibuat (immutable)
- Sistem memastikan API key unik di seluruh sistem
- Jika duplikat terdeteksi, sistem akan generate ulang otomatis

---

### 4. Traffic Data (Data Lalu Lintas)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | string | ID unik (TD-00001) |
| `lokasi_id` | string | ID lokasi |
| `nama_lokasi` | string | Nama lokasi |
| `timestamp` | datetime | Waktu pengambilan data |
| `zona_arah_data` | array | Data per zona arah |
| `total_kendaraan` | int | Total kendaraan semua zona |
| `interval_menit` | int | Interval dalam menit |
| `mkji_analysis` | object | Hasil analisis MKJI 1997 |
| `pkji_analysis` | object | Hasil analisis PKJI 2023 |
| `raw_data_id` | string | Referensi ke raw data |

**Struktur Zona Arah Data:**
```json
{
  "id_zona_arah": "ZA-CAM-00001-1",
  "nama_arah": "Utara",
  "kelas_data": [
    {
      "kelas": 1,
      "nama_kelas": "Sepeda Motor",
      "jumlah_kendaraan": 150,
      "kecepatan_rata_rata": 45.5
    }
  ],
  "total_kendaraan": 150
}
```

---

### 5. Traffic Raw Data (Data Mentah)

Data mentah dari kamera sebelum diproses:

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | string | ID unik (RAW-00001) |
| `lokasi_id` | string | ID lokasi |
| `camera_id` | string | ID kamera |
| `timestamp` | datetime | Waktu data |
| `zona_data` | array | Data per zona (termasuk occupancy, density, dll) |
| `is_processed` | bool | Sudah diproses atau belum |
| `processed_id` | string | ID traffic_data hasil proses |

**Validasi Zona:**
- Jika data yang dikirim memiliki **zona berlebih** (tidak terdaftar di kamera): Data diterima, zona berlebih diabaikan, warning di log
- Jika data yang dikirim **kurang zona** (zona terdaftar tidak ada datanya): Data diterima, zona yang tidak ada diset ke 0, warning di log

---

### 6. Klasifikasi Kendaraan

Master data klasifikasi kendaraan berdasarkan tipe lokasi:

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | string | ID unik |
| `kelas` | int | Nomor kelas (1-5 atau 1-12) |
| `nama_kelas` | string | Nama kendaraan |
| `tipe_lokasi` | string | Tipe lokasi terkait |
| `kategori_mkji` | string | Kategori MKJI (MC/LV/HV/UM) |
| `kategori_pkji` | string | Kategori PKJI (SM/KR/KB/KTB) |

---

## API Endpoints

### Autentikasi

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| POST | `/login` | Login pengguna | Publik |
| POST | `/logout` | Logout pengguna | Publik |

**Request Login:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response Login:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "AA001",
    "username": "admin",
    "role": "admin",
    "balai": "BBPJN-VI-Jakarta"
  }
}
```

---

### User Management

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| POST | `/register` | Registrasi user baru | Superadmin |
| GET | `/users` | Daftar semua user | Superadmin |

---

### Lokasi

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/locations` | Semua lokasi | Login |
| GET | `/locations/:id` | Detail lokasi | Login |
| GET | `/locations/options` | Opsi-opsi lokasi | Login |
| POST | `/locations` | Buat lokasi baru | Superadmin |
| PUT | `/locations/:id` | Update lokasi | Superadmin |
| DELETE | `/locations/:id` | Hapus lokasi | Superadmin |

### Source Lokasi

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/locations/:location_id/source` | Ambil source lokasi | Login |
| GET | `/locations/:location_id/source/playable` | URL yang dapat diputar | Login |
| POST | `/locations/:location_id/source` | Buat source baru | Superadmin |
| PUT | `/locations/:location_id/source` | Update source | Superadmin |
| DELETE | `/locations/:location_id/source` | Hapus source | Superadmin |
| GET | `/source-options` | Opsi tipe source | Login |
| GET | `/location-images/*` | Serve gambar lokasi | Publik |

**Format Source Data:**
```json
{
  "source_type": "link",
  "source_data": "https://youtu.be/VIDEO_ID"
}
```

atau

```json
{
  "source_type": "image", 
  "source_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

---

### Kamera

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/cameras` | Semua kamera | Superadmin |
| GET | `/cameras/:id` | Detail kamera | Superadmin |
| GET | `/cameras/lokasi/:lokasi_id` | Kamera per lokasi | Superadmin |
| GET | `/cameras/options` | Opsi tipe kamera | Superadmin |
| POST | `/cameras` | Buat kamera baru | Superadmin |
| PUT | `/cameras/:id` | Update kamera | Superadmin |
| DELETE | `/cameras/:id` | Hapus kamera | Superadmin |

---

### Data Kamera (Penerimaan Data)

Endpoint untuk menerima data dari kamera lalu lintas:

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| POST | `/api/camera/data` | Terima data XML | Publik (dengan API key) |
| POST | `/api/camera/data/json` | Terima XML dalam JSON | Publik (dengan API key) |
| POST | `/api/camera/data/stream` | Terima data stream | Publik (dengan API key) |
| POST | `/api/camera/validate` | Validasi API key | Publik |
| GET | `/api/camera/status/:api_key` | Status kamera | Publik |

**Format XML dari Kamera:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Root>
  <API>your-api-key-here</API>
  <Message Type="TrafficData">
    <Body Type="Interval" IntervalTime="300" Utc="7">
      <Zone ZoneId="1" Occupancy="25.5" Density="15.2">
        <Class ClassNr="1" NumVeh="50" Speed="45.2" GapTime="2.5"/>
        <Class ClassNr="2" NumVeh="30" Speed="55.0" GapTime="3.2"/>
      </Zone>
    </Body>
  </Message>
</Root>
```

---

### Traffic Data

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/traffic-data` | Semua data lalu lintas | Login |
| GET | `/traffic-data/:id` | Detail data | Login |
| GET | `/traffic-data/lokasi/:lokasi_id` | Data per lokasi | Login |
| GET | `/traffic-data/lokasi/:lokasi_id/latest` | Data terbaru | Login |
| POST | `/traffic-data` | Input data manual | Superadmin |
| DELETE | `/traffic-data/:id` | Hapus data | Superadmin |
| DELETE | `/traffic-data/cleanup` | Hapus data lama | Superadmin |

**Query Parameters:**
- `start_time`: Filter waktu mulai (RFC3339)
- `end_time`: Filter waktu akhir (RFC3339)
- `limit`: Batasi jumlah hasil

---

### Traffic Raw Data

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/traffic-raw-data` | Semua raw data | Admin/Superadmin |
| GET | `/traffic-raw-data/:id` | Detail raw data | Admin/Superadmin |
| GET | `/traffic-raw-data/lokasi/:lokasi_id` | Raw data per lokasi | Admin/Superadmin |
| GET | `/traffic-raw-data/unprocessed` | Data belum diproses | Admin/Superadmin |
| GET | `/traffic-raw-data/export-excel` | Export ke Excel | Admin/Superadmin |
| DELETE | `/traffic-raw-data/:id` | Hapus raw data | Superadmin |
| DELETE | `/traffic-raw-data/cleanup` | Hapus data lama | Superadmin |

---

### Analisis MKJI

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/mkji/mapping` | Mapping kelas ke kategori | Publik |
| GET | `/mkji/analysis/:lokasi_id` | Analisis MKJI | Login |
| GET | `/mkji/analysis/:lokasi_id/history` | Riwayat analisis | Login |
| GET | `/mkji/analysis/:lokasi_id/latest` | Analisis terbaru | Login |
| GET | `/mkji/kapasitas/:lokasi_id` | Kapasitas jalan | Login |
| POST | `/mkji/analysis` | Buat analisis manual | Login |

---

### Klasifikasi Kendaraan

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/klasifikasi-kendaraan` | Semua klasifikasi | Superadmin |
| GET | `/klasifikasi-kendaraan/template` | Template klasifikasi | Superadmin |
| POST | `/klasifikasi-kendaraan/init` | Inisialisasi master | Superadmin |
| PUT | `/klasifikasi-kendaraan/bulk` | Update massal | Superadmin |

---

## Middleware

### 1. Protected()
Memastikan request memiliki JWT token yang valid.

```go
// Header yang diperlukan:
Authorization: Bearer <jwt_token>
```

### 2. RestrictTo(roles...)
Membatasi akses berdasarkan role pengguna.

```go
// Contoh penggunaan:
middleware.RestrictTo("admin", "superadmin")
```

---

## Services

### Traffic Collector Service

Service background yang berjalan untuk:
1. **Mengumpulkan data** dari kamera secara berkala berdasarkan interval lokasi
2. **Membersihkan data lama** setiap 24 jam (default: data lebih dari 30 hari)

**Cara Kerja:**
- Membaca interval dari setiap lokasi
- Mengumpulkan data sesuai interval yang dikonfigurasi
- Menyimpan data ke database

---

## Analisis MKJI 1997

Manual Kapasitas Jalan Indonesia 1997 digunakan untuk menghitung:

### Kategori Kendaraan:
| Kategori | Nama | EMP (SMP) |
|----------|------|-----------|
| MC | Sepeda Motor | 0.4 |
| LV | Kendaraan Ringan | 1.0 |
| HV | Kendaraan Berat | 1.3 |
| UM | Tidak Bermotor | 1.0 |

### Rumus Kapasitas:
```
C = Co × FCW × FCSP × FCSF × FCCS
```

Dimana:
- **Co**: Kapasitas dasar (smp/jam)
- **FCW**: Faktor lebar jalur
- **FCSP**: Faktor pemisah arah
- **FCSF**: Faktor hambatan samping
- **FCCS**: Faktor ukuran kota

### Derajat Kejenuhan:
```
DS = Q / C
```

Dimana:
- **Q**: Arus lalu lintas (smp/jam)
- **C**: Kapasitas jalan (smp/jam)

### Tingkat Pelayanan (Level of Service):
| DS | LoS | Keterangan |
|----|-----|------------|
| ≤ 0.35 | A | Arus bebas |
| ≤ 0.54 | B | Arus stabil |
| ≤ 0.77 | C | Arus stabil dengan pembatasan |
| ≤ 0.93 | D | Mendekati arus tidak stabil |
| ≤ 1.00 | E | Arus tidak stabil |
| > 1.00 | F | Arus dipaksakan/macet |

---

## Analisis PKJI 2023

Pedoman Kapasitas Jalan Indonesia 2023 dengan perhitungan yang diperbarui:

### Kategori Kendaraan:
| Kategori | Nama |
|----------|------|
| SM | Sepeda Motor |
| KR | Kendaraan Ringan |
| KB | Kendaraan Berat |
| KTB | Kendaraan Tidak Bermotor |

---

## Cara Menjalankan

### Prasyarat
- Go 1.21 atau lebih baru
- MongoDB 6.0 atau lebih baru

### 1. Setup Environment
```bash
# Copy file .env.example ke .env
cp .env.example .env

# Edit .env sesuai konfigurasi
```

### 2. Install Dependencies
```bash
cd backend
go mod download
```

### 3. Jalankan Seeder (Opsional)
```bash
# Untuk membuat data awal termasuk superadmin
go run cmd/seeder/main.go
```

**Fitur Seeder Superadmin:**
- Membuat superadmin tanpa batas jumlah
- Menggunakan logika upsert (replace jika ID sudah ada)
- Data superadmin selalu konsisten dan terbaru
- Superadmin hanya dapat dibuat melalui seeder (bukan API)

### 4. Jalankan Server
```bash
go run cmd/main.go
```

Server akan berjalan di `http://localhost:8080`

### 5. Menggunakan Docker
```bash
# Build image
docker build -t plato-backend .

# Jalankan container
docker run -p 8080:8080 --env-file .env plato-backend
```

---

## Catatan Penting

1. **API Key Kamera**: API key selalu di-generate oleh sistem dan tidak dapat diubah setelah kamera dibuat.

2. **Source Media Lokasi**: Setiap lokasi dapat memiliki source berupa link YouTube atau gambar. Sistem akan memvalidasi dan memproses data secara otomatis.

3. **Zona Arah**: Konfigurasi zona arah di kamera harus sesuai dengan data yang dikirim. Data zona yang tidak terdaftar akan diabaikan.

4. **Interval Data**: Setiap lokasi dapat memiliki interval pengambilan data yang berbeda (60s - 3600s).

5. **Timezone**: Waktu disimpan berdasarkan `zona_waktu` lokasi atau `Utc` dari data kamera.

6. **Backup Data**: Raw data disimpan terpisah untuk keperluan audit dan re-processing.

7. **Cleanup Gambar**: Sistem otomatis membersihkan gambar lama saat diganti atau lokasi dihapus.

8. **Seeder Superadmin**: Superadmin hanya dapat dibuat melalui seeder dengan logika upsert untuk konsistensi data.

---

## Troubleshooting

### Error: "API key tidak valid"
- Pastikan API key di kamera sudah terdaftar di sistem
- Cek apakah API key tidak kosong

### Error: "Zona arah tidak ditemukan"
- Pastikan konfigurasi zona_arah di kamera sudah lengkap
- Cek log untuk warning zona yang hilang

### Error: "Source type tidak valid"
- Source type hanya menerima `link` atau `image`
- Pastikan format data sesuai: URL untuk link, base64 string untuk image

### Error: "Link YouTube tidak valid"
- Pastikan URL YouTube menggunakan format youtu.be atau youtube.com
- Sistem mendukung berbagai format YouTube (watch, embed, live, dll)

### Error: "Gagal memproses gambar base64"
- Pastikan base64 string valid dan merupakan gambar yang didukung
- Sistem otomatis mengkonversi ke format WebP
- Jika gagal, sistem akan menggunakan gambar placeholder

### Error: "API key tidak dapat diubah"
- API key kamera bersifat immutable setelah dibuat
- Untuk mengubah API key, hapus dan buat kamera baru

### Error: "Superadmin hanya dapat dibuat melalui seeder"
- Superadmin tidak dapat didaftarkan melalui API `/register`
- Gunakan seeder untuk membuat akun superadmin

---

*Dokumentasi ini dibuat untuk Backend PLATO - Sistem Pemantauan Lalu Lintas*
