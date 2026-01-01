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
	MaxZonaArah       = 8
	MinZonaArah       = 1
)

type CameraZonaArah struct {
	IDZonaArah string `bson:"id_zona_arah" json:"id_zona_arah"`
	Arah       string `bson:"arah" json:"arah"`
}

type Camera struct {
	ID               string           `bson:"_id" json:"id"`
	TipeKamera       string           `bson:"tipe_kamera" json:"tipe_kamera"`
	ZonaArah         []CameraZonaArah `bson:"zona_arah" json:"zona_arah"`
	LokasiPenempatan string           `bson:"lokasi_penempatan" json:"lokasi_penempatan"`
	APIKey           string           `bson:"api_key" json:"api_key"`
	Keterangan       string           `bson:"keterangan" json:"keterangan"`
	LokasiID         string           `bson:"lokasi_id" json:"lokasi_id"`
}

func IsValidTipeKamera(value string) bool {
	for _, v := range TipeKameraOptions {
		if v == value {
			return true
		}
	}
	return false
}

func ValidateZonaArahList(zonaArahList []CameraZonaArah) (string, bool) {
	if len(zonaArahList) < MinZonaArah {
		return "minimal harus ada 1 zona arah", false
	}
	if len(zonaArahList) > MaxZonaArah {
		return "maksimal hanya boleh 8 zona arah", false
	}

	seenIDs := make(map[string]bool)
	for i, za := range zonaArahList {
		if za.Arah == "" {
			return fmt.Sprintf("zona_arah[%d].arah tidak boleh kosong", i), false
		}
		if za.IDZonaArah != "" {
			if seenIDs[za.IDZonaArah] {
				return fmt.Sprintf("zona_arah[%d].id_zona_arah duplikat", i), false
			}
			seenIDs[za.IDZonaArah] = true
		}
	}

	return "", true
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
