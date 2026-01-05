package main

import (
	"backend/models"
	"log"
)

func SeedKlasifikasi() {
	err := models.InitMasterKlasifikasi()
	if err != nil {
		log.Printf("Error seeding klasifikasi kendaraan: %v\n", err)
	} else {
		log.Printf("Klasifikasi kendaraan master data seeded successfully")
	}
}
