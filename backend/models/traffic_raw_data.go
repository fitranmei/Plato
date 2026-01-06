package models

import (
	"context"
	"fmt"
	"time"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type AnalysisMethod string

const (
	AnalysisMethodMKJI1997 AnalysisMethod = "MKJI1997"
	AnalysisMethodPKJI2023 AnalysisMethod = "PKJI2023"
)

type RawKelasData struct {
	Kelas           int     `bson:"kelas" json:"kelas"`
	JumlahKendaraan int     `bson:"jumlah_kendaraan" json:"jumlah_kendaraan"`
	Kecepatan       float64 `bson:"kecepatan" json:"kecepatan"`
	GapTime         float64 `bson:"gap_time" json:"gap_time"`
}

type RawZonaData struct {
	IDZonaArah     string         `bson:"id_zona_arah" json:"id_zona_arah"`
	ZonaID         int            `bson:"zona_id" json:"zona_id"`
	NamaArah       string         `bson:"nama_arah" json:"nama_arah"`
	KelasData      []RawKelasData `bson:"kelas_data" json:"kelas_data"`
	TotalKendaraan int            `bson:"total_kendaraan" json:"total_kendaraan"`
	Occupancy      float64        `bson:"occupancy" json:"occupancy"`
	Density        float64        `bson:"density" json:"density"`
	HeadWay        float64        `bson:"headway" json:"headway"`
	Confidence     float64        `bson:"confidence" json:"confidence"`
	Length         float64        `bson:"length" json:"length"`
}

type TrafficRawData struct {
	ID             string        `bson:"_id" json:"id"`
	LokasiID       string        `bson:"lokasi_id" json:"lokasi_id"`
	CameraID       string        `bson:"camera_id" json:"camera_id"`
	Timestamp      time.Time     `bson:"timestamp" json:"timestamp"`
	IntervalDetik  int           `bson:"interval_detik" json:"interval_detik"`
	ZonaData       []RawZonaData `bson:"zona_data" json:"zona_data"`
	TotalKendaraan int           `bson:"total_kendaraan" json:"total_kendaraan"`
	IsProcessed    bool          `bson:"is_processed" json:"is_processed"`
	ProcessedAt    *time.Time    `bson:"processed_at,omitempty" json:"processed_at,omitempty"`
	ProcessedID    string        `bson:"processed_id,omitempty" json:"processed_id,omitempty"` // Reference to TrafficData ID
	CreatedAt      time.Time     `bson:"created_at" json:"created_at"`
}

func NextRawDataID() (string, error) {
	collection := database.DB.Collection("traffic_raw_data")

	findOptions := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var lastData TrafficRawData
	err := collection.FindOne(context.Background(), bson.M{}, findOptions).Decode(&lastData)

	if err != nil {
		return "RAW-00001", nil
	}

	var lastNum int
	fmt.Sscanf(lastData.ID, "RAW-%d", &lastNum)
	return fmt.Sprintf("RAW-%05d", lastNum+1), nil
}

func SaveRawData(lokasiID string, cameraID string, timestamp time.Time, zonaData []RawZonaData, intervalMenit int, totalKendaraan int) (*TrafficRawData, error) {
	collection := database.DB.Collection("traffic_raw_data")

	id, err := NextRawDataID()
	if err != nil {
		return nil, err
	}

	rawData := &TrafficRawData{
		ID:             id,
		LokasiID:       lokasiID,
		CameraID:       cameraID,
		Timestamp:      timestamp,
		IntervalDetik:  intervalMenit * 60,
		ZonaData:       zonaData,
		TotalKendaraan: totalKendaraan,
		IsProcessed:    false,
		CreatedAt:      time.Now(),
	}

	_, err = collection.InsertOne(context.Background(), rawData)
	if err != nil {
		return nil, err
	}

	return rawData, nil
}

func GetUnprocessedRawData(limit int64) ([]TrafficRawData, error) {
	collection := database.DB.Collection("traffic_raw_data")

	findOptions := options.Find().
		SetSort(bson.D{{Key: "timestamp", Value: 1}}).
		SetLimit(limit)

	cursor, err := collection.Find(context.Background(), bson.M{"is_processed": false}, findOptions)
	if err != nil {
		return nil, err
	}

	var rawDataList []TrafficRawData
	if err = cursor.All(context.Background(), &rawDataList); err != nil {
		return nil, err
	}

	return rawDataList, nil
}

func MarkRawDataAsProcessed(rawDataID string, processedID string) error {
	collection := database.DB.Collection("traffic_raw_data")

	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"is_processed": true,
			"processed_at": now,
			"processed_id": processedID,
		},
	}

	_, err := collection.UpdateOne(context.Background(), bson.M{"_id": rawDataID}, update)
	return err
}

func GetRawDataByLokasiID(lokasiID string, startTime, endTime time.Time) ([]TrafficRawData, error) {
	collection := database.DB.Collection("traffic_raw_data")

	filter := bson.M{
		"lokasi_id": lokasiID,
		"timestamp": bson.M{
			"$gte": startTime,
			"$lte": endTime,
		},
	}

	findOptions := options.Find().SetSort(bson.D{{Key: "timestamp", Value: 1}})

	cursor, err := collection.Find(context.Background(), filter, findOptions)
	if err != nil {
		return nil, err
	}

	var rawDataList []TrafficRawData
	if err = cursor.All(context.Background(), &rawDataList); err != nil {
		return nil, err
	}

	return rawDataList, nil
}

func GetRawDataByID(id string) (*TrafficRawData, error) {
	collection := database.DB.Collection("traffic_raw_data")

	var rawData TrafficRawData
	err := collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&rawData)
	if err != nil {
		return nil, err
	}

	return &rawData, nil
}

func DeleteOldRawData(beforeTime time.Time) (int64, error) {
	collection := database.DB.Collection("traffic_raw_data")

	result, err := collection.DeleteMany(context.Background(), bson.M{
		"timestamp":    bson.M{"$lt": beforeTime},
		"is_processed": true,
	})
	if err != nil {
		return 0, err
	}

	return result.DeletedCount, nil
}

func GetRawDataCollection() *mongo.Collection {
	return database.DB.Collection("traffic_raw_data")
}
