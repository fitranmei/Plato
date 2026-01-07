package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupTrafficDataRoutes(router fiber.Router) {
	traffic := router.Group("/traffic-data")
	traffic.Use(middleware.Protected())

	traffic.Post("/", middleware.RestrictTo("admin", "superadmin"), controllers.CreateTrafficData)
	traffic.Get("/", controllers.GetAllTrafficData)
	traffic.Get("/:id", controllers.GetTrafficDataByID)
	traffic.Get("/lokasi/:lokasi_id", controllers.GetTrafficDataByLokasiID)
	traffic.Get("/lokasi/:lokasi_id/latest", controllers.GetLatestTrafficDataByLokasiID)
	traffic.Delete("/:id", middleware.RestrictTo("admin", "superadmin"), controllers.DeleteTrafficData)
	traffic.Delete("/cleanup", middleware.RestrictTo("admin", "superadmin"), controllers.CleanupOldTrafficData)

	archive := router.Group("/traffic-data-archive")
	archive.Use(middleware.Protected())

	archive.Post("/", middleware.RestrictTo("admin", "superadmin"), controllers.ArchiveTrafficData)
	archive.Get("/", middleware.RestrictTo("admin"), controllers.GetArchivedTrafficData)
	archive.Get("/years", middleware.RestrictTo("admin"), controllers.GetAvailableArchiveYears)
	archive.Get("/months", middleware.RestrictTo("admin"), controllers.GetAvailableArchiveMonths)
}
