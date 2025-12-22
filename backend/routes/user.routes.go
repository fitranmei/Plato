package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupUserRoutes(router fiber.Router) {
	router.Post("/register", middleware.Protected(), middleware.RestrictTo("superadmin"), controllers.Register)
	router.Get("/users", middleware.Protected(), middleware.RestrictTo("superadmin"), controllers.GetAllUsers)
}
