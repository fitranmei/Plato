package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"backend/config"
	"backend/database"
	"backend/routes"
)

func main() {
	cfg := config.Load()

	database.Connect(cfg.MongoURI, cfg.DBName)
	database.CreateIndexes()

	app := fiber.New()

	// Temporarily allow all origins for debugging frontend requests
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	routes.Setup(app)

	log.Println("Server running on http://localhost:" + cfg.AppPort)
	log.Fatal(app.Listen(":" + cfg.AppPort))
}
