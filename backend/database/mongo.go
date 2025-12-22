package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

var Client *mongo.Client
var DB *mongo.Database

func Connect(mongoURI string, dbName string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(
		options.Client().ApplyURI(mongoURI),
	)
	if err != nil {
		log.Fatal("gagal konek ke MongoDB:", err)
	}

	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		log.Fatal("MongoDB tidak merespon:", err)
	}

	Client = client
	DB = client.Database(dbName)

	log.Println("MongoDB v2 berhasil terkoneksi")
}

func CreateIndexes() {
	ctx := context.Background()

	userModel := mongo.IndexModel{
		Keys: bson.D{
			{Key: "username", Value: 1},
			{Key: "email", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	}

	_, err := DB.Collection("users").Indexes().CreateOne(ctx, userModel)
	if err != nil {
		log.Printf("Gagal membuat index user: %v", err)
	} else {
		log.Println("Index user berhasil dipastikan (username & email unique)")
	}

	tokenModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "token", Value: 1}},
		Options: options.Index().SetUnique(true),
	}

	_, err = DB.Collection("active_tokens").Indexes().CreateOne(ctx, tokenModel)
	if err != nil {
		log.Printf("Gagal membuat index token: %v", err)
	} else {
		log.Println("Index token berhasil dipastikan")
	}
}
