package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupLocationSourceRoutes(router fiber.Router) {
	source := router.Group("/locations/:location_id/source")
	source.Use(middleware.Protected())

	// Get source for a location
	source.Get("/", controllers.GetLocationSource)
	source.Post("/", middleware.RestrictTo("superadmin"), controllers.CreateLocationSource)
	source.Put("/", middleware.RestrictTo("superadmin"), controllers.UpdateLocationSource)
	source.Delete("/", middleware.RestrictTo("superadmin"), controllers.DeleteLocationSource)

	// Get source type options
	options := router.Group("/source-options")
	options.Use(middleware.Protected())
	options.Get("/", controllers.GetSourceOptions)

	// Serve static images
	router.Static("/images", "./public/location_images")
}
