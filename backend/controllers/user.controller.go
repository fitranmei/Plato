package controllers

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"backend/database"
	"backend/models"
	"backend/utils"
)

func Register(c *fiber.Ctx) error {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role,omitempty"`
		Region   string `json:"region,omitempty"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if req.Username == "" || req.Email == "" || req.Password == "" || req.Role == "" || req.Region == "" {
		return c.Status(400).JSON(fiber.Map{"error": "username, email, password, role, dan region diperlukan"})
	}

	var role models.UserRole = models.RoleUser
	switch req.Role {
	case string(models.RoleAdmin):
		role = models.RoleAdmin
	case string(models.RoleUser):
		role = models.RoleUser
	default:
		role = models.RoleUser
	}

	id, err := models.NextUserID(role)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membuat id user"})
	}

	user := models.User{
		ID:       id,
		Username: req.Username,
		Email:    req.Email,
		Password: utils.HashPassword(req.Password),
		Role:     role,
		Region:   req.Region,
	}

	_, err = database.DB.Collection("users").InsertOne(context.Background(), user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membuat user"})
	}

	return c.Status(201).JSON(fiber.Map{"id": id})
}

func Login(c *fiber.Ctx) error {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "request tidak valid",
		})
	}

	var user models.User
	err := database.DB.
		Collection("users").
		FindOne(context.Background(), bson.M{"username": req.Username}).
		Decode(&user)

	if err != nil || !utils.CheckPassword(req.Password, user.Password) {
		return c.Status(401).JSON(fiber.Map{
			"error": "Username atau password salah",
		})
	}

	token, _ := utils.GenerateToken(user.ID, string(user.Role), user.Region)

	_, err = database.DB.Collection("active_tokens").DeleteMany(context.Background(), bson.M{"user_id": user.ID})
	if err != nil {
		log.Printf("Warning: Gagal menghapus token aktif untuk user %s: %v", user.ID, err)
	}

	activeToken := models.ActiveToken{
		Token:     token,
		UserID:    user.ID,
		CreatedAt: time.Now(),
	}
	_, err = database.DB.Collection("active_tokens").InsertOne(context.Background(), activeToken)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal login"})
	}

	return c.JSON(fiber.Map{
		"token":    token,
		"role":     user.Role,
		"username": user.Username,
		"region":   user.Region,
	})
}

func Logout(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Token diperlukan"})
	}

	tokenString := strings.Replace(authHeader, "Bearer ", "", 1)

	_, err := database.DB.Collection("active_tokens").DeleteOne(context.Background(), bson.M{"token": tokenString})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal logout"})
	}

	return c.JSON(fiber.Map{
		"message": "Logout berhasil",
	})
}

func GetAllUsers(c *fiber.Ctx) error {
	filter := bson.M{}

	if role := c.Query("role"); role != "" {
		filter["role"] = role
	}

	if region := c.Query("region"); region != "" {
		filter["region"] = region
	}

	findOptions := options.Find()
	if sort := c.Query("sort"); sort == "region" {
		findOptions.SetSort(bson.D{{Key: "region", Value: 1}})
	}

	cursor, err := database.DB.Collection("users").Find(context.Background(), filter, findOptions)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil data user"})
	}
	var users []models.User
	if err = cursor.All(context.Background(), &users); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal parsing data user"})
	}
	return c.JSON(users)
}
