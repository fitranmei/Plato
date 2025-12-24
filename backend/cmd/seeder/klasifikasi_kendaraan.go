package main

import (
	"backend/models"
	"fmt"
)

func SeedKlasifikasi() {
	fmt.Println("Seeding klasifikasi kendaraan master data...")
	err := models.InitMasterKlasifikasi()
	if err != nil {
		fmt.Printf("Error seeding klasifikasi kendaraan: %v\n", err)
	} else {
		fmt.Println("Klasifikasi kendaraan master data seeded successfully")
	}
}
