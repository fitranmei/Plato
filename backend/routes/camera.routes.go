package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupCameraRoutes(router fiber.Router) {
	camera := router.Group("/cameras")
	camera.Use(middleware.Protected())
	camera.Use(middleware.RestrictTo("superadmin"))

	camera.Get("/options", controllers.GetCameraOptions)
	camera.Post("/", controllers.CreateCamera)
	camera.Get("/", controllers.GetAllCameras)
	camera.Get("/:id", controllers.GetCameraByID)
	camera.Get("/lokasi/:lokasi_id", controllers.GetCamerasByLokasiID)
	camera.Put("/:id", controllers.UpdateCamera)
	camera.Delete("/:id", controllers.DeleteCamera)
}
