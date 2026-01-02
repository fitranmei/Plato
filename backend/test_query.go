package main

import (
	"context"
	"fmt"
	"log"
    "backend/config"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type Location struct {
	ID             string    `bson:"_id" json:"id"`
	Nama_lokasi    string    `bson:"nama_lokasi" json:"nama_lokasi"`
}

func main() {
    cfg := config.Load()
    
    fmt.Printf("Connecting to DB: %s\n", cfg.DBName)

	client, err := mongo.Connect(options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if err = client.Disconnect(context.Background()); err != nil {
			log.Fatal(err)
		}
	}()

	collection := client.Database(cfg.DBName).Collection("locations")

	fmt.Println("Listing all locations:")
	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		log.Fatal(err)
	}
	defer cursor.Close(context.Background())

	count := 0
	for cursor.Next(context.Background()) {
		var loc Location
		if err := cursor.Decode(&loc); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("ID: '%s', Name: '%s'\n", loc.ID, loc.Nama_lokasi)
		count++
	}
	fmt.Printf("Total locations found: %d\n", count)
}