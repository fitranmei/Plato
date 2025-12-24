package main

import (
	"backend/models"
	"fmt"
)

func SeedRegion() {
	fmt.Println("Seeding region data (Provinces)...")
	err := models.InitRegions()
	if err != nil {
		fmt.Printf("Error seeding regions: %v\n", err)
	} else {
		fmt.Println("Region data seeded successfully")
	}
}
