package routes

import (
	"backend/controllers"

	"github.com/gofiber/fiber/v2"
)

func SetupAuthRoutes(router fiber.Router) {
	router.Post("/login", controllers.Login)
	router.Post("/logout", controllers.Logout)
}
