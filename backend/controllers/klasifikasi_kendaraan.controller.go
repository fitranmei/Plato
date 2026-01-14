package controllers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"

	"backend/models"
)

// Mengambil seluruh data master klasifikasi kendaraan, bisa difilter berdasarkan tipe lokasi
func GetAllMasterKlasifikasi(c *fiber.Ctx) error {
	filter := bson.M{}

	if tipeLokasi := c.Query("tipe_lokasi"); tipeLokasi != "" {
		filter["tipe_lokasi"] = tipeLokasi
	}

	klasifikasi, err := models.GetAllMasterKlasifikasi()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil data master klasifikasi kendaraan"})
	}

	if tipeLokasi := c.Query("tipe_lokasi"); tipeLokasi != "" {
		var filtered []models.KlasifikasiKendaraan
		for _, k := range klasifikasi {
			if k.TipeLokasi == tipeLokasi {
				filtered = append(filtered, k)
			}
		}
		klasifikasi = filtered
	}

	return c.JSON(fiber.Map{
		"data":  klasifikasi,
		"count": len(klasifikasi),
	})
}

// Mengambil template klasifikasi kendaraan berdasarkan tipe lokasi
func GetKlasifikasiTemplate(c *fiber.Ctx) error {
	tipeLokasi := c.Query("tipe_lokasi")

	if tipeLokasi != "" {
		templates := models.GetKlasifikasiTemplateByTipeLokasi(tipeLokasi)
		return c.JSON(fiber.Map{
			"tipe_lokasi": tipeLokasi,
			"data":        templates,
			"count":       len(templates),
		})
	}

	result := fiber.Map{
		"perkotaan":      models.GetKlasifikasiTemplateByTipeLokasi("perkotaan"),
		"luar_kota":      models.GetKlasifikasiTemplateByTipeLokasi("luar_kota"),
		"bebas_hambatan": models.GetKlasifikasiTemplateByTipeLokasi("bebas_hambatan"),
		"12_kelas":       models.GetKlasifikasiTemplateByTipeLokasi("12_kelas"),
	}

	return c.JSON(fiber.Map{"data": result})
}

// Inisialisasi data master klasifikasi kendaraan
func InitMasterKlasifikasiHandler(c *fiber.Ctx) error {
	err := models.InitMasterKlasifikasi()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menginisialisasi master klasifikasi"})
	}
	return c.JSON(fiber.Map{"message": "Master klasifikasi berhasil diinisialisasi"})
}

// Update batas panjang klasifikasi
type BulkUpdateMasterKlasifikasiRequest struct {
	TipeLokasi string `json:"tipe_lokasi"`
	Data       []struct {
		Kelas        int     `json:"kelas"`
		BatasPanjang float64 `json:"batas_panjang"`
	} `json:"data"`
}

// Update batas panjang klasifikasi kendaraan
func UpdateBulkMasterKlasifikasi(c *fiber.Ctx) error {
	var req BulkUpdateMasterKlasifikasiRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Request tidak valid"})
	}

	if req.TipeLokasi == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Tipe lokasi diperlukan"})
	}

	allKlasifikasi, err := models.GetMasterKlasifikasiByTipeLokasi(req.TipeLokasi)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil data klasifikasi"})
	}

	if len(allKlasifikasi) == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Tipe lokasi tidak ditemukan"})
	}

	// Urutkan data klasifikasi berdasarkan kelas
	for i := 0; i < len(allKlasifikasi)-1; i++ {
		for j := i + 1; j < len(allKlasifikasi); j++ {
			if allKlasifikasi[i].Kelas > allKlasifikasi[j].Kelas {
				allKlasifikasi[i], allKlasifikasi[j] = allKlasifikasi[j], allKlasifikasi[i]
			}
		}
	}

	reqMap := make(map[int]float64)
	for _, item := range req.Data {
		reqMap[item.Kelas] = item.BatasPanjang
	}

	var currentPanjang float64 = 0
	// Validasi urutan batas panjang
	for _, k := range allKlasifikasi {
		if k.IsKelasTerakhir {
			continue
		}

		newBatas, exists := reqMap[k.Kelas]
		if !exists {
			newBatas = k.DefaultBatasPanjang
		}

		if newBatas <= currentPanjang {
			return c.Status(400).JSON(fiber.Map{
				"error": fmt.Sprintf("Batas panjang kelas %d (%.2f) harus lebih besar dari batas sebelumnya (%.2f)", k.Kelas, newBatas, currentPanjang),
			})
		}

		currentPanjang = newBatas
		reqMap[k.Kelas] = newBatas
	}

	var lastBatasPanjang float64 = 0
	// Proses update data klasifikasi
	for i, k := range allKlasifikasi {
		var panjangAwal float64 = 0
		if i > 0 {
			panjangAwal = lastBatasPanjang
		}

		var batasPanjang float64
		if k.IsKelasTerakhir {
			batasPanjang = 0
		} else {
			batasPanjang = reqMap[k.Kelas]
		}

		update := bson.M{
			"$set": bson.M{
				"default_panjang_awal":  panjangAwal,
				"default_batas_panjang": batasPanjang,
			},
		}

		err := models.UpdateMasterKlasifikasi(k.ID, update)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": fmt.Sprintf("Gagal mengupdate kelas %d", k.Kelas)})
		}

		lastBatasPanjang = batasPanjang
	}

	updatedData, _ := models.GetMasterKlasifikasiByTipeLokasi(req.TipeLokasi)
	return c.JSON(fiber.Map{
		"message": "Update bulk berhasil",
		"data":    updatedData,
	})
}
