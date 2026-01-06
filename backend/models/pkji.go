package models

import (
	"context"
	"fmt"
	"math"
	"time"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type KategoriPKJI string

const (
	KategoriSM  KategoriPKJI = "SM"  // Sepeda Motor
	KategoriKR  KategoriPKJI = "KR"  // Kendaraan Ringan
	KategoriKB  KategoriPKJI = "KB"  // Kendaraan Berat
	KategoriKTB KategoriPKJI = "KTB" // Kendaraan Tidak Bermotor
)

var EMPValuesPKJI = map[KategoriPKJI]map[string]float64{
	KategoriSM: {
		"perkotaan":      0.25,
		"luar_kota":      0.5,
		"bebas_hambatan": 0.0,
	},
	KategoriKR: {
		"perkotaan":      1.0,
		"luar_kota":      1.0,
		"bebas_hambatan": 1.0,
	},
	KategoriKB: {
		"perkotaan":      1.2,
		"luar_kota":      1.2,
		"bebas_hambatan": 1.2,
	},
	KategoriKTB: {
		"perkotaan":      0.0,
		"luar_kota":      0.0,
		"bebas_hambatan": 0.0,
	},
}

var Kelas12ToPKJI = map[int]KategoriPKJI{
	1:  KategoriSM,  // Sepeda motor
	2:  KategoriKR,  // Sedan, jeep, station wagon
	3:  KategoriKR,  // Oplet, combi, minibus
	4:  KategoriKR,  // Pick up, micro truck
	5:  KategoriKR,  // Bus kecil
	6:  KategoriKB,  // Bus besar
	7:  KategoriKB,  // Truk 2 sumbu ringan
	8:  KategoriKB,  // Truk 2 sumbu berat
	9:  KategoriKB,  // Truk 3 sumbu
	10: KategoriKB,  // Truk gandengan/trailer
	11: KategoriKTB, // Kendaraan tidak bermotor
	12: KategoriKR,  // Kendaraan lainnya
}

var KelasPerkotaanToPKJI = map[int]KategoriPKJI{
	1: KategoriSM,
	2: KategoriKR,
	3: KategoriKB,
}

var KelasLuarKotaToPKJI = map[int]KategoriPKJI{
	1: KategoriSM,
	2: KategoriKR,
	3: KategoriKR,
	4: KategoriKB,
	5: KategoriKB,
}

var KelasBebasHambatanToPKJI = map[int]KategoriPKJI{
	1: KategoriKR,
	2: KategoriKR,
	3: KategoriKB,
	4: KategoriKB,
}

type PKJICount struct {
	SM         int     `bson:"sm" json:"sm"`
	KR         int     `bson:"kr" json:"kr"`
	KB         int     `bson:"kb" json:"kb"`
	KTB        int     `bson:"ktb" json:"ktb"`
	TotalMotor int     `bson:"total_motor" json:"total_motor"`
	TotalSkr   float64 `bson:"total_skr" json:"total_skr"`
}

type PKJIAnalysis struct {
	ID                 string    `bson:"_id" json:"id"`
	LokasiID           string    `bson:"lokasi_id" json:"lokasi_id"`
	NamaLokasi         string    `bson:"nama_lokasi" json:"nama_lokasi"`
	TipeLokasi         string    `bson:"tipe_lokasi" json:"tipe_lokasi"`
	TipeArah           string    `bson:"tipe_arah" json:"tipe_arah"`
	Tanggal            time.Time `bson:"tanggal" json:"tanggal"`
	PeriodeHari        int       `bson:"periode_hari" json:"periode_hari"`
	Timestamp          time.Time `bson:"timestamp" json:"timestamp"`
	PKJICount          PKJICount `bson:"pkji_count" json:"pkji_count"`
	TotalKendaraanHari int       `bson:"total_kendaraan_hari" json:"total_kendaraan_hari"`
	LHRT               float64   `bson:"lhrt" json:"lhrt"`                             // Lalu lintas Harian Rata-rata Tahunan
	LHRTSkr            float64   `bson:"lhrt_skr" json:"lhrt_skr"`                     // LHRT dalam SKR
	VolumeLaluLintas   float64   `bson:"volume_lalu_lintas" json:"volume_lalu_lintas"` // V (skr/jam)
	JamPuncak          string    `bson:"jam_puncak" json:"jam_puncak"`
	KapasitasDasar     float64   `bson:"kapasitas_dasar" json:"kapasitas_dasar"`     // C0 (skr/jam)
	FCLJ               float64   `bson:"fclj" json:"fclj"`                           // Faktor penyesuaian lebar jalur
	FCPA               float64   `bson:"fcpa" json:"fcpa"`                           // Faktor penyesuaian pemisahan arah
	FCHS               float64   `bson:"fchs" json:"fchs"`                           // Faktor penyesuaian hambatan samping
	FCUK               float64   `bson:"fcuk" json:"fcuk"`                           // Faktor penyesuaian ukuran kota
	Kapasitas          float64   `bson:"kapasitas" json:"kapasitas"`                 // C = C0 × FCLJ × FCPA × FCHS × FCUK
	DerajatKejenuhan   float64   `bson:"derajat_kejenuhan" json:"derajat_kejenuhan"` // DJ = V/C
	TingkatPelayanan   string    `bson:"tingkat_pelayanan" json:"tingkat_pelayanan"` // Level of Service (A-F)
	Keterangan         string    `bson:"keterangan" json:"keterangan"`
}

func GetKategoriPKJI(tipeLokasi string, kelas int) KategoriPKJI {
	switch tipeLokasi {
	case "12_kelas":
		if kategori, ok := Kelas12ToPKJI[kelas]; ok {
			return kategori
		}
	case "perkotaan":
		if kategori, ok := KelasPerkotaanToPKJI[kelas]; ok {
			return kategori
		}
	case "luar_kota":
		if kategori, ok := KelasLuarKotaToPKJI[kelas]; ok {
			return kategori
		}
	case "bebas_hambatan":
		if kategori, ok := KelasBebasHambatanToPKJI[kelas]; ok {
			return kategori
		}
	}
	return KategoriKR
}

func GetEMPPKJI(kategori KategoriPKJI, tipeLokasi string) float64 {
	if empMap, ok := EMPValuesPKJI[kategori]; ok {
		if emp, ok := empMap[tipeLokasi]; ok {
			return emp
		}
	}
	return 1.0
}

func HitungPKJICount(trafficDataList []TrafficData, tipeLokasi string) PKJICount {
	count := PKJICount{}

	for _, td := range trafficDataList {
		for _, za := range td.ZonaArahData {
			for _, kd := range za.KelasData {
				kategori := GetKategoriPKJI(tipeLokasi, kd.Kelas)
				switch kategori {
				case KategoriSM:
					count.SM += kd.JumlahKendaraan
				case KategoriKR:
					count.KR += kd.JumlahKendaraan
				case KategoriKB:
					count.KB += kd.JumlahKendaraan
				case KategoriKTB:
					count.KTB += kd.JumlahKendaraan
				}
			}
		}
	}

	count.TotalMotor = count.SM + count.KR + count.KB

	count.TotalSkr = float64(count.SM)*GetEMPPKJI(KategoriSM, tipeLokasi) +
		float64(count.KR)*GetEMPPKJI(KategoriKR, tipeLokasi) +
		float64(count.KB)*GetEMPPKJI(KategoriKB, tipeLokasi)

	return count
}

func HitungVolumePKJI(trafficDataList []TrafficData, tipeLokasi string) (float64, string) {
	if len(trafficDataList) == 0 {
		return 0, ""
	}

	jamData := make(map[string]float64)
	for _, td := range trafficDataList {
		jamKey := td.Timestamp.Format("15:00")

		for _, za := range td.ZonaArahData {
			for _, kd := range za.KelasData {
				kategori := GetKategoriPKJI(tipeLokasi, kd.Kelas)
				emp := GetEMPPKJI(kategori, tipeLokasi)
				jamData[jamKey] += float64(kd.JumlahKendaraan) * emp
			}
		}
	}

	var maxSkr float64
	var jamPuncak string
	for jam, skr := range jamData {
		if skr > maxSkr {
			maxSkr = skr
			jamPuncak = jam
		}
	}

	return maxSkr, jamPuncak
}

// Kapasitas Dasar (C0) PKJI 2023

func GetKapasitasDasarPKJI(tipeArah string, tipeLokasi string) float64 {
	switch tipeLokasi {
	case "bebas_hambatan":
		switch tipeArah {
		case "42d":
			return 2300 * 2
		case "62d":
			return 2300 * 3
		default:
			return 2300 * 2
		}

	case "perkotaan":
		switch tipeArah {
		case "22ud":
			return 2900
		case "42d":
			return 1650 * 2
		case "42ud":
			return 1500 * 2
		case "62d":
			return 1650 * 3
		default:
			return 2900
		}

	case "luar_kota", "12_kelas":
		switch tipeArah {
		case "22ud":
			return 3100
		case "42d":
			return 1700 * 2
		case "42ud":
			return 1550 * 2
		case "62d":
			return 1700 * 3
		default:
			return 3100
		}

	default:
		return 2900
	}
}

// GetFCLJ - Faktor penyesuaian Lebar Jalur (PKJI 2023)
func GetFCLJ(lebarJalur int, tipeArah string, tipeLokasi string) float64 {
	if tipeLokasi == "bebas_hambatan" {
		switch {
		case lebarJalur <= 5:
			return 0.90
		case lebarJalur == 6:
			return 0.95
		case lebarJalur == 7:
			return 1.00
		case lebarJalur >= 8:
			return 1.03
		default:
			return 1.00
		}
	}

	if tipeArah == "22ud" {
		switch {
		case lebarJalur <= 5:
			return 0.56
		case lebarJalur == 6:
			return 0.87
		case lebarJalur == 7:
			return 1.00
		case lebarJalur >= 8:
			return 1.14
		default:
			return 1.00
		}
	}

	switch {
	case lebarJalur <= 5:
		return 0.69
	case lebarJalur == 6:
		return 0.91
	case lebarJalur == 7:
		return 1.00
	case lebarJalur == 8:
		return 1.04
	case lebarJalur >= 9:
		return 1.08
	default:
		return 1.00
	}
}

// GetFCPA - Faktor penyesuaian Pemisahan Arah (PKJI 2023)
func GetFCPA(persentase string, tipeArah string) float64 {
	if tipeArah == "42d" || tipeArah == "62d" {
		return 1.0
	}

	switch persentase {
	case "50-50":
		return 1.00
	case "55-45":
		return 0.97
	case "60-40":
		return 0.94
	case "65-35":
		return 0.91
	case "70-30":
		return 0.88
	default:
		return 1.00
	}
}

// GetFCHS - Faktor penyesuaian Hambatan Samping (PKJI 2023)
func GetFCHS(tipeHambatan string, kelasHambatan string, tipeLokasi string) float64 {
	if tipeLokasi == "bebas_hambatan" {
		return 1.0
	}

	fchs := map[string]map[string]float64{
		"bahu_jalan": {
			"VL": 1.00,
			"L":  0.97,
			"M":  0.93,
			"H":  0.87,
			"VH": 0.81,
		},
		"kereb": {
			"VL": 0.98,
			"L":  0.94,
			"M":  0.89,
			"H":  0.82,
			"VH": 0.73,
		},
	}

	if tipeMap, ok := fchs[tipeHambatan]; ok {
		if value, ok := tipeMap[kelasHambatan]; ok {
			return value
		}
	}
	return 0.93
}

// GetFCUK - Faktor penyesuaian Ukuran Kota (PKJI 2023)
func GetFCUK(ukuranKota float64, tipeLokasi string) float64 {
	if tipeLokasi != "perkotaan" {
		return 1.0
	}

	switch {
	case ukuranKota < 0.1:
		return 0.86
	case ukuranKota < 0.5:
		return 0.90
	case ukuranKota < 1.0:
		return 0.94
	case ukuranKota < 3.0:
		return 1.00
	default:
		return 1.04
	}
}

// HitungKapasitasPKJI menghitung kapasitas jalan berdasarkan PKJI 2023
func HitungKapasitasPKJI(location Location) (kapasitas, c0, fclj, fcpa, fchs, fcuk float64) {
	c0 = GetKapasitasDasarPKJI(location.Tipe_arah, location.Tipe_lokasi)
	fclj = GetFCLJ(location.Lebar_jalur, location.Tipe_arah, location.Tipe_lokasi)
	fcpa = GetFCPA(location.Persentase, location.Tipe_arah)
	fchs = GetFCHS(location.Tipe_hambatan, location.Kelas_hambatan, location.Tipe_lokasi)
	fcuk = GetFCUK(location.Ukuran_kota, location.Tipe_lokasi)

	switch location.Tipe_lokasi {
	case "perkotaan":
		kapasitas = c0 * fclj * fcpa * fchs * fcuk

	case "luar_kota", "12_kelas":
		fcuk = 1.0
		kapasitas = c0 * fclj * fcpa * fchs

	case "bebas_hambatan":
		fchs = 1.0
		fcuk = 1.0
		kapasitas = c0 * fclj * fcpa

	default:
		kapasitas = c0 * fclj * fcpa * fchs * fcuk
	}

	return
}

// HitungDerajatKejenuhanPKJI menghitung DJ = V/C
func HitungDerajatKejenuhanPKJI(volume float64, kapasitas float64) float64 {
	if kapasitas <= 0 {
		return 0
	}
	return volume / kapasitas
}

// GetTingkatPelayananPKJI mengembalikan tingkat pelayanan berdasarkan PKJI 2023
func GetTingkatPelayananPKJI(dj float64) (string, string) {
	switch {
	case dj <= 0.35:
		return "A", "Kondisi arus bebas, kecepatan tinggi, volume rendah"
	case dj <= 0.54:
		return "B", "Arus stabil, kecepatan mulai dipengaruhi kondisi lalu lintas"
	case dj <= 0.77:
		return "C", "Arus stabil, kecepatan dan gerak kendaraan dikendalikan"
	case dj <= 0.93:
		return "D", "Arus mendekati tidak stabil, kecepatan menurun"
	case dj <= 1.00:
		return "E", "Volume mendekati/pada kapasitas, arus tidak stabil"
	default:
		return "F", "Arus terhenti, terjadi antrian panjang"
	}
}

// NextPKJIAnalysisID generates next PKJI analysis ID
func NextPKJIAnalysisID() (string, error) {
	collection := database.DB.Collection("pkji_analysis")

	findOptions := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var last PKJIAnalysis
	err := collection.FindOne(context.Background(), bson.M{}, findOptions).Decode(&last)

	if err != nil {
		return "PKJI-00001", nil
	}

	var lastNum int
	fmt.Sscanf(last.ID, "PKJI-%d", &lastNum)
	return fmt.Sprintf("PKJI-%05d", lastNum+1), nil
}

// CreatePKJIAnalysis creates a new PKJI analysis
func CreatePKJIAnalysis(lokasiID string, startTime, endTime time.Time) (*PKJIAnalysis, error) {
	location, err := GetLocationByID(lokasiID)
	if err != nil {
		return nil, err
	}

	trafficDataList, err := GetTrafficDataByLokasiID(lokasiID, startTime, endTime)
	if err != nil {
		return nil, err
	}

	if len(trafficDataList) == 0 {
		return nil, fmt.Errorf("tidak ada data traffic untuk periode yang diminta")
	}

	jumlahHari := int(math.Ceil(endTime.Sub(startTime).Hours() / 24))
	if jumlahHari < 1 {
		jumlahHari = 1
	}

	pkjiCount := HitungPKJICount(trafficDataList, location.Tipe_lokasi)
	volume, jamPuncak := HitungVolumePKJI(trafficDataList, location.Tipe_lokasi)
	kapasitas, c0, fclj, fcpa, fchs, fcuk := HitungKapasitasPKJI(*location)
	dj := HitungDerajatKejenuhanPKJI(volume, kapasitas)
	tingkatPelayanan, keterangan := GetTingkatPelayananPKJI(dj)

	totalKendaraanHari := 0
	for _, td := range trafficDataList {
		totalKendaraanHari += td.TotalKendaraan
	}

	lhrt := float64(totalKendaraanHari) / float64(jumlahHari)
	lhrtSkr := pkjiCount.TotalSkr / float64(jumlahHari)

	id, err := NextPKJIAnalysisID()
	if err != nil {
		return nil, err
	}

	analysis := &PKJIAnalysis{
		ID:                 id,
		LokasiID:           lokasiID,
		NamaLokasi:         location.Nama_lokasi,
		TipeLokasi:         location.Tipe_lokasi,
		TipeArah:           location.Tipe_arah,
		Tanggal:            startTime,
		PeriodeHari:        jumlahHari,
		Timestamp:          time.Now(),
		PKJICount:          pkjiCount,
		TotalKendaraanHari: totalKendaraanHari,
		LHRT:               lhrt,
		LHRTSkr:            lhrtSkr,
		VolumeLaluLintas:   volume,
		JamPuncak:          jamPuncak,
		KapasitasDasar:     c0,
		FCLJ:               fclj,
		FCPA:               fcpa,
		FCHS:               fchs,
		FCUK:               fcuk,
		Kapasitas:          kapasitas,
		DerajatKejenuhan:   dj,
		TingkatPelayanan:   tingkatPelayanan,
		Keterangan:         keterangan,
	}

	_, err = database.DB.Collection("pkji_analysis").InsertOne(context.Background(), analysis)
	if err != nil {
		return nil, err
	}

	return analysis, nil
}

// GetPKJIAnalysisByLokasiID retrieves PKJI analyses for a location
func GetPKJIAnalysisByLokasiID(lokasiID string, limit int64) ([]PKJIAnalysis, error) {
	collection := database.DB.Collection("pkji_analysis")

	findOptions := options.Find().
		SetSort(bson.D{{Key: "timestamp", Value: -1}}).
		SetLimit(limit)

	cursor, err := collection.Find(context.Background(), bson.M{"lokasi_id": lokasiID}, findOptions)
	if err != nil {
		return nil, err
	}

	var analyses []PKJIAnalysis
	if err = cursor.All(context.Background(), &analyses); err != nil {
		return nil, err
	}

	return analyses, nil
}
