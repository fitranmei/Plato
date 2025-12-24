package main

import (
	"context"
	"log"

	"backend/database"
	"backend/models"
	"backend/utils"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func SeedSuperAdmin() {
	superAdminID := "SAA001"
	superAdminUsername := "agus"
	superAdminEmail := "agus@gmail.com"
	superAdminPassword := "Agus123"
	superAdminRegion := "Pusat"

	var existingUser models.User
	err := database.DB.Collection("users").FindOne(context.Background(), bson.M{"role": models.RoleSuperAdmin}).Decode(&existingUser)
	if err == nil {
		log.Println("Superadmin sudah ada, tidak perlu dibuat ulang.")
		return
	}

	superAdmin := models.User{
		ID:       superAdminID,
		Username: superAdminUsername,
		Email:    superAdminEmail,
		Password: utils.HashPassword(superAdminPassword),
		Role:     models.RoleSuperAdmin,
		Region:   superAdminRegion,
	}

	_, err = database.DB.Collection("users").InsertOne(context.Background(), superAdmin)
	if err != nil {
		log.Fatalf("Gagal membuat superadmin: %v", err)
	}

	log.Printf("Superadmin berhasil dibuat!\nID: %s\nUsername: %s\nPassword: %s\n", superAdminID, superAdminUsername, superAdminPassword)
}
