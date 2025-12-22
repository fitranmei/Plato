package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupLocationRoutes(router fiber.Router) {
	location := router.Group("/locations")
	location.Use(middleware.Protected())
	location.Use(middleware.RestrictTo("superadmin"))

	location.Get("/options", controllers.GetLocationOptions)
	location.Post("/", controllers.CreateLocation)
	location.Get("/", controllers.GetAllLocations)
	location.Get("/:id", controllers.GetLocationByID)
	location.Put("/:id", controllers.UpdateLocation)
	location.Delete("/:id", controllers.DeleteLocation)
}
