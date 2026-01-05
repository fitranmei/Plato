package middleware

import (
	"context"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"

	"backend/database"
	"backend/models"
	"backend/utils"
)

func Protected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)

		var activeToken models.ActiveToken
		err := database.DB.Collection("active_tokens").FindOne(context.Background(), bson.M{"token": tokenString}).Decode(&activeToken)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Token tidak valid atau sesi telah berakhir"})
		}

		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
		}

		c.Locals("user_id", claims["user_id"])
		c.Locals("role", claims["role"])
		if balai, ok := claims["balai"].(string); ok {
			c.Locals("balai", balai)
		}

		return c.Next()
	}
}

func RestrictTo(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := c.Locals("role").(string)

		for _, role := range roles {
			if userRole == role {
				return c.Next()
			}
		}

		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	}
}
