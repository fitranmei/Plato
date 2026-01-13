package utils

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	_ "image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// GetInitials extracts initials from a string (e.g. "Simpang Lima" -> "SL")
func GetInitials(name string) string {
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

	// Remove non-alphanumeric characters
	reg, _ := regexp.Compile("[^a-zA-Z0-9]+")
	initials = reg.ReplaceAllString(initials, "")

	return strings.ToUpper(initials)
}

func ProcessBase64Image(base64Data, locationName, locationID string) (string, error) {
	uploadDir := "./public/location_images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %v", err)
	}

	idx := strings.Index(base64Data, ";base64,")
	var rawData string
	if idx != -1 {
		rawData = base64Data[idx+8:]
	} else {
		rawData = base64Data
	}

	decoded, err := base64.StdEncoding.DecodeString(rawData)
	if err != nil {
		return "", fmt.Errorf("invalid base64 data: %v", err)
	}

	img, _, err := image.Decode(bytes.NewReader(decoded))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %v", err)
	}

	initials := GetInitials(locationName)
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

	// Return public URL path
	// Assuming /api/location-images/ route serves ./public/location_images via Nginx /api/ -> Backend /location-images/
	return "/api/location-images/" + fileName, nil
}

// CleanupOldImage removes the file associated with a source data URL
func CleanupOldImage(sourceData string) {
	// Check if it looks like a local image path (support new and legacy paths)
	if strings.HasPrefix(sourceData, "/api/location-images/") || strings.HasPrefix(sourceData, "/images/") {
		filename := filepath.Base(sourceData)
		path := filepath.Join("./public/location_images", filename)
		os.Remove(path)
	}
}

// GenerateBlankImage creates a blank/placeholder PNG image
// Used when switching from link to image without providing image data
func GenerateBlankImage(locationName, locationID string) (string, error) {
	uploadDir := "./public/location_images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %v", err)
	}

	width, height := 640, 480
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, image.White)
		}
	}

	initials := GetInitials(locationName)
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

	return "/api/location-images/" + fileName, nil
}
