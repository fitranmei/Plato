package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"backend/config"
	"backend/database"
	"backend/routes"
	"backend/services"
)

func main() {
	cfg := config.Load()

	database.Connect(cfg.MongoURI, cfg.DBName)
	database.CreateIndexes()

	app := fiber.New(fiber.Config{
		BodyLimit: 50 * 1024 * 1024, // 50MB limit dari base64 images
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	routes.Setup(app)

	trafficCollector := services.NewTrafficCollectorService()
	trafficCollector.Start()

	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			trafficCollector.CleanupOldData(30)
		}
	}()

	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan

		log.Println("Shutting down gracefully...")
		trafficCollector.Stop()
		app.Shutdown()
	}()

	log.Println("Server running on http://localhost:" + cfg.AppPort)
	log.Println("Traffic Collector Service is running with per-location intervals")
	log.Fatal(app.Listen(":" + cfg.AppPort))
}
