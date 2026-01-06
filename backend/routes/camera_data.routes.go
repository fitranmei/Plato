package routes

import (
	"backend/controllers"

	"github.com/gofiber/fiber/v2"
)

func SetupCameraDataRoutes(router fiber.Router) {
	camera := router.Group("/camera")

	camera.Post("/data", controllers.ReceiveCameraData)

	// POST /api/camera/data/json - receive XML data wrapped in JSON
	camera.Post("/data/json", controllers.ReceiveCameraDataJSON)

	// POST /api/camera/data/stream - receive streaming XML data
	camera.Post("/data/stream", controllers.ReceiveCameraDataStream)

	// POST /api/camera/validate - validate camera API key
	camera.Post("/validate", controllers.ValidateCameraAPIKey)

	// GET /api/camera/status/:api_key - get camera status by API key
	camera.Get("/status/:api_key", controllers.GetCameraStatus)
}
