package main

import (
	"context"
	"log"

	"backend/database"
	"backend/models"
	"backend/utils"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type SuperAdminData struct {
	ID       string
	Username string
	Email    string
	Password string
	Balai    string
}

func SeedSuperAdmin() {
	superAdmins := []SuperAdminData{
		{
			ID:       "SAA001",
			Username: "intens",
			Email:    "intens@gmail.com",
			Password: "1nt3n5",
			Balai:    "Pusat",
		},
		{
			ID:       "SAA002",
			Username: "nizhar",
			Email:    "nizhar@gmail.com",
			Password: "okyys",
			Balai:    "Pusat",
		},
		// Tambahkan superadmin lain di bawah ini
		//{
		//	ID:       "SAA003",
		//	Username: "agus",
		//	Email:    "agus@gmail.com",
		//	Password: "Agus123",
		//	Balai:    "Pusat",
		//},
	}

	for _, sa := range superAdmins {
		superAdmin := models.User{
			ID:       sa.ID,
			Username: sa.Username,
			Email:    sa.Email,
			Password: utils.HashPassword(sa.Password),
			Role:     models.RoleSuperAdmin,
			Balai:    sa.Balai,
		}

		// Jika ID sudah ada maka replace, jika belum maka insert
		opts := options.Replace().SetUpsert(true)
		result, err := database.DB.Collection("users").ReplaceOne(
			context.Background(),
			bson.M{"_id": sa.ID},
			superAdmin,
			opts,
		)
		if err != nil {
			log.Printf("Gagal membuat/update superadmin %s: %v\n", sa.ID, err)
			continue
		}

		if result.UpsertedCount > 0 {
			log.Printf("Superadmin baru berhasil dibuat!\nID: %s\nUsername: %s\nPassword: %s\n", sa.ID, sa.Username, sa.Password)
		} else {
			log.Printf("Superadmin %s berhasil diupdate!\n", sa.ID)
		}
	}
}
