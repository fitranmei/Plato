package models

import (
	"context"
	"fmt"
	"time"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type TrafficKelasDetail struct {
	IDKlasifikasi     string  `bson:"id_klasifikasi" json:"id_klasifikasi"`
	NamaKelas         string  `bson:"nama_kelas" json:"nama_kelas"`
	Kelas             int     `bson:"kelas" json:"kelas"`
	JumlahKendaraan   int     `bson:"jumlah_kendaraan" json:"jumlah_kendaraan"`
	KecepatanRataRata float64 `bson:"kecepatan_rata_rata" json:"kecepatan_rata_rata"`
}

type TrafficZonaArahData struct {
	IDZonaArah     string               `bson:"id_zona_arah" json:"id_zona_arah"`
	NamaArah       string               `bson:"nama_arah" json:"nama_arah"`
	KelasData      []TrafficKelasDetail `bson:"kelas_data" json:"kelas_data"`
	TotalKendaraan int                  `bson:"total_kendaraan" json:"total_kendaraan"`
}

type TrafficMKJIAnalysis struct {
	MC               int     `bson:"mc" json:"mc"`                               // Motorcycle (sepeda motor)
	LV               int     `bson:"lv" json:"lv"`                               // Light Vehicle (kendaraan ringan)
	HV               int     `bson:"hv" json:"hv"`                               // Heavy Vehicle (kendaraan berat)
	UM               int     `bson:"um" json:"um"`                               // Unmotorized (tidak bermotor)
	TotalMotor       int     `bson:"total_motor" json:"total_motor"`             // MC + LV + HV
	TotalSMP         float64 `bson:"total_smp" json:"total_smp"`                 // Satuan Mobil Penumpang
	ArusSMP          float64 `bson:"arus_smp" json:"arus_smp"`                   // Q (smp/jam) - dikonversi ke per jam
	KapasitasDasar   float64 `bson:"kapasitas_dasar" json:"kapasitas_dasar"`     // Co
	FCW              float64 `bson:"fcw" json:"fcw"`                             // Faktor lebar jalur
	FCSP             float64 `bson:"fcsp" json:"fcsp"`                           // Faktor pemisah arah
	FCSF             float64 `bson:"fcsf" json:"fcsf"`                           // Faktor hambatan samping
	FCCS             float64 `bson:"fccs" json:"fccs"`                           // Faktor ukuran kota
	Kapasitas        float64 `bson:"kapasitas" json:"kapasitas"`                 // C = Co × FCW × FCSP × FCSF × FCCS
	DerajatKejenuhan float64 `bson:"derajat_kejenuhan" json:"derajat_kejenuhan"` // DS = Q/C
	TingkatPelayanan string  `bson:"tingkat_pelayanan" json:"tingkat_pelayanan"` // Level of Service (A-F)
	Keterangan       string  `bson:"keterangan" json:"keterangan"`               // Deskripsi LoS
}

type TrafficPKJIAnalysis struct {
	SM               int     `bson:"sm" json:"sm"`                               // Sepeda Motor
	KR               int     `bson:"kr" json:"kr"`                               // Kendaraan Ringan
	KB               int     `bson:"kb" json:"kb"`                               // Kendaraan Berat
	KTB              int     `bson:"ktb" json:"ktb"`                             // Kendaraan Tidak Bermotor
	TotalMotor       int     `bson:"total_motor" json:"total_motor"`             // SM + KR + KB
	TotalSKR         float64 `bson:"total_skr" json:"total_skr"`                 // Satuan Kendaraan Ringan
	VolumeSKR        float64 `bson:"volume_skr" json:"volume_skr"`               // V (skr/jam)
	KapasitasDasar   float64 `bson:"kapasitas_dasar" json:"kapasitas_dasar"`     // C0
	FCLJ             float64 `bson:"fclj" json:"fclj"`                           // Faktor lebar jalur
	FCPA             float64 `bson:"fcpa" json:"fcpa"`                           // Faktor pemisahan arah
	FCHS             float64 `bson:"fchs" json:"fchs"`                           // Faktor hambatan samping
	FCUK             float64 `bson:"fcuk" json:"fcuk"`                           // Faktor ukuran kota
	Kapasitas        float64 `bson:"kapasitas" json:"kapasitas"`                 // C = C0 × FCLJ × FCPA × FCHS × FCUK
	DerajatKejenuhan float64 `bson:"derajat_kejenuhan" json:"derajat_kejenuhan"` // DJ = V/C
	TingkatPelayanan string  `bson:"tingkat_pelayanan" json:"tingkat_pelayanan"` // Level of Service (A-F)
	Keterangan       string  `bson:"keterangan" json:"keterangan"`               // Deskripsi LoS
}

type TrafficData struct {
	ID             string                `bson:"_id" json:"id"`
	LokasiID       string                `bson:"lokasi_id" json:"lokasi_id"`
	NamaLokasi     string                `bson:"nama_lokasi" json:"nama_lokasi"`
	TipeLokasi     string                `bson:"tipe_lokasi" json:"tipe_lokasi"`
	Timestamp      time.Time             `bson:"timestamp" json:"timestamp"`
	ZonaArahData   []TrafficZonaArahData `bson:"zona_arah_data" json:"zona_arah_data"`
	TotalKendaraan int                   `bson:"total_kendaraan" json:"total_kendaraan"`
	IntervalMenit  int                   `bson:"interval_menit" json:"interval_menit"`
	RawDataID      string                `bson:"raw_data_id,omitempty" json:"raw_data_id,omitempty"`
	MKJIAnalysis   *TrafficMKJIAnalysis  `bson:"mkji_analysis" json:"mkji_analysis"`
	PKJIAnalysis   *TrafficPKJIAnalysis  `bson:"pkji_analysis" json:"pkji_analysis"`
}

func NextTrafficDataID() (string, error) {
	collection := database.DB.Collection("traffic_data")

	findOptions := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var lastTrafficData TrafficData
	err := collection.FindOne(context.Background(), bson.M{}, findOptions).Decode(&lastTrafficData)

	if err != nil {
		return "TRF_00001", nil
	}

	var lastNum int
	fmt.Sscanf(lastTrafficData.ID, "TRF_%d", &lastNum)
	return fmt.Sprintf("TRF_%05d", lastNum+1), nil
}

func CreateTrafficData(lokasiID string, zonaArahData []TrafficZonaArahData, intervalMenit int) (*TrafficData, error) {
	location, err := GetLocationByID(lokasiID)
	if err != nil {
		return nil, err
	}

	id, err := NextTrafficDataID()
	if err != nil {
		return nil, err
	}

	totalKendaraan := 0
	for _, zaData := range zonaArahData {
		totalKendaraan += zaData.TotalKendaraan
	}

	trafficData := TrafficData{
		ID:             id,
		LokasiID:       lokasiID,
		NamaLokasi:     location.Nama_lokasi,
		TipeLokasi:     location.Tipe_lokasi,
		Timestamp:      time.Now(),
		ZonaArahData:   zonaArahData,
		TotalKendaraan: totalKendaraan,
		IntervalMenit:  intervalMenit,
	}

	_, err = database.DB.Collection("traffic_data").InsertOne(context.Background(), trafficData)
	if err != nil {
		return nil, err
	}

	return &trafficData, nil
}

func GetTrafficDataByLokasiID(lokasiID string, startTime, endTime time.Time) ([]TrafficData, error) {
	collection := database.DB.Collection("traffic_data")

	filter := bson.M{
		"lokasi_id": lokasiID,
		"timestamp": bson.M{
			"$gte": startTime,
			"$lte": endTime,
		},
	}

	cursor, err := collection.Find(context.Background(), filter, options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}))
	if err != nil {
		return nil, err
	}

	var trafficDataList []TrafficData
	if err = cursor.All(context.Background(), &trafficDataList); err != nil {
		return nil, err
	}

	return trafficDataList, nil
}

func GetLatestTrafficDataByLokasiID(lokasiID string) (*TrafficData, error) {
	collection := database.DB.Collection("traffic_data")

	var trafficData TrafficData
	err := collection.FindOne(
		context.Background(),
		bson.M{"lokasi_id": lokasiID},
		options.FindOne().SetSort(bson.D{{Key: "timestamp", Value: -1}}),
	).Decode(&trafficData)

	if err != nil {
		return nil, err
	}

	return &trafficData, nil
}

func GetTrafficDataByID(id string) (*TrafficData, error) {
	collection := database.DB.Collection("traffic_data")

	var trafficData TrafficData
	err := collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&trafficData)
	if err != nil {
		return nil, err
	}

	return &trafficData, nil
}

func DeleteOldTrafficData(beforeTime time.Time) (int64, error) {
	collection := database.DB.Collection("traffic_data")

	result, err := collection.DeleteMany(
		context.Background(),
		bson.M{"timestamp": bson.M{"$lt": beforeTime}},
	)

	if err != nil {
		return 0, err
	}

	return result.DeletedCount, nil
}

func GetLocationByID(id string) (*Location, error) {
	collection := database.DB.Collection("locations")

	var location Location
	err := collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&location)
	if err != nil {
		return nil, err
	}

	return &location, nil
}

type TrafficDataArchive struct {
	ID             string                `bson:"_id" json:"id"`
	LokasiID       string                `bson:"lokasi_id" json:"lokasi_id"`
	NamaLokasi     string                `bson:"nama_lokasi" json:"nama_lokasi"`
	TipeLokasi     string                `bson:"tipe_lokasi" json:"tipe_lokasi"`
	Timestamp      time.Time             `bson:"timestamp" json:"timestamp"`
	ZonaArahData   []TrafficZonaArahData `bson:"zona_arah_data" json:"zona_arah_data"`
	TotalKendaraan int                   `bson:"total_kendaraan" json:"total_kendaraan"`
	IntervalMenit  int                   `bson:"interval_menit" json:"interval_menit"`
	ArchivedAt     time.Time             `bson:"archived_at" json:"archived_at"`
	TahunArsip     int                   `bson:"tahun_arsip" json:"tahun_arsip"`
	BulanArsip     int                   `bson:"bulan_arsip" json:"bulan_arsip"`
}

func ArchiveOldTrafficData(beforeTime time.Time) (int64, error) {
	ctx := context.Background()
	sourceCollection := database.DB.Collection("traffic_data")
	archiveCollection := database.DB.Collection("traffic_data_archive")

	filter := bson.M{"timestamp": bson.M{"$lt": beforeTime}}

	cursor, err := sourceCollection.Find(ctx, filter)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var trafficDataList []TrafficData
	if err = cursor.All(ctx, &trafficDataList); err != nil {
		return 0, err
	}

	if len(trafficDataList) == 0 {
		return 0, nil
	}

	var archiveDocs []interface{}
	for _, td := range trafficDataList {
		archive := TrafficDataArchive{
			ID:             td.ID,
			LokasiID:       td.LokasiID,
			NamaLokasi:     td.NamaLokasi,
			TipeLokasi:     td.TipeLokasi,
			Timestamp:      td.Timestamp,
			ZonaArahData:   td.ZonaArahData,
			TotalKendaraan: td.TotalKendaraan,
			IntervalMenit:  td.IntervalMenit,
			ArchivedAt:     time.Now(),
			TahunArsip:     td.Timestamp.Year(),
			BulanArsip:     int(td.Timestamp.Month()),
		}
		archiveDocs = append(archiveDocs, archive)
	}

	_, err = archiveCollection.InsertMany(ctx, archiveDocs)
	if err != nil {
		return 0, err
	}

	result, err := sourceCollection.DeleteMany(ctx, filter)
	if err != nil {
		return 0, err
	}

	return result.DeletedCount, nil
}

func GetArchivedTrafficData(lokasiID string, tahunArsip int, bulanArsip int) ([]TrafficDataArchive, error) {
	collection := database.DB.Collection("traffic_data_archive")

	filter := bson.M{}
	if lokasiID != "" {
		filter["lokasi_id"] = lokasiID
	}
	if tahunArsip > 0 {
		filter["tahun_arsip"] = tahunArsip
	}
	if bulanArsip > 0 {
		filter["bulan_arsip"] = bulanArsip
	}

	cursor, err := collection.Find(
		context.Background(),
		filter,
		options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}

	var archiveList []TrafficDataArchive
	if err = cursor.All(context.Background(), &archiveList); err != nil {
		return nil, err
	}

	return archiveList, nil
}

func GetArchivedTrafficDataByTimeRange(lokasiID string, startTime, endTime time.Time) ([]TrafficDataArchive, error) {
	collection := database.DB.Collection("traffic_data_archive")

	filter := bson.M{
		"timestamp": bson.M{
			"$gte": startTime,
			"$lte": endTime,
		},
	}
	if lokasiID != "" {
		filter["lokasi_id"] = lokasiID
	}

	cursor, err := collection.Find(
		context.Background(),
		filter,
		options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}

	var archiveList []TrafficDataArchive
	if err = cursor.All(context.Background(), &archiveList); err != nil {
		return nil, err
	}

	return archiveList, nil
}

func GetAvailableArchiveYears(lokasiID string) ([]int, error) {
	collection := database.DB.Collection("traffic_data_archive")

	filter := bson.M{}
	if lokasiID != "" {
		filter["lokasi_id"] = lokasiID
	}

	distinctResult, err := collection.Distinct(context.Background(), "tahun_arsip", filter).Raw()
	if err != nil {
		return nil, err
	}

	var years []int
	if err = bson.Unmarshal(distinctResult, &years); err != nil {
		return nil, err
	}

	return years, nil
}

func GetAvailableArchiveMonths(lokasiID string, tahunArsip int) ([]int, error) {
	collection := database.DB.Collection("traffic_data_archive")

	filter := bson.M{}
	if lokasiID != "" {
		filter["lokasi_id"] = lokasiID
	}
	if tahunArsip > 0 {
		filter["tahun_arsip"] = tahunArsip
	}

	distinctResult, err := collection.Distinct(context.Background(), "bulan_arsip", filter).Raw()
	if err != nil {
		return nil, err
	}

	var months []int
	if err = bson.Unmarshal(distinctResult, &months); err != nil {
		return nil, err
	}

	return months, nil
}
