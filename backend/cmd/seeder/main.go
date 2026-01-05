package main

import (
	"flag"
	"fmt"
	"os"

	"backend/config"
	"backend/database"
)

func main() {
	seedType := flag.String("type", "all", "Type of seed to run: 'superadmin', 'klasifikasi', 'balai', or 'all'")
	flag.Parse()
	cfg := config.Load()
	database.Connect(cfg.MongoURI, cfg.DBName)

	switch *seedType {
	case "superadmin":
		SeedSuperAdmin()
	case "klasifikasi":
		SeedKlasifikasi()
	case "balai":
		SeedBalai()
	case "all":
		fmt.Println("------------------------------------------------")
		SeedSuperAdmin()
		SeedKlasifikasi()
		SeedBalai()
		fmt.Println("------------------------------------------------")
	default:
		fmt.Println("Invalid seed type. Use 'superadmin', 'klasifikasi', 'balai', or 'all'")
		os.Exit(1)
	}
}
