package controllers

import (
	"context"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"backend/database"
	"backend/models"
)

type TrafficDataRequest struct {
	LokasiID      string                       `json:"lokasi_id"`
	ZonaArahData  []models.TrafficZonaArahData `json:"zona_arah_data"`
	IntervalMenit int                          `json:"interval_menit"`
}

func CreateTrafficData(c *fiber.Ctx) error {
	var req TrafficDataRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if req.LokasiID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "lokasi_id diperlukan"})
	}

	if len(req.ZonaArahData) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "zona_arah_data diperlukan"})
	}

	for i := range req.ZonaArahData {
		total := 0
		for _, kelasData := range req.ZonaArahData[i].KelasData {
			total += kelasData.JumlahKendaraan
		}
		req.ZonaArahData[i].TotalKendaraan = total
	}

	trafficData, err := models.CreateTrafficData(req.LokasiID, req.ZonaArahData, req.IntervalMenit)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membuat traffic data: " + err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "traffic data berhasil dibuat",
		"data":    trafficData,
	})
}

func GetTrafficDataByLokasiID(c *fiber.Ctx) error {
	lokasiID := c.Params("lokasi_id")

	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	var startTime, endTime time.Time
	var err error

	if startTimeStr != "" {
		startTime, err = time.Parse(time.RFC3339, startTimeStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "format start_time tidak valid (gunakan RFC3339)"})
		}
	} else {
		startTime = time.Now().Add(-24 * time.Hour)
	}

	if endTimeStr != "" {
		endTime, err = time.Parse(time.RFC3339, endTimeStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "format end_time tidak valid (gunakan RFC3339)"})
		}
	} else {
		endTime = time.Now()
	}

	trafficDataList, err := models.GetTrafficDataByLokasiID(lokasiID, startTime, endTime)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data traffic"})
	}

	return c.JSON(fiber.Map{
		"data":       trafficDataList,
		"count":      len(trafficDataList),
		"start_time": startTime,
		"end_time":   endTime,
	})
}

func GetLatestTrafficDataByLokasiID(c *fiber.Ctx) error {
	lokasiID := c.Params("lokasi_id")

	trafficData, err := models.GetLatestTrafficDataByLokasiID(lokasiID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "traffic data tidak ditemukan"})
	}

	return c.JSON(fiber.Map{"data": trafficData})
}

func GetTrafficDataByID(c *fiber.Ctx) error {
	id := c.Params("id")

	trafficData, err := models.GetTrafficDataByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "traffic data tidak ditemukan"})
	}

	return c.JSON(fiber.Map{"data": trafficData})
}

func GetAllTrafficData(c *fiber.Ctx) error {
	lokasiID := c.Query("lokasi_id")
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")
	limitStr := c.Query("limit", "100")

	filter := bson.M{}

	if lokasiID != "" {
		filter["lokasi_id"] = lokasiID
	}

	if startTimeStr != "" && endTimeStr != "" {
		startTime, err1 := time.Parse(time.RFC3339, startTimeStr)
		endTime, err2 := time.Parse(time.RFC3339, endTimeStr)

		if err1 == nil && err2 == nil {
			filter["timestamp"] = bson.M{
				"$gte": startTime,
				"$lte": endTime,
			}
		}
	}

	var limit int64
	limitInt, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 100
	} else {
		limit = int64(limitInt)
	}

	findOptions := options.Find().
		SetSort(bson.D{{Key: "timestamp", Value: -1}}).
		SetLimit(limit)

	cursor, err := database.DB.Collection("traffic_data").Find(
		context.Background(),
		filter,
		findOptions,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data traffic"})
	}

	var trafficDataList []models.TrafficData
	if err = cursor.All(context.Background(), &trafficDataList); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal parsing data traffic"})
	}

	return c.JSON(fiber.Map{
		"data":  trafficDataList,
		"count": len(trafficDataList),
	})
}

func DeleteTrafficData(c *fiber.Ctx) error {
	id := c.Params("id")

	_, err := models.GetTrafficDataByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "traffic data tidak ditemukan"})
	}

	_, err = database.DB.Collection("traffic_data").DeleteOne(context.Background(), bson.M{"_id": id})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menghapus traffic data"})
	}

	return c.JSON(fiber.Map{"message": "traffic data berhasil dihapus"})
}

func CleanupOldTrafficData(c *fiber.Ctx) error {
	daysStr := c.Query("days", "30")

	days, err := strconv.Atoi(daysStr)
	if err != nil {
		days = 30
	}

	beforeTime := time.Now().AddDate(0, 0, -days)

	deletedCount, err := models.DeleteOldTrafficData(beforeTime)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menghapus data lama"})
	}

	return c.JSON(fiber.Map{
		"message":       "data traffic lama berhasil dihapus",
		"deleted_count": deletedCount,
		"before_date":   beforeTime,
	})
}
