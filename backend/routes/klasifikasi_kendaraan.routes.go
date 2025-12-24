package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupKlasifikasiKendaraanRoutes(router fiber.Router) {
	klasifikasi := router.Group("/klasifikasi-kendaraan")
	klasifikasi.Use(middleware.Protected())
	klasifikasi.Use(middleware.RestrictTo("superadmin"))

	klasifikasi.Get("/template", controllers.GetKlasifikasiTemplate)
	klasifikasi.Get("/", controllers.GetAllMasterKlasifikasi)
	klasifikasi.Post("/init", controllers.InitMasterKlasifikasiHandler)
	klasifikasi.Put("/bulk", controllers.UpdateBulkMasterKlasifikasi)
}
