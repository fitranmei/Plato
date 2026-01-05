package models

import (
	"context"
	"fmt"
	"log"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type ZonaArah struct {
	ID   string `bson:"_id" json:"id"`
	Nama string `bson:"nama" json:"nama"`
}

func GenerateZonaArahID(cameraID string, nomor int) string {
	return fmt.Sprintf("ZA-%s-%d", cameraID, nomor)
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

func GetZonaArahByCameraID(cameraID string) ([]ZonaArah, error) {
	cameraCollection := database.DB.Collection("cameras")
	var camera Camera
	err := cameraCollection.FindOne(context.Background(), bson.M{"_id": cameraID}).Decode(&camera)
	if err != nil {
		log.Printf("Error finding camera %s: %v", cameraID, err)
		return nil, err
	}

	log.Printf("Found camera %s with %d zona arah", cameraID, len(camera.ZonaArah))

	zonaArahCollection := database.DB.Collection("zona_arah")
	var zonaArahList []ZonaArah

	for _, cameraZonaArah := range camera.ZonaArah {
		var zonaArah ZonaArah
		err := zonaArahCollection.FindOne(context.Background(), bson.M{"_id": cameraZonaArah.IDZonaArah}).Decode(&zonaArah)
		if err != nil {
			log.Printf("Warning: zona arah %s not found: %v", cameraZonaArah.IDZonaArah, err)
			continue
		}
		zonaArahList = append(zonaArahList, zonaArah)
	}

	log.Printf("Retrieved %d zona arah data for camera %s", len(zonaArahList), cameraID)
	return zonaArahList, nil
}

func IsZonaArahExists(id string) bool {
	_, err := GetZonaArahByID(id)
	return err == nil
}
