package main

import (
	"log"

	"github.com/gofiber/fiber/v2"

	"backend/config"
	"backend/database"
	"backend/routes"
)

func main() {
	cfg := config.Load()

	database.Connect(cfg.MongoURI, cfg.DBName)
	database.CreateIndexes()

	app := fiber.New()

	routes.Setup(app)

	log.Println("Server running on port", cfg.AppPort)
	log.Fatal(app.Listen(":" + cfg.AppPort))
}
