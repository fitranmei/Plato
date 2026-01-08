package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupTrafficRawDataRoutes(router fiber.Router) {
	rawData := router.Group("/traffic-raw-data")
	rawData.Use(middleware.Protected())

	rawData.Get("/", middleware.RestrictTo("admin", "superadmin"), controllers.GetAllRawData)
	rawData.Get("/unprocessed", middleware.RestrictTo("admin", "superadmin"), controllers.GetUnprocessedRawData)
	rawData.Get("/export-excel", middleware.RestrictTo("admin", "superadmin"), controllers.ExportRawDataToExcel)
	rawData.Get("/:id", middleware.RestrictTo("admin", "superadmin"), controllers.GetRawDataByID)
	rawData.Get("/lokasi/:lokasi_id", middleware.RestrictTo("admin", "superadmin"), controllers.GetRawDataByLokasiID)

	rawData.Delete("/:id", middleware.RestrictTo("superadmin"), controllers.DeleteRawData)
	rawData.Delete("/cleanup", middleware.RestrictTo("superadmin"), controllers.CleanupOldRawData)
}
