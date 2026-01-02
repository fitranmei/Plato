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

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	routes.Setup(app)

	trafficCollector := services.NewTrafficCollectorService()
	trafficCollector.Start(1)

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
	log.Println("Traffic Collector Service is running (interval: 1 minute)")
	log.Fatal(app.Listen(":" + cfg.AppPort))
}
