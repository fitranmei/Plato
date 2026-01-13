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

// ProcessBase64Image converts base64 image to PNG file using Go native library
// naming format: [INIT]_[LOC-ID]_[TIMESTAMP].png
func ProcessBase64Image(base64Data, locationName, locationID string) (string, error) {
	// 1. Prepare directory
	// Store in backend/public/location_images
	uploadDir := "./public/location_images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %v", err)
	}

	// 2. Decode Base64
	// Remove data URI prefix if present (e.g. "data:image/png;base64,")
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

	// 3. Decode Image (detects PNG/JPEG automatically)
	img, _, err := image.Decode(bytes.NewReader(decoded))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %v", err)
	}

	// 4. Save to PNG (WebP requires CGO/ffmpeg, fallback to pure Go PNG)
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
	// Assuming /images/ route serves ./public/location_images
	return "/images/" + fileName, nil
}

// CleanupOldImage removes the file associated with a source data URL
func CleanupOldImage(sourceData string) {
	// Check if it looks like a local image path
	if strings.HasPrefix(sourceData, "/images/") {
		filename := filepath.Base(sourceData)
		path := filepath.Join("./public/location_images", filename)
		os.Remove(path)
	}
}
