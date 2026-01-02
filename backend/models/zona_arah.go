package models

import (
	"context"
	"fmt"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type ZonaArah struct {
	ID               string `bson:"_id" json:"id"`
	IDZonaArahCamera string `bson:"id_zona_arah_camera" json:"id_zona_arah_camera"`
	Nama             string `bson:"nama" json:"nama"`
}

func NextZonaArahID() (string, error) {
	collection := database.DB.Collection("zona_arah")

	findOptions := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var lastZonaArah ZonaArah
	err := collection.FindOne(context.Background(), bson.M{}, findOptions).Decode(&lastZonaArah)

	if err != nil {
		return "ZAC_00001", nil
	}

	var lastNum int
	fmt.Sscanf(lastZonaArah.ID, "ZAC_%d", &lastNum)
	return fmt.Sprintf("ZAC_%05d", lastNum+1), nil
}

func GetZonaArahByID(id string) (*ZonaArah, error) {
	collection := database.DB.Collection("zona_arah")
	var zonaArah ZonaArah
	err := collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&zonaArah)
	if err != nil {
		return nil, err
	}
	return &zonaArah, nil
}

func GetZonaArahByCameraID(idZonaArahCamera string) (*ZonaArah, error) {
	collection := database.DB.Collection("zona_arah")
	var zonaArah ZonaArah
	err := collection.FindOne(context.Background(), bson.M{"id_zona_arah_camera": idZonaArahCamera}).Decode(&zonaArah)
	if err != nil {
		return nil, err
	}
	return &zonaArah, nil
}

func IsZonaArahExists(id string) bool {
	_, err := GetZonaArahByID(id)
	return err == nil
}

func IsZonaArahCameraExists(idZonaArahCamera string) bool {
	_, err := GetZonaArahByCameraID(idZonaArahCamera)
	return err == nil
}

func GenerateZonaArahCameraID(cameraID string, nomor int) string {
	return fmt.Sprintf("ZA_%s_%d", cameraID, nomor)
}
