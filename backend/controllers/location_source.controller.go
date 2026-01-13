package controllers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"

	"backend/database"
	"backend/models"
	"backend/utils"
)

type LocationSourceRequest struct {
	SourceType string `json:"source_type"` // "link" or "image"
	SourceData string `json:"source_data"` // URL for link, base64 string for image
}

func validateSourceRequest(req LocationSourceRequest) (string, bool) {
	if req.SourceType == "" {
		return "source_type diperlukan", false
	}

	if !models.IsValidSourceType(req.SourceType) {
		return "source_type tidak valid. Pilihan: 'link' atau 'image'", false
	}

	if req.SourceData == "" {
		return "source_data diperlukan", false
	}

	if req.SourceType == models.SourceTypeLink {
		if len(req.SourceData) < 10 {
			return "link tidak valid", false
		}
	}

	// Validate base64 for "image" type
	if req.SourceType == models.SourceTypeImage {
		// Basic validation - should start with data:image or be a valid base64
		if len(req.SourceData) < 100 {
			return "data gambar base64 tidak valid atau terlalu pendek", false
		}
	}

	return "", true
}

// CreateLocationSource creates or replaces source for a location
func CreateLocationSource(c *fiber.Ctx) error {
	locationID := c.Params("location_id")
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	// Check if location exists
	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": locationID}).Decode(&location)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	// Check access
	if location.UserID != userID && userRole != "superadmin" {
		return c.Status(403).JSON(fiber.Map{"error": "tidak memiliki akses untuk menambah source ke lokasi ini"})
	}

	var req LocationSourceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if errMsg, valid := validateSourceRequest(req); !valid {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}

	finalSourceData := req.SourceData

	// Handle Image: Convert Base64 to WebP File
	if req.SourceType == models.SourceTypeImage {
		// We expect Base64 here
		webPath, err := utils.ProcessBase64Image(req.SourceData, location.Nama_lokasi, locationID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "Gagal memproses gambar",
				"details": err.Error(),
			})
		}
		finalSourceData = webPath
	}

	source, err := models.CreateLocationSource(locationID, req.SourceType, finalSourceData)
	if err != nil {
		// If DB insert fails, maybe cleanup the file?
		if req.SourceType == models.SourceTypeImage {
			utils.CleanupOldImage(finalSourceData)
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "source berhasil ditambahkan",
		"data":    source,
	})
}

// GetLocationSource retrieves source for a location
func GetLocationSource(c *fiber.Ctx) error {
	locationID := c.Params("location_id")
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	// Check if location exists
	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": locationID}).Decode(&location)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	// Check access for non-public locations
	if !location.Publik && userRole != "superadmin" {
		var user models.User
		err := database.DB.Collection("users").FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data user"})
		}
		if location.Balai != user.Balai {
			return c.Status(403).JSON(fiber.Map{"error": "tidak memiliki akses untuk melihat source ini"})
		}
	}

	source, err := models.GetLocationSource(locationID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "source tidak ditemukan untuk lokasi ini"})
	}

	return c.JSON(fiber.Map{"data": source})
}

// UpdateLocationSource updates source for a location
func UpdateLocationSource(c *fiber.Ctx) error {
	locationID := c.Params("location_id")
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	// Check if location exists
	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": locationID}).Decode(&location)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	// Check access
	if location.UserID != userID && userRole != "superadmin" {
		return c.Status(403).JSON(fiber.Map{"error": "tidak memiliki akses untuk mengubah source lokasi ini"})
	}

	var req LocationSourceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if errMsg, valid := validateSourceRequest(req); !valid {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}

	finalSourceData := req.SourceData

	// Handle Image: Convert Base64 to WebP File
	if req.SourceType == models.SourceTypeImage {
		// New image uploaded in Base64
		webPath, err := utils.ProcessBase64Image(req.SourceData, location.Nama_lokasi, locationID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "Gagal memproses gambar",
				"details": err.Error(),
			})
		}
		finalSourceData = webPath

		// Note: Old image cleanup is tricky because UpdateLocationSource replaces data.
		// Ideally we should fetch old source, check if it was image, and delete file.
		// Let's improve this:
		oldSource, _ := models.GetLocationSource(locationID)
		if oldSource != nil && oldSource.SourceType == models.SourceTypeImage {
			utils.CleanupOldImage(oldSource.SourceData)
		}
	} else if req.SourceType == models.SourceTypeLink {
		// If switching to Link, cleanup old image if existed
		oldSource, _ := models.GetLocationSource(locationID)
		if oldSource != nil && oldSource.SourceType == models.SourceTypeImage {
			utils.CleanupOldImage(oldSource.SourceData)
		}
	}

	// This will replace the old source with the new one
	source, err := models.UpdateLocationSource(locationID, req.SourceType, finalSourceData)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "source berhasil diupdate",
		"data":    source,
	})
}

// DeleteLocationSource deletes source for a location
func DeleteLocationSource(c *fiber.Ctx) error {
	locationID := c.Params("location_id")
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	// Check if location exists
	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": locationID}).Decode(&location)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	// Check access
	if location.UserID != userID && userRole != "superadmin" {
		return c.Status(403).JSON(fiber.Map{"error": "tidak memiliki akses untuk menghapus source lokasi ini"})
	}

	// Clean up file if it's an image
	source, _ := models.GetLocationSource(locationID)
	if source != nil && source.SourceType == models.SourceTypeImage {
		utils.CleanupOldImage(source.SourceData)
	}

	err = models.DeleteLocationSource(locationID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menghapus source"})
	}

	return c.JSON(fiber.Map{"message": "source berhasil dihapus"})
}

// GetSourceOptions returns available source type options
func GetSourceOptions(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"source_types": models.SourceTypeOptions,
	})
}
