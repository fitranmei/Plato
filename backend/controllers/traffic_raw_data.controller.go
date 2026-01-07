package controllers

import (
	"strconv"
	"time"

	"backend/models"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetRawDataByID(c *fiber.Ctx) error {
	id := c.Params("id")

	rawData, err := models.GetRawDataByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":   "raw data tidak ditemukan",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    rawData,
	})
}

func GetRawDataByLokasiID(c *fiber.Ctx) error {
	lokasiID := c.Params("lokasi_id")

	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	var startTime, endTime time.Time
	var err error

	if startTimeStr != "" {
		startTime, err = time.Parse(time.RFC3339, startTimeStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "format start_time tidak valid (gunakan RFC3339)",
				"success": false,
			})
		}
	} else {
		startTime = time.Now().Add(-24 * time.Hour)
	}

	if endTimeStr != "" {
		endTime, err = time.Parse(time.RFC3339, endTimeStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "format end_time tidak valid (gunakan RFC3339)",
				"success": false,
			})
		}
	} else {
		endTime = time.Now()
	}

	rawDataList, err := models.GetRawDataByLokasiID(lokasiID, startTime, endTime)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal mengambil raw data",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success":    true,
		"data":       rawDataList,
		"count":      len(rawDataList),
		"start_time": startTime,
		"end_time":   endTime,
	})
}

func GetAllRawData(c *fiber.Ctx) error {
	lokasiID := c.Query("lokasi_id")
	cameraID := c.Query("camera_id")
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")
	limitStr := c.Query("limit", "100")
	isProcessedStr := c.Query("is_processed")

	filter := bson.M{}

	if lokasiID != "" {
		filter["lokasi_id"] = lokasiID
	}

	if cameraID != "" {
		filter["camera_id"] = cameraID
	}

	if isProcessedStr != "" {
		isProcessed := isProcessedStr == "true"
		filter["is_processed"] = isProcessed
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

	collection := models.GetRawDataCollection()
	cursor, err := collection.Find(c.Context(), filter, findOptions)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal mengambil raw data",
			"success": false,
		})
	}

	var rawDataList []models.TrafficRawData
	if err = cursor.All(c.Context(), &rawDataList); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal parsing raw data",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    rawDataList,
		"count":   len(rawDataList),
	})
}

func GetUnprocessedRawData(c *fiber.Ctx) error {
	limitStr := c.Query("limit", "50")

	var limit int64
	limitInt, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 50
	} else {
		limit = int64(limitInt)
	}

	rawDataList, err := models.GetUnprocessedRawData(limit)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal mengambil unprocessed raw data",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    rawDataList,
		"count":   len(rawDataList),
	})
}

func DeleteRawData(c *fiber.Ctx) error {
	id := c.Params("id")

	collection := models.GetRawDataCollection()
	result, err := collection.DeleteOne(c.Context(), bson.M{"_id": id})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal menghapus raw data",
			"success": false,
		})
	}

	if result.DeletedCount == 0 {
		return c.Status(404).JSON(fiber.Map{
			"error":   "raw data tidak ditemukan",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "raw data berhasil dihapus",
	})
}

func CleanupOldRawData(c *fiber.Ctx) error {
	daysStr := c.Query("days", "30")
	days, err := strconv.Atoi(daysStr)
	if err != nil {
		days = 30
	}

	beforeTime := time.Now().AddDate(0, 0, -days)
	deletedCount, err := models.DeleteOldRawData(beforeTime)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal menghapus raw data lama",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success":       true,
		"message":       "raw data lama berhasil dihapus",
		"deleted_count": deletedCount,
		"before_date":   beforeTime,
	})
}
