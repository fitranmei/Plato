package controllers

import (
	"time"

	"github.com/gofiber/fiber/v2"

	"backend/models"
)

func GetMKJIAnalysis(c *fiber.Ctx) error {
	lokasiID := c.Params("lokasi_id")

	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	var startTime, endTime time.Time
	var err error

	if startTimeStr != "" {
		startTime, err = time.Parse(time.RFC3339, startTimeStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "format start_time tidak valid (gunakan RFC3339)"})
		}
	} else {
		startTime = time.Now().Add(-24 * time.Hour)
	}

	if endTimeStr != "" {
		endTime, err = time.Parse(time.RFC3339, endTimeStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "format end_time tidak valid (gunakan RFC3339)"})
		}
	} else {
		endTime = time.Now()
	}

	analysis, err := models.CalculateMKJIRealtime(lokasiID, startTime, endTime)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menghitung analisis MKJI: " + err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":       analysis,
		"start_time": startTime,
		"end_time":   endTime,
	})
}

func CreateMKJIAnalysis(c *fiber.Ctx) error {
	var req struct {
		LokasiID  string `json:"lokasi_id"`
		StartTime string `json:"start_time"`
		EndTime   string `json:"end_time"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if req.LokasiID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "lokasi_id diperlukan"})
	}

	var startTime, endTime time.Time
	var err error

	if req.StartTime != "" {
		startTime, err = time.Parse(time.RFC3339, req.StartTime)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "format start_time tidak valid (gunakan RFC3339)"})
		}
	} else {
		startTime = time.Now().Add(-24 * time.Hour)
	}

	if req.EndTime != "" {
		endTime, err = time.Parse(time.RFC3339, req.EndTime)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "format end_time tidak valid (gunakan RFC3339)"})
		}
	} else {
		endTime = time.Now()
	}

	analysis, err := models.CreateMKJIAnalysis(req.LokasiID, startTime, endTime)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membuat analisis MKJI: " + err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "analisis MKJI berhasil dibuat",
		"data":    analysis,
	})
}

func GetMKJIAnalysisHistory(c *fiber.Ctx) error {
	lokasiID := c.Params("lokasi_id")

	analysisList, err := models.GetMKJIAnalysisByLokasiID(lokasiID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengambil riwayat analisis MKJI"})
	}

	if analysisList == nil {
		analysisList = []models.MKJIAnalysis{}
	}

	return c.JSON(fiber.Map{
		"data":  analysisList,
		"count": len(analysisList),
	})
}

func GetMKJIAnalysisByID(c *fiber.Ctx) error {
	id := c.Params("id")

	analysis, err := models.GetMKJIAnalysisByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "analisis MKJI tidak ditemukan"})
	}

	return c.JSON(fiber.Map{"data": analysis})
}

func GetLatestMKJIAnalysis(c *fiber.Ctx) error {
	lokasiID := c.Params("lokasi_id")

	analysis, err := models.GetLatestMKJIAnalysisByLokasiID(lokasiID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "analisis MKJI tidak ditemukan"})
	}

	return c.JSON(fiber.Map{"data": analysis})
}

func GetKapasitasJalan(c *fiber.Ctx) error {
	lokasiID := c.Params("lokasi_id")

	location, err := models.GetLocationByID(lokasiID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "lokasi tidak ditemukan"})
	}

	kapasitas, co, fcw, fcsp, fcsf, fccs := models.HitungKapasitas(*location)

	return c.JSON(fiber.Map{
		"lokasi_id":       lokasiID,
		"nama_lokasi":     location.Nama_lokasi,
		"tipe_lokasi":     location.Tipe_lokasi,
		"tipe_arah":       location.Tipe_arah,
		"lebar_jalur":     location.Lebar_jalur,
		"persentase":      location.Persentase,
		"tipe_hambatan":   location.Tipe_hambatan,
		"kelas_hambatan":  location.Kelas_hambatan,
		"ukuran_kota":     location.Ukuran_kota,
		"kapasitas_dasar": co,
		"fcw":             fcw,
		"fcsp":            fcsp,
		"fcsf":            fcsf,
		"fccs":            fccs,
		"kapasitas":       kapasitas,
		"satuan":          "smp/jam",
	})
}

func GetMKJIMapping(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"kategori": fiber.Map{
			"MC": fiber.Map{
				"nama":      "Motorcycle",
				"deskripsi": "Sepeda Motor",
				"smp":       models.SMPValues[models.KategoriMC],
			},
			"LV": fiber.Map{
				"nama":      "Light Vehicle",
				"deskripsi": "Kendaraan Ringan (Sedan, Minibus, Pick-up, dll)",
				"smp":       models.SMPValues[models.KategoriLV],
			},
			"HV": fiber.Map{
				"nama":      "Heavy Vehicle",
				"deskripsi": "Kendaraan Berat (Bus Besar, Truk, dll)",
				"smp":       models.SMPValues[models.KategoriHV],
			},
			"UM": fiber.Map{
				"nama":      "Unmotorized",
				"deskripsi": "Kendaraan Tidak Bermotor (Becak, Sepeda)",
				"smp":       models.SMPValues[models.KategoriUM],
				"catatan":   "Dianggap sebagai hambatan samping, tidak dihitung dalam volume",
			},
		},
		"mapping_12_kelas": fiber.Map{
			"1":  fiber.Map{"nama": "Sepeda Motor", "kategori": "MC"},
			"2":  fiber.Map{"nama": "Sedan / Jeep / Minibus", "kategori": "LV"},
			"3":  fiber.Map{"nama": "Angkot / Microbus", "kategori": "LV"},
			"4":  fiber.Map{"nama": "Pick-up / Box Kecil", "kategori": "LV"},
			"5":  fiber.Map{"nama": "Bus Kecil (Metromini/Elf)", "kategori": "LV"},
			"6":  fiber.Map{"nama": "Bus Besar", "kategori": "HV"},
			"7":  fiber.Map{"nama": "Truk 2 Sumbu (Colt Diesel)", "kategori": "HV"},
			"8":  fiber.Map{"nama": "Truk 3 Sumbu", "kategori": "HV"},
			"9":  fiber.Map{"nama": "Truk Gandeng", "kategori": "HV"},
			"10": fiber.Map{"nama": "Truk Tempelan (Trailer)", "kategori": "HV"},
			"11": fiber.Map{"nama": "Kendaraan Tidak Bermotor", "kategori": "UM"},
			"12": fiber.Map{"nama": "Kendaraan Lainnya", "kategori": "LV"},
		},
		"tingkat_pelayanan": fiber.Map{
			"A": fiber.Map{"ds_max": 0.35, "deskripsi": "Arus bebas, kecepatan tinggi"},
			"B": fiber.Map{"ds_max": 0.55, "deskripsi": "Arus stabil, kecepatan sedikit terbatas"},
			"C": fiber.Map{"ds_max": 0.75, "deskripsi": "Arus stabil, kebebasan bergerak terbatas"},
			"D": fiber.Map{"ds_max": 0.85, "deskripsi": "Arus mendekati tidak stabil"},
			"E": fiber.Map{"ds_max": 1.00, "deskripsi": "Arus tidak stabil, kecepatan rendah"},
			"F": fiber.Map{"ds_max": 999, "deskripsi": "Arus terhenti, macet total"},
		},
	})
}
