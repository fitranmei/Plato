package main

import (
	"flag"
	"fmt"
	"os"

	"backend/config"
	"backend/database"
)

func main() {
	seedType := flag.String("type", "all", "Type of seed to run: 'superadmin', 'klasifikasi', 'region', or 'all'")
	flag.Parse()
	cfg := config.Load()
	database.Connect(cfg.MongoURI, cfg.DBName)

	switch *seedType {
	case "superadmin":
		SeedSuperAdmin()
	case "klasifikasi":
		SeedKlasifikasi()
	case "region":
		SeedRegion()
	case "all":
		SeedSuperAdmin()
		fmt.Println("--------------------------------")
		SeedKlasifikasi()
		fmt.Println("--------------------------------")
		SeedRegion()
	default:
		fmt.Println("Invalid seed type. Use 'superadmin', 'klasifikasi', 'region', or 'all'")
		os.Exit(1)
	}
}
