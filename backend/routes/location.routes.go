package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupLocationRoutes(router fiber.Router) {
	location := router.Group("/locations")
	location.Use(middleware.Protected())

	location.Get("/", controllers.GetAllLocations)
	location.Get("/:id", controllers.GetLocationByID)
	location.Get("/options", controllers.GetLocationOptions)

	location.Post("/", middleware.RestrictTo("superadmin"), controllers.CreateLocation)
	location.Put("/:id", middleware.RestrictTo("superadmin"), controllers.UpdateLocation)
	location.Delete("/:id", middleware.RestrictTo("superadmin"), controllers.DeleteLocation)
}
