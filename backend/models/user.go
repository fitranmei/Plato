package models

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type UserRole string

const (
	RoleUser       UserRole = "user"
	RoleAdmin      UserRole = "admin"
	RoleSuperAdmin UserRole = "superadmin"
)

type User struct {
	ID        string    `bson:"_id,omitempty" json:"id,omitempty"`
	Username  string    `bson:"username" json:"username"`
	Email     string    `bson:"email" json:"email"`
	Password  string    `bson:"password" json:"-"`
	Role      UserRole  `bson:"role" json:"role"`
	Balai     string    `bson:"balai,omitempty" json:"balai,omitempty"`
	LastLogin time.Time `bson:"last_login,omitempty" json:"last_login,omitempty"`
}

func NextUserID(role UserRole) (string, error) {
	var prefix string
	switch role {
	case RoleUser:
		prefix = "UA"
	case RoleAdmin:
		prefix = "AA"
	default:
		prefix = "UA"
	}

	ctx := context.Background()
	filter := bson.M{
		"role": role,
		"_id":  bson.M{"$regex": "^" + prefix + "\\d{3}$"},
	}

	opts := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	var u User

	err := database.DB.Collection("users").FindOne(ctx, filter, opts).Decode(&u)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return fmt.Sprintf("%s%03d", prefix, 1), nil
		}
		return "", err
	}

	numStr := strings.TrimPrefix(u.ID, prefix)
	n, err := strconv.Atoi(numStr)
	if err != nil {
		return fmt.Sprintf("%s%03d", prefix, 1), nil
	}
	return fmt.Sprintf("%s%03d", prefix, n+1), nil
}
