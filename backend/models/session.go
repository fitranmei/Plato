package models

import (
	"time"
)

type ActiveToken struct {
	Token     string    `bson:"token" json:"token"`
	UserID    string    `bson:"user_id" json:"user_id"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
}
