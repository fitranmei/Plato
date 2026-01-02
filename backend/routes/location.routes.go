package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupLocationRoutes(router fiber.Router) {
	location := router.Group("/locations")
	location.Use(middleware.Protected())

	// Read operations - Accessible to all authenticated users
	location.Get("/", controllers.GetAllLocations)
	location.Get("/:id", controllers.GetLocationByID)
	location.Get("/options", controllers.GetLocationOptions)

	// Write operations - Restricted to Admin & Superadmin
	// Note: Controller logic also has ownership checks, but this adds a layer of role security
	location.Post("/", middleware.RestrictTo("admin", "superadmin"), controllers.CreateLocation)
	location.Put("/:id", middleware.RestrictTo("admin", "superadmin"), controllers.UpdateLocation)
	location.Delete("/:id", middleware.RestrictTo("admin", "superadmin"), controllers.DeleteLocation)
}
