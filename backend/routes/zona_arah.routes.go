package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupZonaArahRoutes(router fiber.Router) {
	zonaArah := router.Group("/zona-arah")
	zonaArah.Use(middleware.Protected())
	zonaArah.Use(middleware.RestrictTo("superadmin"))

	zonaArah.Get("/", controllers.GetAllZonaArah)
	zonaArah.Get("/:id", controllers.GetZonaArahByID)
	zonaArah.Get("/camera/:id_zona_arah_camera", controllers.GetZonaArahByCameraID)
}
