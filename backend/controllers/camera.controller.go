package controllers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"

	"backend/database"
	"backend/models"
)

// API key tidak perlu diisi, akan digenerate otomatis oleh backend.
type CameraRequest struct {
	TipeKamera       string                  `json:"tipe_kamera"`
	ZonaArah         []models.CameraZonaArah `json:"zona_arah"`
	LokasiPenempatan string                  `json:"lokasi_penempatan"`
	APIKey           string                  `json:"api_key"`
	Keterangan       string                  `json:"keterangan"`
	LokasiID         string                  `json:"lokasi_id"`
}

func validateCameraRequest(req CameraRequest) (string, bool) {
	if req.TipeKamera == "" {
		return "Tipe kamera wajib diisi", false
	}
	if !models.IsValidTipeKamera(req.TipeKamera) {
		return "Tipe kamera tidak valid", false
	}
	if errMsg, valid := models.ValidateZonaArahList(req.ZonaArah); !valid {
		return errMsg, false
	}
	if req.LokasiID == "" {
		return "Lokasi ID wajib diisi", false
	}
	// Cek apakah lokasi ada di database
	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": req.LokasiID}).Decode(&location)
	if err != nil {
		return "Lokasi tidak ditemukan", false
	}
	return "", true
}

// Membuat kamera baru, API key akan digenerate otomatis
func CreateCamera(c *fiber.Ctx) error {
	var req CameraRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Request tidak valid"})
	}

	if errMsg, valid := validateCameraRequest(req); !valid {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}

	// Generate ID kamera baru
	id, err := models.NextCameraID()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat ID kamera"})
	}

	for i := range req.ZonaArah {
		idZonaArah := models.GenerateZonaArahID(id, i+1)
		req.ZonaArah[i].IDZonaArah = idZonaArah
		zonaArah := models.ZonaArah{
			ID:   idZonaArah,
			Nama: req.ZonaArah[i].Arah,
		}
		_, err = database.DB.Collection("zona_arah").InsertOne(context.Background(), zonaArah)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat zona arah"})
		}
	}

	// Generate API key unik
	apiKey := uuid.New().String()
	for {
		var existingCamera models.Camera
		err := database.DB.Collection("cameras").FindOne(context.Background(), bson.M{"api_key": apiKey}).Decode(&existingCamera)
		if err != nil {
			break
		}
		apiKey = uuid.New().String()
	}

	camera := models.Camera{
		ID:               id,
		TipeKamera:       req.TipeKamera,
		ZonaArah:         req.ZonaArah,
		LokasiPenempatan: req.LokasiPenempatan,
		APIKey:           apiKey,
		Keterangan:       req.Keterangan,
		LokasiID:         req.LokasiID,
	}

	_, err = database.DB.Collection("cameras").InsertOne(context.Background(), camera)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat kamera"})
	}
	return c.Status(201).JSON(fiber.Map{
		"message": "Kamera berhasil dibuat",
		"data":    camera,
	})
}

// Mengambil semua data kamera, bisa difilter berdasarkan lokasi_id atau tipe_kamera
func GetAllCameras(c *fiber.Ctx) error {
	filter := bson.M{}
	if lokasiID := c.Query("lokasi_id"); lokasiID != "" {
		filter["lokasi_id"] = lokasiID
	}
	if tipeKamera := c.Query("tipe_kamera"); tipeKamera != "" {
		filter["tipe_kamera"] = tipeKamera
	}
	cursor, err := database.DB.Collection("cameras").Find(context.Background(), filter)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil data kamera"})
	}
	var cameras []models.Camera
	if err = cursor.All(context.Background(), &cameras); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal parsing data kamera"})
	}
	return c.JSON(fiber.Map{
		"data":  cameras,
		"count": len(cameras),
	})
}

// Mengambil detail kamera berdasarkan ID
func GetCameraByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var camera models.Camera
	err := database.DB.Collection("cameras").FindOne(context.Background(), bson.M{"_id": id}).Decode(&camera)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Kamera tidak ditemukan"})
	}
	return c.JSON(fiber.Map{"data": camera})
}

// Mengambil semua kamera berdasarkan lokasi ID
func GetCamerasByLokasiID(c *fiber.Ctx) error {
	lokasiID := c.Params("lokasi_id")
	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": lokasiID}).Decode(&location)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Lokasi tidak ditemukan"})
	}
	cursor, err := database.DB.Collection("cameras").Find(context.Background(), bson.M{"lokasi_id": lokasiID})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil data kamera"})
	}
	var cameras []models.Camera
	if err = cursor.All(context.Background(), &cameras); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal parsing data kamera"})
	}
	return c.JSON(fiber.Map{
		"data":  cameras,
		"count": len(cameras),
	})
}

// Mengupdate data kamera (API key tidak bisa diubah)
func UpdateCamera(c *fiber.Ctx) error {
	id := c.Params("id")

	var existingCamera models.Camera
	err := database.DB.Collection("cameras").FindOne(context.Background(), bson.M{"_id": id}).Decode(&existingCamera)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Kamera tidak ditemukan"})
	}

	var req CameraRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Request tidak valid"})
	}

	if errMsg, valid := validateCameraRequest(req); !valid {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}
	// Hapus zona arah lama
	zonaArahList, _ := models.GetZonaArahByCameraID(id)
	for _, za := range zonaArahList {
		database.DB.Collection("zona_arah").DeleteOne(context.Background(), bson.M{"_id": za.ID})
	}

	for i := range req.ZonaArah {
		idZonaArah := models.GenerateZonaArahID(id, i+1)
		req.ZonaArah[i].IDZonaArah = idZonaArah
		zonaArah := models.ZonaArah{
			ID:   idZonaArah,
			Nama: req.ZonaArah[i].Arah,
		}
		_, err = database.DB.Collection("zona_arah").InsertOne(context.Background(), zonaArah)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat zona arah"})
		}
	}

	update := bson.M{
		"$set": bson.M{
			"tipe_kamera":       req.TipeKamera,
			"zona_arah":         req.ZonaArah,
			"lokasi_penempatan": req.LokasiPenempatan,
			"keterangan":        req.Keterangan,
			"lokasi_id":         req.LokasiID,
		},
	}
	_, err = database.DB.Collection("cameras").UpdateOne(context.Background(), bson.M{"_id": id}, update)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengupdate kamera"})
	}
	// Ambil data kamera terbaru
	var updatedCamera models.Camera
	database.DB.Collection("cameras").FindOne(context.Background(), bson.M{"_id": id}).Decode(&updatedCamera)
	return c.JSON(fiber.Map{
		"message": "Kamera berhasil diupdate",
		"data":    updatedCamera,
	})
}

// Menghapus kamera dan seluruh zona arah terkait
func DeleteCamera(c *fiber.Ctx) error {
	id := c.Params("id")

	var existingCamera models.Camera
	err := database.DB.Collection("cameras").FindOne(context.Background(), bson.M{"_id": id}).Decode(&existingCamera)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Kamera tidak ditemukan"})
	}

	// Hapus semua zona arah terkait kamera
	for _, za := range existingCamera.ZonaArah {
		database.DB.Collection("zona_arah").DeleteOne(context.Background(), bson.M{"_id": za.IDZonaArah})
	}

	// Hapus kamera
	_, err = database.DB.Collection("cameras").DeleteOne(context.Background(), bson.M{"_id": id})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus kamera"})
	}
	return c.JSON(fiber.Map{"message": "Kamera berhasil dihapus"})
}

// Mengambil daftar tipe kamera yang tersedia
func GetCameraOptions(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"tipe_kamera": models.TipeKameraOptions,
	})
}
