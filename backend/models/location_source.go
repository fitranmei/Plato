package models

import (
	"context"
	"fmt"
	"time"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const (
	SourceTypeLink  = "link"  
	SourceTypeImage = "image" 
)

var SourceTypeOptions = []string{SourceTypeLink, SourceTypeImage}

type LocationSource struct {
	ID         string    `bson:"_id" json:"id"`
	LocationID string    `bson:"location_id" json:"location_id"`
	SourceType string    `bson:"source_type" json:"source_type"` 
	SourceData string    `bson:"source_data" json:"source_data"` 
	CreatedAt  time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time `bson:"updated_at" json:"updated_at"`
}

func IsValidSourceType(value string) bool {
	for _, v := range SourceTypeOptions {
		if v == value {
			return true
		}
	}
	return false
}

func NextLocationSourceID() (string, error) {
	collection := database.DB.Collection("location_sources")

	findOptions := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var lastSource LocationSource
	err := collection.FindOne(context.Background(), bson.M{}, findOptions).Decode(&lastSource)

	if err != nil {
		return "SRC-00001", nil
	}

	var lastNum int
	fmt.Sscanf(lastSource.ID, "SRC-%d", &lastNum)
	return fmt.Sprintf("SRC-%05d", lastNum+1), nil
}

// CreateLocationSource creates a new source for a location
// If a source already exists for this location, it will be replaced
func CreateLocationSource(locationID, sourceType, sourceData string) (*LocationSource, error) {
	collection := database.DB.Collection("location_sources")

	// Delete existing source for this location if any
	_, err := collection.DeleteMany(context.Background(), bson.M{"location_id": locationID})
	if err != nil {
		return nil, fmt.Errorf("gagal menghapus source lama: %v", err)
	}

	// Create new source
	id, err := NextLocationSourceID()
	if err != nil {
		return nil, fmt.Errorf("gagal membuat id source: %v", err)
	}

	now := time.Now().Add(7 * time.Hour)
	source := LocationSource{
		ID:         id,
		LocationID: locationID,
		SourceType: sourceType,
		SourceData: sourceData,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	_, err = collection.InsertOne(context.Background(), source)
	if err != nil {
		return nil, fmt.Errorf("gagal menyimpan source: %v", err)
	}

	return &source, nil
}

// GetLocationSource retrieves the source for a specific location
func GetLocationSource(locationID string) (*LocationSource, error) {
	collection := database.DB.Collection("location_sources")

	var source LocationSource
	err := collection.FindOne(context.Background(), bson.M{"location_id": locationID}).Decode(&source)
	if err != nil {
		return nil, err
	}

	return &source, nil
}

// UpdateLocationSource updates an existing source or creates a new one
func UpdateLocationSource(locationID, sourceType, sourceData string) (*LocationSource, error) {
	collection := database.DB.Collection("location_sources")

	// Check if source exists
	var existingSource LocationSource
	err := collection.FindOne(context.Background(), bson.M{"location_id": locationID}).Decode(&existingSource)

	now := time.Now().Add(7 * time.Hour)

	if err != nil {
		// Source doesn't exist, create new one
		return CreateLocationSource(locationID, sourceType, sourceData)
	}

	// Update existing source
	update := bson.M{
		"$set": bson.M{
			"source_type": sourceType,
			"source_data": sourceData,
			"updated_at":  now,
		},
	}

	_, err = collection.UpdateOne(context.Background(), bson.M{"location_id": locationID}, update)
	if err != nil {
		return nil, fmt.Errorf("gagal mengupdate source: %v", err)
	}

	existingSource.SourceType = sourceType
	existingSource.SourceData = sourceData
	existingSource.UpdatedAt = now

	return &existingSource, nil
}

// DeleteLocationSource deletes the source for a specific location
func DeleteLocationSource(locationID string) error {
	collection := database.DB.Collection("location_sources")

	_, err := collection.DeleteMany(context.Background(), bson.M{"location_id": locationID})
	return err
}

// DeleteLocationSourceByID deletes a source by its ID
func DeleteLocationSourceByID(sourceID string) error {
	collection := database.DB.Collection("location_sources")

	_, err := collection.DeleteOne(context.Background(), bson.M{"_id": sourceID})
	return err
}
