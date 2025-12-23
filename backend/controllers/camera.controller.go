package controllers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"

	"backend/database"
	"backend/models"
)

type CameraRequest struct {
	TipeKamera       string `json:"tipe_kamera"`
	Arah1            string `json:"arah_1"`
	IDZonaArah1      int    `json:"id_zona_arah_1"`
	Arah2            string `json:"arah_2"`
	IDZonaArah2      int    `json:"id_zona_arah_2"`
	LokasiPenempatan string `json:"lokasi_penempatan"`
	APIKey           string `json:"api_key"`
	Keterangan       string `json:"keterangan"`
	LokasiID         string `json:"lokasi_id"`
}

func validateCameraRequest(req CameraRequest) (string, bool) {
	if req.TipeKamera == "" {
		return "tipe_kamera diperlukan", false
	}

	if !models.IsValidTipeKamera(req.TipeKamera) {
		return "tipe_kamera tidak valid", false
	}

	if req.IDZonaArah1 != 0 && !models.IsValidZonaID(req.IDZonaArah1) {
		return "id_zona_arah_1 harus antara 1-8", false
	}

	if req.IDZonaArah2 != 0 && !models.IsValidZonaID(req.IDZonaArah2) {
		return "id_zona_arah_2 harus antara 1-8", false
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

	camera := models.Camera{
		ID:               id,
		TipeKamera:       req.TipeKamera,
		Arah1:            req.Arah1,
		IDZonaArah1:      req.IDZonaArah1,
		Arah2:            req.Arah2,
		IDZonaArah2:      req.IDZonaArah2,
		LokasiPenempatan: req.LokasiPenempatan,
		APIKey:           req.APIKey,
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

	update := bson.M{
		"$set": bson.M{
			"tipe_kamera":       req.TipeKamera,
			"arah_1":            req.Arah1,
			"id_zona_arah_1":    req.IDZonaArah1,
			"arah_2":            req.Arah2,
			"id_zona_arah_2":    req.IDZonaArah2,
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
