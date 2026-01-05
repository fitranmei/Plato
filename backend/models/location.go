package models

import (
	"context"
	"fmt"
	"time"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var (
	TipeLokasiOptions    = []string{"perkotaan", "luar_kota", "bebas_hambatan", "12_kelas"}
	TipeArahOptions      = []string{"22ud", "42d", "42ud", "62d"}
	LebarJalurOptions    = []int{5, 6, 7, 8, 9, 10, 11}
	PersentaseOptions    = []string{"50-50", "55-45", "60-40", "65-35", "70-30"}
	TipeHambatanOptions  = []string{"bahu_jalan", "kereb"}
	KelasHambatanOptions = []string{"VL", "L", "M", "H", "VH"}
	IntervalOptions      = []int{1, 3, 5, 10, 15, 20, 30, 60}
	ProvinsiOptions      = []string{
		"Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi",
		"Sumatera Selatan", "Bengkulu", "Lampung", "Kepulauan Bangka Belitung", "Kepulauan Riau",
		"DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Banten",
		"Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
		"Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
		"Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat",
		"Maluku", "Maluku Utara",
		"Papua", "Papua Barat", "Papua Selatan", "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya",
	}
)

type Location struct {
	ID               string    `bson:"_id" json:"id"`
	UserID           string    `bson:"user_id" json:"user_id"`
	Balai            string    `bson:"balai,omitempty" json:"balai,omitempty"`
	Nama_lokasi      string    `bson:"nama_lokasi" json:"nama_lokasi"`
	Alamat_lokasi    string    `bson:"alamat_lokasi" json:"alamat_lokasi"`
	Tipe_lokasi      string    `bson:"tipe_lokasi" json:"tipe_lokasi"`
	Tipe_arah        string    `bson:"tipe_arah" json:"tipe_arah"`
	Lebar_jalur      int       `bson:"lebar_jalur" json:"lebar_jalur"`
	Persentase       string    `bson:"persentase" json:"persentase"`
	Tipe_hambatan    string    `bson:"tipe_hambatan" json:"tipe_hambatan"`
	Kelas_hambatan   string    `bson:"kelas_hambatan" json:"kelas_hambatan"`
	Ukuran_kota      float64   `bson:"ukuran_kota" json:"ukuran_kota"`
	Latitude         float64   `bson:"latitude" json:"latitude"`
	Longitude        float64   `bson:"longitude" json:"longitude"`
	Zona_waktu       float64   `bson:"zona_waktu" json:"zona_waktu"`
	Interval         int       `bson:"interval" json:"interval"`
	Publik           bool      `bson:"publik" json:"publik"`
	Hide_lokasi      bool      `bson:"hide_lokasi" json:"hide_lokasi"`
	Keterangan       string    `bson:"keterangan" json:"keterangan"`
	Timestamp        time.Time `bson:"timestamp" json:"timestamp"`
	LastDataReceived time.Time `bson:"last_data_received,omitempty" json:"last_data_received,omitempty"`
}

func IsValidTipeLokasi(value string) bool {
	for _, v := range TipeLokasiOptions {
		if v == value {
			return true
		}
	}
	return false
}

func IsValidTipeArah(value string) bool {
	for _, v := range TipeArahOptions {
		if v == value {
			return true
		}
	}
	return false
}

func IsValidLebarJalur(value int) bool {
	for _, v := range LebarJalurOptions {
		if v == value {
			return true
		}
	}
	return false
}

func IsValidPersentase(value string) bool {
	for _, v := range PersentaseOptions {
		if v == value {
			return true
		}
	}
	return false
}

func IsValidTipeHambatan(value string) bool {
	for _, v := range TipeHambatanOptions {
		if v == value {
			return true
		}
	}
	return false
}

func IsValidKelasHambatan(value string) bool {
	for _, v := range KelasHambatanOptions {
		if v == value {
			return true
		}
	}
	return false
}

func IsValidInterval(value int) bool {
	for _, v := range IntervalOptions {
		if v == value {
			return true
		}
	}
	return false
}

func IsValidProvinsi(value string) bool {
	for _, v := range ProvinsiOptions {
		if v == value {
			return true
		}
	}
	return false
}

func NextLocationID() (string, error) {
	collection := database.DB.Collection("locations")

	findOptions := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var lastLocation Location
	err := collection.FindOne(context.Background(), bson.M{}, findOptions).Decode(&lastLocation)

	if err != nil {
		return "LOC-00001", nil
	}

	var lastNum int
	fmt.Sscanf(lastLocation.ID, "LOC-%d", &lastNum)
	return fmt.Sprintf("LOC-%05d", lastNum+1), nil
}

func UpdateLastDataReceived(locationID string, dataTimestamp time.Time) error {
	collection := database.DB.Collection("locations")

	update := bson.M{
		"$set": bson.M{
			"last_data_received": dataTimestamp,
		},
	}

	_, err := collection.UpdateOne(context.Background(), bson.M{"_id": locationID}, update)
	return err
}

func CheckInactiveLocations(inactiveDuration time.Duration) error {
	collection := database.DB.Collection("locations")

	cutoffTime := time.Now().Add(-inactiveDuration)

	filter := bson.M{
		"publik": true,
		"$or": []bson.M{
			{"last_data_received": bson.M{"$lt": cutoffTime}},
			{"last_data_received": bson.M{"$exists": false}},
		},
	}

	update := bson.M{
		"$set": bson.M{
			"publik": false,
		},
	}

	result, err := collection.UpdateMany(context.Background(), filter, update)
	if err != nil {
		return err
	}

	if result.ModifiedCount > 0 {
		fmt.Printf("Set %d locations to non-public due to inactivity\n", result.ModifiedCount)
	}

	return nil
}
