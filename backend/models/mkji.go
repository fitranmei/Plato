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

type KategoriMKJI string

const (
	KategoriMC KategoriMKJI = "MC"
	KategoriLV KategoriMKJI = "LV"
	KategoriHV KategoriMKJI = "HV"
	KategoriUM KategoriMKJI = "UM"
)

var SMPValues = map[KategoriMKJI]float64{
	KategoriMC: 0.4,
	KategoriLV: 1.0,
	KategoriHV: 1.3,
	KategoriUM: 0.0,
}

var Kelas12ToMKJI = map[int]KategoriMKJI{
	1:  KategoriMC,
	2:  KategoriLV,
	3:  KategoriLV,
	4:  KategoriLV,
	5:  KategoriLV,
	6:  KategoriHV,
	7:  KategoriHV,
	8:  KategoriHV,
	9:  KategoriHV,
	10: KategoriHV,
	11: KategoriUM,
	12: KategoriLV,
}

var KelasPerkotaanToMKJI = map[int]KategoriMKJI{
	1: KategoriMC,
	2: KategoriLV,
	3: KategoriHV,
}

var KelasLuarKotaToMKJI = map[int]KategoriMKJI{
	1: KategoriMC,
	2: KategoriLV,
	3: KategoriLV,
	4: KategoriHV,
	5: KategoriHV,
}

var KelasBebasHambatanToMKJI = map[int]KategoriMKJI{
	1: KategoriLV,
	2: KategoriLV,
	3: KategoriHV,
	4: KategoriHV,
}

type MKJICount struct {
	MC         int     `bson:"mc" json:"mc"`
	LV         int     `bson:"lv" json:"lv"`
	HV         int     `bson:"hv" json:"hv"`
	UM         int     `bson:"um" json:"um"`
	TotalMotor int     `bson:"total_motor" json:"total_motor"`
	TotalSMP   float64 `bson:"total_smp" json:"total_smp"`
}

type MKJIAnalysis struct {
	ID                 string    `bson:"_id" json:"id"`
	LokasiID           string    `bson:"lokasi_id" json:"lokasi_id"`
	NamaLokasi         string    `bson:"nama_lokasi" json:"nama_lokasi"`
	TipeLokasi         string    `bson:"tipe_lokasi" json:"tipe_lokasi"`
	TipeArah           string    `bson:"tipe_arah" json:"tipe_arah"`
	Tanggal            time.Time `bson:"tanggal" json:"tanggal"`
	PeriodeHari        int       `bson:"periode_hari" json:"periode_hari"`
	Timestamp          time.Time `bson:"timestamp" json:"timestamp"`
	MKJICount          MKJICount `bson:"mkji_count" json:"mkji_count"`
	TotalKendaraanHari int       `bson:"total_kendaraan_hari" json:"total_kendaraan_hari"`
	LHR                float64   `bson:"lhr" json:"lhr"`
	LHRSMP             float64   `bson:"lhr_smp" json:"lhr_smp"`
	ArusLaluLintas     float64   `bson:"arus_lalu_lintas" json:"arus_lalu_lintas"`   // Q (smp/jam) - volume jam puncak
	JamPuncak          string    `bson:"jam_puncak" json:"jam_puncak"`               // Jam puncak (misal "07:00-08:00")
	KapasitasDasar     float64   `bson:"kapasitas_dasar" json:"kapasitas_dasar"`     // Co (smp/jam)
	FCW                float64   `bson:"fcw" json:"fcw"`                             // Faktor penyesuaian lebar jalur
	FCSP               float64   `bson:"fcsp" json:"fcsp"`                           // Faktor penyesuaian pemisah arah
	FCSF               float64   `bson:"fcsf" json:"fcsf"`                           // Faktor penyesuaian hambatan samping
	FCCS               float64   `bson:"fccs" json:"fccs"`                           // Faktor penyesuaian ukuran kota
	Kapasitas          float64   `bson:"kapasitas" json:"kapasitas"`                 // C = Co × FCW × FCSP × FCSF × FCCS (smp/jam)
	DerajatKejenuhan   float64   `bson:"derajat_kejenuhan" json:"derajat_kejenuhan"` // DS = Q/C
	TingkatPelayanan   string    `bson:"tingkat_pelayanan" json:"tingkat_pelayanan"` // Level of Service (A-F)
	Keterangan         string    `bson:"keterangan" json:"keterangan"`
}

func GetKategoriMKJI(tipeLokasi string, kelas int) KategoriMKJI {
	switch tipeLokasi {
	case "12_kelas":
		if kategori, ok := Kelas12ToMKJI[kelas]; ok {
			return kategori
		}
	case "perkotaan":
		if kategori, ok := KelasPerkotaanToMKJI[kelas]; ok {
			return kategori
		}
	case "luar_kota":
		if kategori, ok := KelasLuarKotaToMKJI[kelas]; ok {
			return kategori
		}
	case "bebas_hambatan":
		if kategori, ok := KelasBebasHambatanToMKJI[kelas]; ok {
			return kategori
		}
	}
	return KategoriLV
}

func HitungMKJICount(trafficDataList []TrafficData, tipeLokasi string) MKJICount {
	count := MKJICount{}

	for _, td := range trafficDataList {
		for _, za := range td.ZonaArahData {
			for _, kd := range za.KelasData {
				kategori := GetKategoriMKJI(tipeLokasi, kd.Kelas)
				switch kategori {
				case KategoriMC:
					count.MC += kd.JumlahKendaraan
				case KategoriLV:
					count.LV += kd.JumlahKendaraan
				case KategoriHV:
					count.HV += kd.JumlahKendaraan
				case KategoriUM:
					count.UM += kd.JumlahKendaraan
				}
			}
		}
	}

	count.TotalMotor = count.MC + count.LV + count.HV

	count.TotalSMP = float64(count.MC)*SMPValues[KategoriMC] +
		float64(count.LV)*SMPValues[KategoriLV] +
		float64(count.HV)*SMPValues[KategoriHV]

	return count
}

func HitungLHR(totalKendaraan int, jumlahHari int) float64 {
	if jumlahHari <= 0 {
		return 0
	}
	return float64(totalKendaraan) / float64(jumlahHari)
}

func HitungLHRSMP(mkjiCount MKJICount, jumlahHari int) float64 {
	if jumlahHari <= 0 {
		return 0
	}
	return mkjiCount.TotalSMP / float64(jumlahHari)
}

func HitungArusLaluLintas(trafficDataList []TrafficData, tipeLokasi string) (float64, string) {
	if len(trafficDataList) == 0 {
		return 0, ""
	}

	jamData := make(map[string]float64)
	for _, td := range trafficDataList {
		jamKey := td.Timestamp.Format("15:00")

		for _, za := range td.ZonaArahData {
			for _, kd := range za.KelasData {
				kategori := GetKategoriMKJI(tipeLokasi, kd.Kelas)
				smp := SMPValues[kategori]
				jamData[jamKey] += float64(kd.JumlahKendaraan) * smp
			}
		}
	}

	var maxSMP float64
	var jamPuncak string
	for jam, smp := range jamData {
		if smp > maxSMP {
			maxSMP = smp
			jamPuncak = jam
		}
	}

	return maxSMP, jamPuncak
}

func GetKapasitasDasar(tipeArah string, tipeLokasi string) float64 {
	if tipeLokasi == "bebas_hambatan" {
		switch tipeArah {
		case "42d":
			return 2300 * 2
		case "62d":
			return 2300 * 3
		default:
			return 2300 * 2
		}
	}

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
}

func GetFCW(lebarJalur int, tipeArah string) float64 {
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

func GetFCSP(persentase string, tipeArah string) float64 {
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

func GetFCSF(tipeHambatan string, kelasHambatan string, lebarBahu float64) float64 {
	// Tabel FCSF berdasarkan MKJI 1997
	fcsf := map[string]map[string]float64{
		"bahu_jalan": {
			"VL": 1.00,
			"L":  0.98,
			"M":  0.95,
			"H":  0.90,
			"VH": 0.85,
		},
		"kereb": {
			"VL": 0.98,
			"L":  0.95,
			"M":  0.91,
			"H":  0.85,
			"VH": 0.78,
		},
	}

	if tipeMap, ok := fcsf[tipeHambatan]; ok {
		if value, ok := tipeMap[kelasHambatan]; ok {
			return value
		}
	}
	return 0.95
}

func GetFCCS(ukuranKota float64) float64 {
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

func HitungKapasitas(location Location) (float64, float64, float64, float64, float64, float64) {
	co := GetKapasitasDasar(location.Tipe_arah, location.Tipe_lokasi)
	fcw := GetFCW(location.Lebar_jalur, location.Tipe_arah)
	fcsp := GetFCSP(location.Persentase, location.Tipe_arah)
	fcsf := GetFCSF(location.Tipe_hambatan, location.Kelas_hambatan, 1.5)
	fccs := GetFCCS(location.Ukuran_kota)

	kapasitas := co * fcw * fcsp * fcsf * fccs

	return kapasitas, co, fcw, fcsp, fcsf, fccs
}

func HitungDerajatKejenuhan(arusLaluLintas float64, kapasitas float64) float64 {
	if kapasitas <= 0 {
		return 0
	}
	return arusLaluLintas / kapasitas
}

func GetTingkatPelayanan(ds float64) (string, string) {
	switch {
	case ds <= 0.35:
		return "A", "Arus bebas, kecepatan tinggi, kepadatan lalu lintas rendah"
	case ds <= 0.55:
		return "B", "Arus stabil, kecepatan sedikit terbatas oleh lalu lintas"
	case ds <= 0.75:
		return "C", "Arus stabil, kecepatan dan kebebasan bergerak lebih terbatas"
	case ds <= 0.85:
		return "D", "Arus mendekati tidak stabil, kecepatan menurun"
	case ds <= 1.00:
		return "E", "Arus tidak stabil, kecepatan rendah dan bervariasi"
	default:
		return "F", "Arus terhenti, kondisi macet total"
	}
}

func NextMKJIAnalysisID() (string, error) {
	collection := database.DB.Collection("mkji_analysis")

	findOptions := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var last MKJIAnalysis
	err := collection.FindOne(context.Background(), bson.M{}, findOptions).Decode(&last)

	if err != nil {
		return "MKJI-00001", nil
	}

	var lastNum int
	fmt.Sscanf(last.ID, "MKJI-%d", &lastNum)
	return fmt.Sprintf("MKJI-%05d", lastNum+1), nil
}

func CreateMKJIAnalysis(lokasiID string, startTime, endTime time.Time) (*MKJIAnalysis, error) {
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

	mkjiCount := HitungMKJICount(trafficDataList, location.Tipe_lokasi)

	totalKendaraan := 0
	for _, td := range trafficDataList {
		totalKendaraan += td.TotalKendaraan
	}

	lhr := HitungLHR(totalKendaraan, jumlahHari)
	lhrSMP := HitungLHRSMP(mkjiCount, jumlahHari)

	arusLaluLintas, jamPuncak := HitungArusLaluLintas(trafficDataList, location.Tipe_lokasi)

	kapasitas, co, fcw, fcsp, fcsf, fccs := HitungKapasitas(*location)

	ds := HitungDerajatKejenuhan(arusLaluLintas, kapasitas)

	tingkatPelayanan, keterangan := GetTingkatPelayanan(ds)

	id, err := NextMKJIAnalysisID()
	if err != nil {
		return nil, err
	}

	analysis := &MKJIAnalysis{
		ID:                 id,
		LokasiID:           lokasiID,
		NamaLokasi:         location.Nama_lokasi,
		TipeLokasi:         location.Tipe_lokasi,
		TipeArah:           location.Tipe_arah,
		Tanggal:            startTime,
		PeriodeHari:        jumlahHari,
		Timestamp:          time.Now().Add(7 * time.Hour),
		MKJICount:          mkjiCount,
		TotalKendaraanHari: totalKendaraan,
		LHR:                lhr,
		LHRSMP:             lhrSMP,
		ArusLaluLintas:     arusLaluLintas,
		JamPuncak:          jamPuncak,
		KapasitasDasar:     co,
		FCW:                fcw,
		FCSP:               fcsp,
		FCSF:               fcsf,
		FCCS:               fccs,
		Kapasitas:          kapasitas,
		DerajatKejenuhan:   ds,
		TingkatPelayanan:   tingkatPelayanan,
		Keterangan:         keterangan,
	}

	_, err = database.DB.Collection("mkji_analysis").InsertOne(context.Background(), analysis)
	if err != nil {
		return nil, err
	}

	return analysis, nil
}

func GetMKJIAnalysisByLokasiID(lokasiID string) ([]MKJIAnalysis, error) {
	collection := database.DB.Collection("mkji_analysis")

	cursor, err := collection.Find(
		context.Background(),
		bson.M{"lokasi_id": lokasiID},
		options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}

	var analysisList []MKJIAnalysis
	if err = cursor.All(context.Background(), &analysisList); err != nil {
		return nil, err
	}

	return analysisList, nil
}

func GetLatestMKJIAnalysisByLokasiID(lokasiID string) (*MKJIAnalysis, error) {
	collection := database.DB.Collection("mkji_analysis")

	var analysis MKJIAnalysis
	err := collection.FindOne(
		context.Background(),
		bson.M{"lokasi_id": lokasiID},
		options.FindOne().SetSort(bson.D{{Key: "timestamp", Value: -1}}),
	).Decode(&analysis)

	if err != nil {
		return nil, err
	}

	return &analysis, nil
}

func GetMKJIAnalysisByID(id string) (*MKJIAnalysis, error) {
	collection := database.DB.Collection("mkji_analysis")

	var analysis MKJIAnalysis
	err := collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&analysis)
	if err != nil {
		return nil, err
	}

	return &analysis, nil
}

func CalculateMKJIRealtime(lokasiID string, startTime, endTime time.Time) (*MKJIAnalysis, error) {
	location, err := GetLocationByID(lokasiID)
	if err != nil {
		return nil, err
	}

	trafficDataList, err := GetTrafficDataByLokasiID(lokasiID, startTime, endTime)
	if err != nil {
		return nil, err
	}

	if len(trafficDataList) == 0 {
		kapasitas, co, fcw, fcsp, fcsf, fccs := HitungKapasitas(*location)
		return &MKJIAnalysis{
			LokasiID:       lokasiID,
			NamaLokasi:     location.Nama_lokasi,
			TipeLokasi:     location.Tipe_lokasi,
			TipeArah:       location.Tipe_arah,
			KapasitasDasar: co,
			FCW:            fcw,
			FCSP:           fcsp,
			FCSF:           fcsf,
			FCCS:           fccs,
			Kapasitas:      kapasitas,
			Keterangan:     "Tidak ada data traffic untuk periode yang diminta",
		}, nil
	}

	jumlahHari := int(math.Ceil(endTime.Sub(startTime).Hours() / 24))
	if jumlahHari < 1 {
		jumlahHari = 1
	}

	mkjiCount := HitungMKJICount(trafficDataList, location.Tipe_lokasi)

	totalKendaraan := 0
	for _, td := range trafficDataList {
		totalKendaraan += td.TotalKendaraan
	}

	lhr := HitungLHR(totalKendaraan, jumlahHari)
	lhrSMP := HitungLHRSMP(mkjiCount, jumlahHari)

	arusLaluLintas, jamPuncak := HitungArusLaluLintas(trafficDataList, location.Tipe_lokasi)
	kapasitas, co, fcw, fcsp, fcsf, fccs := HitungKapasitas(*location)
	ds := HitungDerajatKejenuhan(arusLaluLintas, kapasitas)
	tingkatPelayanan, keterangan := GetTingkatPelayanan(ds)

	return &MKJIAnalysis{
		LokasiID:           lokasiID,
		NamaLokasi:         location.Nama_lokasi,
		TipeLokasi:         location.Tipe_lokasi,
		TipeArah:           location.Tipe_arah,
		Tanggal:            startTime,
		PeriodeHari:        jumlahHari,
		Timestamp:          time.Now().Add(7 * time.Hour),
		MKJICount:          mkjiCount,
		TotalKendaraanHari: totalKendaraan,
		LHR:                lhr,
		LHRSMP:             lhrSMP,
		ArusLaluLintas:     arusLaluLintas,
		JamPuncak:          jamPuncak,
		KapasitasDasar:     co,
		FCW:                fcw,
		FCSP:               fcsp,
		FCSF:               fcsf,
		FCCS:               fccs,
		Kapasitas:          kapasitas,
		DerajatKejenuhan:   ds,
		TingkatPelayanan:   tingkatPelayanan,
		Keterangan:         keterangan,
	}, nil
}
