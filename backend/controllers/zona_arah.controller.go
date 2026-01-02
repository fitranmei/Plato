package controllers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"

	"backend/database"
	"backend/models"
)

func GetAllZonaArah(c *fiber.Ctx) error {
	cursor, err := database.DB.Collection("zona_arah").Find(context.Background(), bson.M{})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data zona arah"})
	}

	var zonaArahList []models.ZonaArah
	if err = cursor.All(context.Background(), &zonaArahList); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal parsing data zona arah"})
	}

	return c.JSON(fiber.Map{
		"data":          zonaArahList,
		"count":         len(zonaArahList),
		"max_zona_arah": models.MaxZonaArah,
		"min_zona_arah": models.MinZonaArah,
	})
}

func GetZonaArahByID(c *fiber.Ctx) error {
	id := c.Params("id")

	zonaArah, err := models.GetZonaArahByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "zona arah tidak ditemukan"})
	}

	return c.JSON(fiber.Map{"data": zonaArah})
}

func GetZonaArahByCameraID(c *fiber.Ctx) error {
	cameraID := c.Params("camera_id")

	zonaArahList, err := models.GetZonaArahByCameraID(cameraID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "zona arah tidak ditemukan"})
	}

	return c.JSON(fiber.Map{
		"data":  zonaArahList,
		"count": len(zonaArahList),
	})
}
