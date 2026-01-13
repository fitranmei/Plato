package routes

import (
	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	SetupCameraDataRoutes(app)
	SetupAuthRoutes(app)
	SetupUserRoutes(app)
	SetupLocationRoutes(app)
	SetupLocationSourceRoutes(app)
	SetupCameraRoutes(app)
	SetupKlasifikasiKendaraanRoutes(app)
	SetupZonaArahRoutes(app)
	SetupTrafficDataRoutes(app)
	SetupTrafficRawDataRoutes(app)
	SetupMKJIRoutes(app)
}
