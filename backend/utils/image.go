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
	"strings"
	"time"
)

// Mengkonversi gambar base64 ke file PNG
func ProcessBase64Image(base64Data, locationName, locationID string) (string, error) {
	uploadDir := "./public/location_images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("gagal membuat direktori upload: %v", err)
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
		return "", fmt.Errorf("data base64 tidak valid: %v", err)
	}

	img, _, err := image.Decode(bytes.NewReader(decoded))
	if err != nil {
		return "", fmt.Errorf("gagal decode gambar: %v", err)
	}

	fileName := fmt.Sprintf("IMG_%s_%d.png", locationID, time.Now().Unix())
	outputFile := filepath.Join(uploadDir, fileName)

	f, err := os.Create(outputFile)
	if err != nil {
		return "", fmt.Errorf("gagal membuat file output: %v", err)
	}
	defer f.Close()

	if err := png.Encode(f, img); err != nil {
		return "", fmt.Errorf("gagal encode png: %v", err)
	}

	// Return public URL path
	// Assuming /api/location-images/ route serves ./public/location_images via Nginx /api/ -> Backend /location-images/
	return "/api/location-images/" + fileName, nil
}

// Menghapus file gambar lama
func CleanupOldImage(sourceData string) {
	// Check if it looks like a local image path (support new and legacy paths)
	if strings.HasPrefix(sourceData, "/api/location-images/") || strings.HasPrefix(sourceData, "/images/") {
		filename := filepath.Base(sourceData)
		path := filepath.Join("./public/location_images", filename)
		os.Remove(path)
	}
}

// Membuat gambar blank untuk placeholder kosong
func GenerateBlankImage(locationName, locationID string) (string, error) {
	uploadDir := "./public/location_images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("gagal membuat direktori upload: %v", err)
	}

	width, height := 640, 480
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, image.White)
		}
	}

	fileName := fmt.Sprintf("IMG_%s_%d.png", locationID, time.Now().Unix())
	outputFile := filepath.Join(uploadDir, fileName)

	f, err := os.Create(outputFile)
	if err != nil {
		return "", fmt.Errorf("gagal membuat file output: %v", err)
	}
	defer f.Close()

	if err := png.Encode(f, img); err != nil {
		return "", fmt.Errorf("gagal encode png: %v", err)
	}

	return "/api/location-images/" + fileName, nil
}
