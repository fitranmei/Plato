package controllers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"

	"backend/database"
	"backend/models"
)

type LocationRequest struct {
	Balai          string  `json:"balai,omitempty"`
	Nama_lokasi    string  `json:"nama_lokasi"`
	Alamat_lokasi  string  `json:"alamat_lokasi"`
	Tipe_lokasi    string  `json:"tipe_lokasi"`
	Tipe_arah      string  `json:"tipe_arah"`
	Lebar_jalur    int     `json:"lebar_jalur"`
	Persentase     string  `json:"persentase"`
	Tipe_hambatan  string  `json:"tipe_hambatan"`
	Kelas_hambatan string  `json:"kelas_hambatan"`
	Ukuran_kota    float64 `json:"ukuran_kota"`
	Latitude       float64 `json:"latitude"`
	Longitude      float64 `json:"longitude"`
	Zona_waktu     float64 `json:"zona_waktu"`
	Interval       int     `json:"interval"`
	Publik         bool    `json:"publik"`
	Hide_lokasi    bool    `json:"hide_lokasi"`
	Keterangan     string  `json:"keterangan"`
}

func validateLocationRequest(req LocationRequest) (string, bool) {
	if req.Nama_lokasi == "" {
		return "nama_lokasi diperlukan", false
	}

	if !models.IsValidBalai(req.Balai) {
		return "balai tidak valid.", false
	}

	if !models.IsValidTipeLokasi(req.Tipe_lokasi) {
		return "tipe_lokasi tidak valid.", false
	}

	if !models.IsValidTipeArah(req.Tipe_arah) {
		return "tipe_arah tidak valid.", false
	}

	if !models.IsValidLebarJalur(req.Lebar_jalur) {
		return "lebar_jalur tidak valid.", false
	}

	if !models.IsValidPersentase(req.Persentase) {
		return "persentase tidak valid.", false
	}

	if !models.IsValidTipeHambatan(req.Tipe_hambatan) {
		return "tipe_hambatan tidak valid.", false
	}

	if !models.IsValidKelasHambatan(req.Kelas_hambatan) {
		return "kelas_hambatan tidak valid.", false
	}

	if !models.IsValidInterval(req.Interval) {
		return "interval tidak valid.", false
	}

	return "", true
}

func CreateLocation(c *fiber.Ctx) error {
	var req LocationRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if errMsg, valid := validateLocationRequest(req); !valid {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}

	userID := c.Locals("user_id").(string)
	userRole := c.Locals("role").(string)

	var user models.User
	err := database.DB.Collection("users").FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data user"})
	}

	var locationBalai string
	if userRole == "superadmin" && req.Balai != "" {
		locationBalai = req.Balai
	} else {
		locationBalai = user.Balai
	}

	id, err := models.NextLocationID()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membuat id lokasi"})
	}

	location := models.Location{
		ID:               id,
		UserID:           userID,
		Balai:            locationBalai,
		Nama_lokasi:      req.Nama_lokasi,
		Alamat_lokasi:    req.Alamat_lokasi,
		Tipe_lokasi:      req.Tipe_lokasi,
		Tipe_arah:        req.Tipe_arah,
		Lebar_jalur:      req.Lebar_jalur,
		Persentase:       req.Persentase,
		Tipe_hambatan:    req.Tipe_hambatan,
		Kelas_hambatan:   req.Kelas_hambatan,
		Ukuran_kota:      req.Ukuran_kota,
		Latitude:         req.Latitude,
		Longitude:        req.Longitude,
		Zona_waktu:       req.Zona_waktu,
		Interval:         req.Interval,
		Publik:           req.Publik,
		Hide_lokasi:      req.Hide_lokasi,
		Keterangan:       req.Keterangan,
		Timestamp:        time.Now(),
		LastDataReceived: time.Now(),
	}

	_, err = database.DB.Collection("locations").InsertOne(context.Background(), location)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membuat lokasi"})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "lokasi berhasil dibuat",
		"data":    location,
	})
}

func GetAllLocations(c *fiber.Ctx) error {
	filter := bson.M{}
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	if userRole != "superadmin" {
		var user models.User
		err := database.DB.Collection("users").FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data user"})
		}
		filter["balai"] = user.Balai
	}

	if userIDQuery := c.Query("user_id"); userIDQuery != "" {
		filter["user_id"] = userIDQuery
	}

	if tipeLokasi := c.Query("tipe_lokasi"); tipeLokasi != "" {
		filter["tipe_lokasi"] = tipeLokasi
	}

	if publik := c.Query("publik"); publik != "" {
		filter["publik"] = publik == "true"
	}

	cursor, err := database.DB.Collection("locations").Find(context.Background(), filter)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data lokasi"})
	}

	var locations []models.Location
	if err = cursor.All(context.Background(), &locations); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal parsing data lokasi"})
	}

	if locations == nil {
		locations = []models.Location{}
	}

	return c.JSON(fiber.Map{
		"data":  locations,
		"count": len(locations),
	})
}

func GetLocationByID(c *fiber.Ctx) error {
	id := c.Params("id")
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	var location models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": id}).Decode(&location)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	if userRole != "superadmin" {
		var user models.User
		err := database.DB.Collection("users").FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data user"})
		}
		if location.Balai != user.Balai {
			return c.Status(403).JSON(fiber.Map{"error": "tidak memiliki akses untuk melihat lokasi ini"})
		}
	}

	return c.JSON(fiber.Map{"data": location})
}

func UpdateLocation(c *fiber.Ctx) error {
	id := c.Params("id")
	userID := c.Locals("user_id").(string)
	userRole := c.Locals("role").(string)

	var existingLocation models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": id}).Decode(&existingLocation)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	if existingLocation.UserID != userID && userRole != "superadmin" {
		return c.Status(403).JSON(fiber.Map{"error": "tidak memiliki akses untuk mengubah lokasi ini"})
	}

	var req LocationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if errMsg, valid := validateLocationRequest(req); !valid {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}

	update := bson.M{
		"$set": bson.M{
			"nama_lokasi":    req.Nama_lokasi,
			"alamat_lokasi":  req.Alamat_lokasi,
			"balai":          req.Balai,
			"tipe_lokasi":    req.Tipe_lokasi,
			"tipe_arah":      req.Tipe_arah,
			"lebar_jalur":    req.Lebar_jalur,
			"persentase":     req.Persentase,
			"tipe_hambatan":  req.Tipe_hambatan,
			"kelas_hambatan": req.Kelas_hambatan,
			"ukuran_kota":    req.Ukuran_kota,
			"latitude":       req.Latitude,
			"longitude":      req.Longitude,
			"zona_waktu":     req.Zona_waktu,
			"interval":       req.Interval,
			"publik":         req.Publik,
			"hide_lokasi":    req.Hide_lokasi,
			"keterangan":     req.Keterangan,
		},
	}

	_, err = database.DB.Collection("locations").UpdateOne(context.Background(), bson.M{"_id": id}, update)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengupdate lokasi"})
	}

	var updatedLocation models.Location
	database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": id}).Decode(&updatedLocation)

	return c.JSON(fiber.Map{
		"message": "lokasi berhasil diupdate",
		"data":    updatedLocation,
	})
}

func DeleteLocation(c *fiber.Ctx) error {
	id := c.Params("id")
	userRole := c.Locals("role").(string)

	var existingLocation models.Location
	err := database.DB.Collection("locations").FindOne(context.Background(), bson.M{"_id": id}).Decode(&existingLocation)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	if userRole != "superadmin" {
		return c.Status(403).JSON(fiber.Map{"error": "tidak memiliki akses untuk menghapus lokasi ini"})
	}

	_, err = database.DB.Collection("locations").DeleteOne(context.Background(), bson.M{"_id": id})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menghapus lokasi"})
	}

	return c.JSON(fiber.Map{"message": "lokasi berhasil dihapus"})
}

func GetLocationOptions(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"tipe_lokasi":    models.TipeLokasiOptions,
		"tipe_arah":      models.TipeArahOptions,
		"lebar_jalur":    models.LebarJalurOptions,
		"persentase":     models.PersentaseOptions,
		"tipe_hambatan":  models.TipeHambatanOptions,
		"kelas_hambatan": models.KelasHambatanOptions,
		"interval":       models.IntervalOptions,
	})
}
