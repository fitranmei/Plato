package routes

import (
	"backend/controllers"

	"github.com/gofiber/fiber/v2"
)

func SetupCameraDataRoutes(router fiber.Router) {
	camera := router.Group("/camera")

	camera.Post("/data", controllers.ReceiveCameraData)
	// XML data wrapped in JSON
	camera.Post("/data/json", controllers.ReceiveCameraDataJSON)
	camera.Post("/data/stream", controllers.ReceiveCameraDataStream)
	camera.Post("/validate", controllers.ValidateCameraAPIKey)
	camera.Get("/status/:api_key", controllers.GetCameraStatus)
}
