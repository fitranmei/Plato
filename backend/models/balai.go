package models

import (
	"backend/database"
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type Balai struct {
	ID   string `bson:"_id" json:"id"`
	Name string `bson:"name" json:"name"`
}

func NextBalaiID() (string, error) {
	collection := database.DB.Collection("balais")

	findOptions := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var last Balai
	err := collection.FindOne(context.Background(), bson.M{}, findOptions).Decode(&last)

	if err != nil {
		return "BLI-01", nil
	}

	var lastNum int
	fmt.Sscanf(last.ID, "BLI-%d", &lastNum)
	return fmt.Sprintf("BLI-%02d", lastNum+1), nil
}

func InitBalais() error {
	collection := database.DB.Collection("balais")

	count, err := collection.CountDocuments(context.Background(), bson.M{})
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	balais := []string{
		"BPJN-I-Banda-Aceh",
		"BBPJN-II-Medan",
		"BBPJN-III-Padang",
		"BPJN-IV-Jambi",
		"BBPJN-V-Palembang",
		"BBPJN-VI-Jakarta",
		"BBPJN-VII-Semarang",
		"BBPJN-VIII-Surabaya",
		"BBPJN-IX-Mataram",
		"BPJN-X-Kupang",
		"BBPJN-XI-Banjarmasin",
		"BBPJN-XII-Balikpapan",
		"BBPJN-XIII-Makassar",
		"BPJN-XIV-Palu",
		"BPJN-XV-Manado",
		"BPJN-XVI-Ambon",
		"BPJN-XVII-Manokwari",
		"BBPJN-XVIII-Jayapura",
		"Balai-Jembatan-Khusus-dan-Terowongan",
		"BPJN-XIX-Bandar-Lampung",
		"BPJN-XX-Pontianak",
		"BPJN-XXI-Kendari",
		"BPJN-XXII-Merauke",
	}

	var documents []interface{}

	nextIDStr, err := NextBalaiID()
	if err != nil {
		return err
	}
	var nextNum int
	fmt.Sscanf(nextIDStr, "BLI-%d", &nextNum)

	for i, name := range balais {
		id := fmt.Sprintf("BLI-%02d", nextNum+i)
		balai := Balai{
			ID:   id,
			Name: name,
		}
		documents = append(documents, balai)
	}

	if len(documents) > 0 {
		_, err = collection.InsertMany(context.Background(), documents)
		if err != nil {
			return err
		}
	}

	return nil
}

func GetAllBalais() ([]Balai, error) {
	collection := database.DB.Collection("balais")

	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		return nil, err
	}

	var balais []Balai
	if err = cursor.All(context.Background(), &balais); err != nil {
		return nil, err
	}

	return balais, nil
}
