package models

import (
	"context"
	"fmt"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type KlasifikasiKendaraan struct {
	ID                  string  `bson:"_id" json:"id"`
	TipeLokasi          string  `bson:"tipe_lokasi" json:"tipe_lokasi"`
	Kelas               int     `bson:"kelas" json:"kelas"`
	NamaKelas           string  `bson:"nama_kelas" json:"nama_kelas"`
	IsKelasTerakhir     bool    `bson:"is_kelas_terakhir" json:"is_kelas_terakhir"`
	DefaultPanjangAwal  float64 `bson:"default_panjang_awal" json:"default_panjang_awal"`
	DefaultBatasPanjang float64 `bson:"default_batas_panjang" json:"default_batas_panjang"`
}

type KlasifikasiTemplate struct {
	Kelas               int
	NamaKelas           string
	IsKelasTerakhir     bool
	DefaultPanjangAwal  float64
	DefaultBatasPanjang float64
}

func GetKlasifikasiTemplateByTipeLokasi(tipeLokasi string) []KlasifikasiTemplate {
	switch tipeLokasi {
	case "perkotaan":
		return []KlasifikasiTemplate{
			{Kelas: 1, NamaKelas: "Kendaraan Kelas 1", IsKelasTerakhir: false, DefaultPanjangAwal: 0, DefaultBatasPanjang: 2.5},
			{Kelas: 2, NamaKelas: "Kendaraan Kelas 2", IsKelasTerakhir: false, DefaultPanjangAwal: 2.5, DefaultBatasPanjang: 5.5},
			{Kelas: 3, NamaKelas: "Kendaraan Kelas 3", IsKelasTerakhir: true, DefaultPanjangAwal: 5.5, DefaultBatasPanjang: 0},
		}
	case "luar_kota":
		return []KlasifikasiTemplate{
			{Kelas: 1, NamaKelas: "Kendaraan Kelas 1", IsKelasTerakhir: false, DefaultPanjangAwal: 0, DefaultBatasPanjang: 2.5},
			{Kelas: 2, NamaKelas: "Kendaraan Kelas 2", IsKelasTerakhir: false, DefaultPanjangAwal: 2.5, DefaultBatasPanjang: 5.5},
			{Kelas: 3, NamaKelas: "Kendaraan Kelas 3", IsKelasTerakhir: false, DefaultPanjangAwal: 5.5, DefaultBatasPanjang: 9},
			{Kelas: 4, NamaKelas: "Kendaraan Kelas 4", IsKelasTerakhir: false, DefaultPanjangAwal: 9, DefaultBatasPanjang: 12.5},
			{Kelas: 5, NamaKelas: "Kendaraan Kelas 5", IsKelasTerakhir: true, DefaultPanjangAwal: 12.5, DefaultBatasPanjang: 0},
		}
	case "bebas_hambatan":
		return []KlasifikasiTemplate{
			{Kelas: 1, NamaKelas: "Kendaraan Kelas 1", IsKelasTerakhir: false, DefaultPanjangAwal: 0, DefaultBatasPanjang: 5.5},
			{Kelas: 2, NamaKelas: "Kendaraan Kelas 2", IsKelasTerakhir: false, DefaultPanjangAwal: 5.5, DefaultBatasPanjang: 9},
			{Kelas: 3, NamaKelas: "Kendaraan Kelas 3", IsKelasTerakhir: false, DefaultPanjangAwal: 9, DefaultBatasPanjang: 12.5},
			{Kelas: 4, NamaKelas: "Kendaraan Kelas 4", IsKelasTerakhir: true, DefaultPanjangAwal: 12.5, DefaultBatasPanjang: 0},
		}
	case "12_kelas":
		return []KlasifikasiTemplate{
			{Kelas: 1, NamaKelas: "Kendaraan Kelas 1", IsKelasTerakhir: false, DefaultPanjangAwal: 1, DefaultBatasPanjang: 2},
			{Kelas: 2, NamaKelas: "Kendaraan Kelas 2", IsKelasTerakhir: false, DefaultPanjangAwal: 2, DefaultBatasPanjang: 3},
			{Kelas: 3, NamaKelas: "Kendaraan Kelas 3", IsKelasTerakhir: false, DefaultPanjangAwal: 3, DefaultBatasPanjang: 4},
			{Kelas: 4, NamaKelas: "Kendaraan Kelas 4", IsKelasTerakhir: false, DefaultPanjangAwal: 4, DefaultBatasPanjang: 5},
			{Kelas: 5, NamaKelas: "Kendaraan Kelas 5", IsKelasTerakhir: false, DefaultPanjangAwal: 5, DefaultBatasPanjang: 6},
			{Kelas: 6, NamaKelas: "Kendaraan Kelas 6", IsKelasTerakhir: false, DefaultPanjangAwal: 6, DefaultBatasPanjang: 7},
			{Kelas: 7, NamaKelas: "Kendaraan Kelas 7", IsKelasTerakhir: false, DefaultPanjangAwal: 7, DefaultBatasPanjang: 8},
			{Kelas: 8, NamaKelas: "Kendaraan Kelas 8", IsKelasTerakhir: false, DefaultPanjangAwal: 8, DefaultBatasPanjang: 9},
			{Kelas: 9, NamaKelas: "Kendaraan Kelas 9", IsKelasTerakhir: false, DefaultPanjangAwal: 9, DefaultBatasPanjang: 10},
			{Kelas: 10, NamaKelas: "Kendaraan Kelas 10", IsKelasTerakhir: false, DefaultPanjangAwal: 10, DefaultBatasPanjang: 11},
			{Kelas: 11, NamaKelas: "Kendaraan Kelas 11", IsKelasTerakhir: false, DefaultPanjangAwal: 11, DefaultBatasPanjang: 12},
			{Kelas: 12, NamaKelas: "Kendaraan Kelas 12", IsKelasTerakhir: true, DefaultPanjangAwal: 12, DefaultBatasPanjang: 0},
		}
	default:
		return []KlasifikasiTemplate{}
	}
}

func NextKlasifikasiKendaraanID() (string, error) {
	collection := database.DB.Collection("klasifikasi_kendaraan")

	findOptions := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var last KlasifikasiKendaraan
	err := collection.FindOne(context.Background(), bson.M{}, findOptions).Decode(&last)

	if err != nil {
		return "KK-00001", nil
	}

	var lastNum int
	fmt.Sscanf(last.ID, "KK-%d", &lastNum)
	return fmt.Sprintf("KK-%05d", lastNum+1), nil
}

func InitMasterKlasifikasi() error {
	collection := database.DB.Collection("klasifikasi_kendaraan")

	tipeLokasiList := []string{"perkotaan", "luar_kota", "bebas_hambatan", "12_kelas"}

	for _, tipeLokasi := range tipeLokasiList {
		count, err := collection.CountDocuments(context.Background(), bson.M{"tipe_lokasi": tipeLokasi})
		if err != nil {
			return err
		}
		if count > 0 {
			continue
		}

		templates := GetKlasifikasiTemplateByTipeLokasi(tipeLokasi)
		var documents []interface{}

		nextIDStr, err := NextKlasifikasiKendaraanID()
		if err != nil {
			return err
		}
		var nextNum int
		fmt.Sscanf(nextIDStr, "KK-%d", &nextNum)

		for i, template := range templates {
			id := fmt.Sprintf("KK-%05d", nextNum+i)

			klasifikasi := KlasifikasiKendaraan{
				ID:                  id,
				TipeLokasi:          tipeLokasi,
				Kelas:               template.Kelas,
				NamaKelas:           template.NamaKelas,
				IsKelasTerakhir:     template.IsKelasTerakhir,
				DefaultPanjangAwal:  template.DefaultPanjangAwal,
				DefaultBatasPanjang: template.DefaultBatasPanjang,
			}
			documents = append(documents, klasifikasi)
		}

		if len(documents) > 0 {
			_, err = collection.InsertMany(context.Background(), documents)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func GetMasterKlasifikasiByTipeLokasi(tipeLokasi string) ([]KlasifikasiKendaraan, error) {
	collection := database.DB.Collection("klasifikasi_kendaraan")

	cursor, err := collection.Find(context.Background(), bson.M{"tipe_lokasi": tipeLokasi})
	if err != nil {
		return nil, err
	}

	var klasifikasi []KlasifikasiKendaraan
	if err = cursor.All(context.Background(), &klasifikasi); err != nil {
		return nil, err
	}

	return klasifikasi, nil
}

func GetAllMasterKlasifikasi() ([]KlasifikasiKendaraan, error) {
	collection := database.DB.Collection("klasifikasi_kendaraan")

	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		return nil, err
	}

	var klasifikasi []KlasifikasiKendaraan
	if err = cursor.All(context.Background(), &klasifikasi); err != nil {
		return nil, err
	}

	return klasifikasi, nil
}

func UpdateMasterKlasifikasi(id string, update bson.M) error {
	collection := database.DB.Collection("klasifikasi_kendaraan")
	_, err := collection.UpdateOne(context.Background(), bson.M{"_id": id}, update)
	return err
}
