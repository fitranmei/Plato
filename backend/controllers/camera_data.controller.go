package controllers

import (
	"io"
	"log"

	"backend/models"

	"github.com/gofiber/fiber/v2"
)

// Menerima data XML dari kamera dalam format JSON
type CameraDataRequest struct {
	XMLData string `json:"xml_data"`
}

// Menerima data XML dari kamera melalui body request
func ReceiveCameraData(c *fiber.Ctx) error {
	xmlData := string(c.Body())
	if xmlData == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Data XML tidak boleh kosong",
			"success": false,
		})
	}

	log.Printf("Data kamera diterima: %d bytes", len(xmlData))
	trafficData, err := models.ProcessCameraData(xmlData)
	if err != nil {
		log.Printf("Gagal memproses data kamera: %v", err)
		return c.Status(400).JSON(fiber.Map{
			"error":   err.Error(),
			"success": false,
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"success": true,
		"message": "Data traffic berhasil diterima dan disimpan",
		"data": fiber.Map{
			"id":              trafficData.ID,
			"lokasi_id":       trafficData.LokasiID,
			"nama_lokasi":     trafficData.NamaLokasi,
			"total_kendaraan": trafficData.TotalKendaraan,
			"timestamp":       trafficData.Timestamp,
			"mkji_analysis":   trafficData.MKJIAnalysis,
			"pkji_analysis":   trafficData.PKJIAnalysis,
		},
	})
}

// Menerima data XML dari kamera dalam format JSON
func ReceiveCameraDataJSON(c *fiber.Ctx) error {
	var req CameraDataRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Format request tidak valid",
			"success": false,
		})
	}
	if req.XMLData == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "xml_data tidak boleh kosong",
			"success": false,
		})
	}
	log.Printf("Data kamera diterima (JSON wrapper): %d bytes", len(req.XMLData))
	trafficData, err := models.ProcessCameraData(req.XMLData)
	if err != nil {
		log.Printf("Gagal memproses data kamera: %v", err)
		return c.Status(400).JSON(fiber.Map{
			"error":   err.Error(),
			"success": false,
		})
	}
	return c.Status(201).JSON(fiber.Map{
		"success": true,
		"message": "data traffic berhasil diterima dan disimpan",
		"data": fiber.Map{
			"id":              trafficData.ID,
			"lokasi_id":       trafficData.LokasiID,
			"nama_lokasi":     trafficData.NamaLokasi,
			"total_kendaraan": trafficData.TotalKendaraan,
			"timestamp":       trafficData.Timestamp,
			"mkji_analysis":   trafficData.MKJIAnalysis,
			"pkji_analysis":   trafficData.PKJIAnalysis,
		},
	})
}

// Menerima data XML dari kamera melalui stream
func ReceiveCameraDataStream(c *fiber.Ctx) error {
	body, err := io.ReadAll(c.Request().BodyStream())
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Gagal membaca data stream",
			"success": false,
		})
	}
	xmlData := string(body)
	if xmlData == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Data XML tidak boleh kosong",
			"success": false,
		})
	}
	log.Printf("Data kamera diterima (stream): %d bytes", len(xmlData))
	trafficData, err := models.ProcessCameraData(xmlData)
	if err != nil {
		log.Printf("Gagal memproses data kamera: %v", err)
		return c.Status(400).JSON(fiber.Map{
			"error":   err.Error(),
			"success": false,
		})
	}
	return c.Status(201).JSON(fiber.Map{
		"success": true,
		"message": "data traffic berhasil diterima dan disimpan",
		"data": fiber.Map{
			"id":              trafficData.ID,
			"lokasi_id":       trafficData.LokasiID,
			"nama_lokasi":     trafficData.NamaLokasi,
			"total_kendaraan": trafficData.TotalKendaraan,
			"timestamp":       trafficData.Timestamp,
			"mkji_analysis":   trafficData.MKJIAnalysis,
			"pkji_analysis":   trafficData.PKJIAnalysis,
		},
	})
}

// Validasi API key kamera
func ValidateCameraAPIKey(c *fiber.Ctx) error {
	type ValidateRequest struct {
		APIKey string `json:"api_key"`
	}
	var req ValidateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Format request tidak valid",
			"success": false,
		})
	}
	if req.APIKey == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "api_key tidak boleh kosong",
			"success": false,
		})
	}
	camera, err := models.GetCameraByAPIKey(req.APIKey)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error":   "API key tidak valid",
			"success": false,
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "API key valid",
		"data": fiber.Map{
			"camera_id":         camera.ID,
			"tipe_kamera":       camera.TipeKamera,
			"lokasi_penempatan": camera.LokasiPenempatan,
			"lokasi_id":         camera.LokasiID,
		},
	})
}

// Mengambil status kamera berdasarkan API key
func GetCameraStatus(c *fiber.Ctx) error {
	apiKey := c.Params("api_key")
	if apiKey == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "api_key tidak boleh kosong",
			"success": false,
		})
	}
	camera, err := models.GetCameraByAPIKey(apiKey)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":   "Kamera tidak ditemukan",
			"success": false,
		})
	}
	location, err := models.GetLocationByID(camera.LokasiID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Gagal mendapatkan info lokasi",
			"success": false,
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"camera": fiber.Map{
				"id":                camera.ID,
				"tipe_kamera":       camera.TipeKamera,
				"lokasi_penempatan": camera.LokasiPenempatan,
				"zona_arah":         camera.ZonaArah,
			},
			"lokasi": fiber.Map{
				"id":          location.ID,
				"nama_lokasi": location.Nama_lokasi,
				"tipe_lokasi": location.Tipe_lokasi,
			},
		},
	})
}
