package controllers

import (
	"context"
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"

	"backend/database"
	"backend/models"
	"backend/utils"
)

type LocationSourceRequest struct {
	SourceType string `json:"source_type"` // "link" atau "image"
	SourceData string `json:"source_data"` // URL untuk link, string base64 untuk image
}

// Mengecek apakah string adalah URL yang valid (http/https)
func isValidURL(url string) bool {
	lowerURL := strings.ToLower(strings.TrimSpace(url))
	return strings.HasPrefix(lowerURL, "http://") || strings.HasPrefix(lowerURL, "https://")
}

// Mengecek apakah URL adalah link YouTube
func isYouTubeURL(url string) bool {
	lowerURL := strings.ToLower(url)
	return strings.Contains(lowerURL, "youtube.com") || strings.Contains(lowerURL, "youtu.be")
}

// Mengekstrak video ID dari URL YouTube
func extractYouTubeVideoID(url string) string {
	// youtu.be/VIDEO_ID
	if strings.Contains(url, "youtu.be/") {
		re := regexp.MustCompile(`youtu\.be/([a-zA-Z0-9_-]{11})`)
		matches := re.FindStringSubmatch(url)
		if len(matches) > 1 {
			return matches[1]
		}
	}

	// youtube.com/watch?v=VIDEO_ID
	if strings.Contains(url, "youtube.com") {
		re := regexp.MustCompile(`[?&]v=([a-zA-Z0-9_-]{11})`)
		matches := re.FindStringSubmatch(url)
		if len(matches) > 1 {
			return matches[1]
		}

		// youtube.com/embed/VIDEO_ID
		re = regexp.MustCompile(`/embed/([a-zA-Z0-9_-]{11})`)
		matches = re.FindStringSubmatch(url)
		if len(matches) > 1 {
			return matches[1]
		}

		// youtube.com/live/VIDEO_ID
		re = regexp.MustCompile(`/live/([a-zA-Z0-9_-]{11})`)
		matches = re.FindStringSubmatch(url)
		if len(matches) > 1 {
			return matches[1]
		}
	}

	return ""
}

// Validasi data request sumber lokasi
func validateSourceRequest(req LocationSourceRequest, allowEmptyImage bool) (string, bool) {
	if req.SourceType == "" {
		return "source_type diperlukan", false
	}

	if !models.IsValidSourceType(req.SourceType) {
		return "source_type tidak valid. Pilihan: 'link' atau 'image'", false
	}

	if req.SourceData == "" {
		if req.SourceType == models.SourceTypeImage && allowEmptyImage {
			return "", true
		}
		return "source_data diperlukan", false
	}

	if req.SourceType == models.SourceTypeLink {
		if !isValidURL(req.SourceData) {
			return "link harus berupa URL yang valid (http:// atau https://)", false
		}
	}

	// Validate base64 for "image" type
	if req.SourceType == models.SourceTypeImage {
		if len(req.SourceData) < 100 {
			return "data gambar base64 tidak valid atau terlalu pendek", false
		}
	}

	return "", true
}

// Membuat atau mengganti sumber (source) pada lokasi
func CreateLocationSource(c *fiber.Ctx) error {
	locationID := c.Params("location_id")
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": locationID}).Decode(&location)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	if location.UserID != userID && userRole != "superadmin" {
		return c.Status(403).JSON(fiber.Map{"error": "tidak memiliki akses untuk menambah source ke lokasi ini"})
	}

	var req LocationSourceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if errMsg, valid := validateSourceRequest(req, false); !valid {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}

	finalSourceData := req.SourceData

	// Base64 to WebP File
	if req.SourceType == models.SourceTypeImage {
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

// Mengambil data source pada lokasi tertentu
func GetLocationSource(c *fiber.Ctx) error {
	locationID := c.Params("location_id")
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": locationID}).Decode(&location)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

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

// Mengupdate data source pada lokasi tertentu
func UpdateLocationSource(c *fiber.Ctx) error {
	locationID := c.Params("location_id")
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": locationID}).Decode(&location)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	if location.UserID != userID && userRole != "superadmin" {
		return c.Status(403).JSON(fiber.Map{"error": "tidak memiliki akses untuk mengubah source lokasi ini"})
	}

	var req LocationSourceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if errMsg, valid := validateSourceRequest(req, true); !valid {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}

	oldSource, _ := models.GetLocationSource(locationID)

	finalSourceData := req.SourceData

	if req.SourceType == models.SourceTypeImage {
		var webPath string
		var err error

		if req.SourceData == "" {
			webPath, err = utils.GenerateBlankImage(location.Nama_lokasi, locationID)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{
					"error":   "Gagal membuat gambar placeholder",
					"details": err.Error(),
				})
			}
		} else {
			webPath, err = utils.ProcessBase64Image(req.SourceData, location.Nama_lokasi, locationID)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{
					"error":   "Gagal memproses gambar",
					"details": err.Error(),
				})
			}
		}
		finalSourceData = webPath

		if oldSource != nil && oldSource.SourceType == models.SourceTypeImage {
			utils.CleanupOldImage(oldSource.SourceData)
		}
	} else if req.SourceType == models.SourceTypeLink {
		if oldSource != nil && oldSource.SourceType == models.SourceTypeImage {
			utils.CleanupOldImage(oldSource.SourceData)
		}
	}

	// Replace source data di database
	source, err := models.UpdateLocationSource(locationID, req.SourceType, finalSourceData)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "source berhasil diupdate",
		"data":    source,
	})
}

// Menghapus data source pada lokasi tertentu
func DeleteLocationSource(c *fiber.Ctx) error {
	locationID := c.Params("location_id")
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": locationID}).Decode(&location)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	if location.UserID != userID && userRole != "superadmin" {
		return c.Status(403).JSON(fiber.Map{"error": "tidak memiliki akses untuk menghapus source lokasi ini"})
	}

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

// Mengambil daftar tipe source yang tersedia
func GetSourceOptions(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"source_types": models.SourceTypeOptions,
	})
}

// Mengambil URL yang dapat diputar untuk source lokasi
// Untuk YouTube: mengembalikan embed URL
// Untuk Image: mengembalikan path gambar
func GetPlayableURL(c *fiber.Ctx) error {
	locationID := c.Params("location_id")

	source, err := models.GetLocationSource(locationID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "source tidak ditemukan untuk lokasi ini"})
	}

	response := fiber.Map{
		"location_id": locationID,
		"source_type": source.SourceType,
	}

	if source.SourceType == models.SourceTypeImage {
		response["type"] = "image"
		response["url"] = source.SourceData
		return c.JSON(response)
	}

	// Hanya YouTube link saja sekarang
	if isYouTubeURL(source.SourceData) {
		videoID := extractYouTubeVideoID(source.SourceData)
		if videoID != "" {
			response["type"] = "youtube"
			response["url"] = source.SourceData
			response["embed_url"] = "https://www.youtube.com/embed/" + videoID
			response["video_id"] = videoID
		} else {
			response["type"] = "youtube"
			response["url"] = source.SourceData
			response["error"] = "tidak dapat mengekstrak video ID"
		}
	} else {
		// Fallback link lain
		response["type"] = "direct"
		response["url"] = source.SourceData
	}

	return c.JSON(response)
}
