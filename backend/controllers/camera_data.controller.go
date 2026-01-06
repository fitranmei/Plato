package controllers

import (
	"io"
	"log"

	"backend/models"

	"github.com/gofiber/fiber/v2"
)

type CameraDataRequest struct {
	XMLData string `json:"xml_data"`
}

func ReceiveCameraData(c *fiber.Ctx) error {
	xmlData := string(c.Body())

	if xmlData == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "data XML tidak boleh kosong",
			"success": false,
		})
	}

	log.Printf("Received camera data: %d bytes", len(xmlData))

	trafficData, err := models.ProcessCameraData(xmlData)
	if err != nil {
		log.Printf("Error processing camera data: %v", err)
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

func ReceiveCameraDataJSON(c *fiber.Ctx) error {
	var req CameraDataRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "format request tidak valid",
			"success": false,
		})
	}

	if req.XMLData == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "xml_data tidak boleh kosong",
			"success": false,
		})
	}

	log.Printf("Received camera data (JSON wrapper): %d bytes", len(req.XMLData))

	trafficData, err := models.ProcessCameraData(req.XMLData)
	if err != nil {
		log.Printf("Error processing camera data: %v", err)
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

func ReceiveCameraDataStream(c *fiber.Ctx) error {
	body, err := io.ReadAll(c.Request().BodyStream())
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "gagal membaca data stream",
			"success": false,
		})
	}

	xmlData := string(body)
	if xmlData == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "data XML tidak boleh kosong",
			"success": false,
		})
	}

	log.Printf("Received camera data (stream): %d bytes", len(xmlData))

	trafficData, err := models.ProcessCameraData(xmlData)
	if err != nil {
		log.Printf("Error processing camera data: %v", err)
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

func ValidateCameraAPIKey(c *fiber.Ctx) error {
	type ValidateRequest struct {
		APIKey string `json:"api_key"`
	}

	var req ValidateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "format request tidak valid",
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
			"error":   "kamera tidak ditemukan",
			"success": false,
		})
	}

	location, err := models.GetLocationByID(camera.LokasiID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal mendapatkan info lokasi",
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
