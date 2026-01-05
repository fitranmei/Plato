package main

import (
	"backend/models"
	"log"
)

func SeedBalai() {
	err := models.InitBalais()
	if err != nil {
		log.Printf("Error seeding balais: %v\n", err)
	} else {
		log.Printf("Balai data seeded successfully")
	}
}
