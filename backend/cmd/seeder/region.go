package main

import (
	"backend/models"
	"log"
)

func SeedRegion() {
	err := models.InitRegions()
	if err != nil {
		log.Printf("Error seeding regions: %v\n", err)
	} else {
		log.Printf("Region data seeded successfully")
	}
}
