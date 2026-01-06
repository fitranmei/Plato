package routes

import (
	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	api := app.Group("/api")
	SetupCameraDataRoutes(api)

	SetupAuthRoutes(app)
	SetupUserRoutes(app)
	SetupLocationRoutes(app)
	SetupCameraRoutes(app)
	SetupKlasifikasiKendaraanRoutes(app)
	SetupZonaArahRoutes(app)
	SetupTrafficDataRoutes(app)
	SetupTrafficRawDataRoutes(app)
	SetupMKJIRoutes(app)
}
