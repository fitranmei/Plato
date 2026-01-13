package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupTrafficDataRoutes(router fiber.Router) {
	traffic := router.Group("/traffic-data")
	traffic.Use(middleware.Protected())

	traffic.Post("/", middleware.RestrictTo("superadmin"), controllers.CreateTrafficData)
	traffic.Get("/", controllers.GetAllTrafficData)
	traffic.Get("/:id", controllers.GetTrafficDataByID)
	traffic.Get("/lokasi/:lokasi_id", controllers.GetTrafficDataByLokasiID)
	traffic.Get("/lokasi/:lokasi_id/latest", controllers.GetLatestTrafficDataByLokasiID)
	traffic.Delete("/:id", middleware.RestrictTo("superadmin"), controllers.DeleteTrafficData)
	traffic.Delete("/cleanup", middleware.RestrictTo("superadmin"), controllers.CleanupOldTrafficData)
	traffic.Get("/lokasi/:lokasi_id/latest", controllers.GetLatestTrafficDataByLokasiID)
	traffic.Delete("/:id", middleware.RestrictTo("superadmin"), controllers.DeleteTrafficData)
	traffic.Delete("/cleanup", middleware.RestrictTo("superadmin"), controllers.CleanupOldTrafficData)

}
