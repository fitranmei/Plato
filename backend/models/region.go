package models

import (
	"backend/database"
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type Region struct {
	ID   string `bson:"_id" json:"id"`
	Name string `bson:"name" json:"name"`
}

func NextRegionID() (string, error) {
	collection := database.DB.Collection("regions")

	findOptions := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var last Region
	err := collection.FindOne(context.Background(), bson.M{}, findOptions).Decode(&last)

	if err != nil {
		return "REG-01", nil
	}

	var lastNum int
	fmt.Sscanf(last.ID, "REG-%d", &lastNum)
	return fmt.Sprintf("REG-%02d", lastNum+1), nil
}

func InitRegions() error {
	collection := database.DB.Collection("regions")

	count, err := collection.CountDocuments(context.Background(), bson.M{})
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	provinces := []string{
		"Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi",
		"Sumatera Selatan", "Bengkulu", "Lampung", "Kepulauan Bangka Belitung", "Kepulauan Riau",
		"DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Banten",
		"Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
		"Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
		"Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat",
		"Maluku", "Maluku Utara",
		"Papua", "Papua Barat", "Papua Selatan", "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya",
	}

	var documents []interface{}

	nextIDStr, err := NextRegionID()
	if err != nil {
		return err
	}
	var nextNum int
	fmt.Sscanf(nextIDStr, "REG-%d", &nextNum)

	for i, name := range provinces {
		id := fmt.Sprintf("REG-%02d", nextNum+i)
		region := Region{
			ID:   id,
			Name: name,
		}
		documents = append(documents, region)
	}

	if len(documents) > 0 {
		_, err = collection.InsertMany(context.Background(), documents)
		if err != nil {
			return err
		}
	}

	return nil
}

func GetAllRegions() ([]Region, error) {
	collection := database.DB.Collection("regions")

	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		return nil, err
	}

	var regions []Region
	if err = cursor.All(context.Background(), &regions); err != nil {
		return nil, err
	}

	return regions, nil
}
