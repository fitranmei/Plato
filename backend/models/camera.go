package models

import (
	"context"
	"fmt"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var (
	TipeKameraOptions = []string{"trafficam", "x_stream", "thermicam", "cctv"}
	ZonaIDOptions     = []int{1, 2, 3, 4, 5, 6, 7, 8}
)

type Camera struct {
	ID               string `bson:"_id" json:"id"`
	TipeKamera       string `bson:"tipe_kamera" json:"tipe_kamera"`
	Arah1            string `bson:"arah_1" json:"arah_1"`
	IDZonaArah1      int    `bson:"id_zona_arah_1" json:"id_zona_arah_1"`
	Arah2            string `bson:"arah_2" json:"arah_2"`
	IDZonaArah2      int    `bson:"id_zona_arah_2" json:"id_zona_arah_2"`
	LokasiPenempatan string `bson:"lokasi_penempatan" json:"lokasi_penempatan"`
	APIKey           string `bson:"api_key" json:"api_key"`
	Keterangan       string `bson:"keterangan" json:"keterangan"`
	LokasiID         string `bson:"lokasi_id" json:"lokasi_id"`
}

func IsValidTipeKamera(value string) bool {
	for _, v := range TipeKameraOptions {
		if v == value {
			return true
		}
	}
	return false
}

func IsValidZonaID(value int) bool {
	for _, v := range ZonaIDOptions {
		if v == value {
			return true
		}
	}
	return false
}

func NextCameraID() (string, error) {
	collection := database.DB.Collection("cameras")

	findOptions := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var lastCamera Camera
	err := collection.FindOne(context.Background(), bson.M{}, findOptions).Decode(&lastCamera)

	if err != nil {
		return "CAM-00001", nil
	}

	var lastNum int
	fmt.Sscanf(lastCamera.ID, "CAM-%d", &lastNum)
	return fmt.Sprintf("CAM-%05d", lastNum+1), nil
}
