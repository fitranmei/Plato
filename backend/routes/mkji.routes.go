package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupMKJIRoutes(app *fiber.App) {
	mkji := app.Group("/mkji")

	mkji.Get("/mapping", controllers.GetMKJIMapping)

	mkji.Use(middleware.Protected())

	mkji.Get("/analysis/:lokasi_id", controllers.GetMKJIAnalysis)
	mkji.Post("/analysis", controllers.CreateMKJIAnalysis)
	mkji.Get("/analysis/:lokasi_id/history", controllers.GetMKJIAnalysisHistory)
	mkji.Get("/analysis/:lokasi_id/latest", controllers.GetLatestMKJIAnalysis)
	mkji.Get("/analysis/detail/:id", controllers.GetMKJIAnalysisByID)

	mkji.Get("/kapasitas/:lokasi_id", controllers.GetKapasitasJalan)
}
