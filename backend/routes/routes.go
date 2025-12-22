package routes

import (
	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	SetupAuthRoutes(app)
	SetupUserRoutes(app)
	SetupLocationRoutes(app)
}
