package models

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"image"
	_ "image/jpeg"
	"image/png"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	_ "golang.org/x/image/webp" // Support WebP format
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

// UpdateLocationSourceImage updates location source with image from camera XML
// This runs asynchronously when camera sends data with <Image> tag
// Only updates if source type is "image", ignores if source type is "link" (YouTube)
func UpdateLocationSourceImage(locationID, base64Image string) {
	log.Printf("[LocationSource] Attempting to update image for location: %s", locationID)

	// Check existing source - if it's a link type, ignore the image update
	existingSource, _ := GetLocationSource(locationID)
	if existingSource != nil && existingSource.SourceType == SourceTypeLink {
		// Source is YouTube link, don't replace with camera image
		log.Printf("[LocationSource] Skipping update - source type is 'link' for location: %s", locationID)
		return
	}

	// Get location name for file naming
	location, err := GetLocationByID(locationID)
	if err != nil {
		log.Printf("[LocationSource] Failed to get location: %v", err)
		return
	}

	// Process base64 to file
	imagePath, err := processBase64ToImage(base64Image, location.Nama_lokasi, locationID)
	if err != nil {
		log.Printf("[LocationSource] Failed to process image: %v", err)
		return
	}

	// Cleanup old image if needed
	if existingSource != nil && existingSource.SourceType == SourceTypeImage {
		cleanupOldImageFile(existingSource.SourceData)
	}

	// Update or create source
	_, err = UpdateLocationSource(locationID, SourceTypeImage, imagePath)
	if err != nil {
		log.Printf("[LocationSource] Failed to update source: %v", err)
		return
	}

	log.Printf("[LocationSource] Successfully updated image for location %s: %s", locationID, imagePath)
}

// getInitials extracts initials from a string (e.g. "Simpang Lima" -> "SL")
func getInitials(name string) string {
	words := strings.Fields(name)
	initials := ""
	for _, w := range words {
		if len(w) > 0 {
			initials += string(w[0])
		}
	}
	if initials == "" {
		initials = "LOC"
	}

	reg, _ := regexp.Compile("[^a-zA-Z0-9]+")
	initials = reg.ReplaceAllString(initials, "")

	return strings.ToUpper(initials)
}

// processBase64ToImage converts base64 image to PNG file
func processBase64ToImage(base64Data, locationName, locationID string) (string, error) {
	uploadDir := "./public/location_images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %v", err)
	}

	// Clean up whitespace and newlines from base64 data
	base64Data = strings.TrimSpace(base64Data)
	base64Data = strings.ReplaceAll(base64Data, "\n", "")
	base64Data = strings.ReplaceAll(base64Data, "\r", "")
	base64Data = strings.ReplaceAll(base64Data, " ", "")
	base64Data = strings.ReplaceAll(base64Data, "\t", "")

	// Remove data URI prefix if present (supports various image formats)
	var rawData string
	if strings.Contains(base64Data, ";base64,") {
		idx := strings.Index(base64Data, ";base64,")
		rawData = base64Data[idx+8:]
	} else if strings.HasPrefix(base64Data, "data:image/") {
		// Handle case without ;base64, marker
		idx := strings.Index(base64Data, ",")
		if idx != -1 {
			rawData = base64Data[idx+1:]
		} else {
			rawData = base64Data
		}
	} else {
		rawData = base64Data
	}

	log.Printf("[processBase64ToImage] Processing image for location %s, base64 length: %d", locationID, len(rawData))

	decoded, err := base64.StdEncoding.DecodeString(rawData)
	if err != nil {
		return "", fmt.Errorf("invalid base64 data: %v", err)
	}

	img, format, err := image.Decode(bytes.NewReader(decoded))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %v", err)
	}

	log.Printf("[processBase64ToImage] Decoded image format: %s", format)

	initials := getInitials(locationName)
	fileName := fmt.Sprintf("%s_%s_%d.png", initials, locationID, time.Now().Unix())
	outputFile := filepath.Join(uploadDir, fileName)

	f, err := os.Create(outputFile)
	if err != nil {
		return "", fmt.Errorf("failed to create output file: %v", err)
	}
	defer f.Close()

	if err := png.Encode(f, img); err != nil {
		return "", fmt.Errorf("failed to encode png: %v", err)
	}

	return "/images/" + fileName, nil
}

// cleanupOldImageFile removes old image file from disk
func cleanupOldImageFile(sourceData string) {
	if strings.HasPrefix(sourceData, "/images/") {
		filename := filepath.Base(sourceData)
		path := filepath.Join("./public/location_images", filename)
		os.Remove(path)
	}
}

// GenerateBlankImage creates a blank black image for new location with image source type
// Returns the path to the generated image file
func GenerateBlankImage(locationName, locationID string) (string, error) {
	uploadDir := "./public/location_images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %v", err)
	}

	// Create a blank black image (640x480)
	width, height := 640, 480
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	// image.NewRGBA defaults to all zeros (black with zero alpha)
	// We need to set alpha to 255 for visible black
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, image.Black)
		}
	}

	initials := getInitials(locationName)
	fileName := fmt.Sprintf("%s_%s_%d.png", initials, locationID, time.Now().Unix())
	outputFile := filepath.Join(uploadDir, fileName)

	f, err := os.Create(outputFile)
	if err != nil {
		return "", fmt.Errorf("failed to create output file: %v", err)
	}
	defer f.Close()

	if err := png.Encode(f, img); err != nil {
		return "", fmt.Errorf("failed to encode png: %v", err)
	}

	return "/images/" + fileName, nil
}
