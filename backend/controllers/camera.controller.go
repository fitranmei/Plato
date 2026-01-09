package controllers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"

	"backend/database"
	"backend/models"
)

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
		return "tipe_kamera diperlukan", false
	}

	if !models.IsValidTipeKamera(req.TipeKamera) {
		return "tipe_kamera tidak valid", false
	}

	if errMsg, valid := models.ValidateZonaArahList(req.ZonaArah); !valid {
		return errMsg, false
	}

	if req.LokasiID == "" {
		return "lokasi_id diperlukan", false
	}

	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": req.LokasiID}).Decode(&location)
	if err != nil {
		return "lokasi tidak ditemukan", false
	}

	return "", true
}

func CreateCamera(c *fiber.Ctx) error {
	var req CameraRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if errMsg, valid := validateCameraRequest(req); !valid {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}

	id, err := models.NextCameraID()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membuat id kamera"})
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
			return c.Status(500).JSON(fiber.Map{"error": "gagal membuat zona arah"})
		}
	}

	apiKey := req.APIKey
	if apiKey == "" {
		apiKey = uuid.New().String()
	}

	// Pastikan API key unik
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
		return c.Status(500).JSON(fiber.Map{"error": "gagal membuat kamera"})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "kamera berhasil dibuat",
		"data":    camera,
	})
}

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
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data kamera"})
	}

	var cameras []models.Camera
	if err = cursor.All(context.Background(), &cameras); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal parsing data kamera"})
	}

	return c.JSON(fiber.Map{
		"data":  cameras,
		"count": len(cameras),
	})
}

func GetCameraByID(c *fiber.Ctx) error {
	id := c.Params("id")

	var camera models.Camera
	err := database.DB.Collection("cameras").FindOne(context.Background(), bson.M{"_id": id}).Decode(&camera)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "kamera tidak ditemukan"})
	}

	return c.JSON(fiber.Map{"data": camera})
}

func GetCamerasByLokasiID(c *fiber.Ctx) error {
	lokasiID := c.Params("lokasi_id")

	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": lokasiID}).Decode(&location)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	cursor, err := database.DB.Collection("cameras").Find(context.Background(), bson.M{"lokasi_id": lokasiID})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data kamera"})
	}

	var cameras []models.Camera
	if err = cursor.All(context.Background(), &cameras); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal parsing data kamera"})
	}

	return c.JSON(fiber.Map{
		"data":  cameras,
		"count": len(cameras),
	})
}

func UpdateCamera(c *fiber.Ctx) error {
	id := c.Params("id")

	var existingCamera models.Camera
	err := database.DB.Collection("cameras").FindOne(context.Background(), bson.M{"_id": id}).Decode(&existingCamera)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "kamera tidak ditemukan"})
	}

	var req CameraRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if errMsg, valid := validateCameraRequest(req); !valid {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}

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
			return c.Status(500).JSON(fiber.Map{"error": "gagal membuat zona arah"})
		}
	}

	update := bson.M{
		"$set": bson.M{
			"tipe_kamera":       req.TipeKamera,
			"zona_arah":         req.ZonaArah,
			"lokasi_penempatan": req.LokasiPenempatan,
			"api_key":           req.APIKey,
			"keterangan":        req.Keterangan,
			"lokasi_id":         req.LokasiID,
		},
	}

	_, err = database.DB.Collection("cameras").UpdateOne(context.Background(), bson.M{"_id": id}, update)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengupdate kamera"})
	}

	var updatedCamera models.Camera
	database.DB.Collection("cameras").FindOne(context.Background(), bson.M{"_id": id}).Decode(&updatedCamera)

	return c.JSON(fiber.Map{
		"message": "kamera berhasil diupdate",
		"data":    updatedCamera,
	})
}

func DeleteCamera(c *fiber.Ctx) error {
	id := c.Params("id")

	var existingCamera models.Camera
	err := database.DB.Collection("cameras").FindOne(context.Background(), bson.M{"_id": id}).Decode(&existingCamera)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "kamera tidak ditemukan"})
	}

	for _, za := range existingCamera.ZonaArah {
		database.DB.Collection("zona_arah").DeleteOne(context.Background(), bson.M{"id_zona_arah_camera": za.IDZonaArah})
	}

	_, err = database.DB.Collection("cameras").DeleteOne(context.Background(), bson.M{"_id": id})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menghapus kamera"})
	}

	return c.JSON(fiber.Map{"message": "kamera berhasil dihapus"})
}

func GetCameraOptions(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"tipe_kamera": models.TipeKameraOptions,
	})
}
