package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort   string
	MongoURI  string
	DBName    string
	JWTSecret string
}

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("gagal load file .env")
	}

	return &Config{
		AppPort:   os.Getenv("APP_PORT"),
		MongoURI:  os.Getenv("MONGO_URI"),
		DBName:    os.Getenv("DB_NAME"),
		JWTSecret: os.Getenv("JWT_SECRET"),
	}
}
