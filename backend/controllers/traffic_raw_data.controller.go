package controllers

import (
	"fmt"
	"strconv"
	"time"

	"backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/xuri/excelize/v2"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetRawDataByID(c *fiber.Ctx) error {
	id := c.Params("id")

	rawData, err := models.GetRawDataByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":   "raw data tidak ditemukan",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    rawData,
	})
}

func GetRawDataByLokasiID(c *fiber.Ctx) error {
	lokasiID := c.Params("lokasi_id")

	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	var startTime, endTime time.Time
	var err error

	if startTimeStr != "" {
		startTime, err = time.Parse(time.RFC3339, startTimeStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "format start_time tidak valid (gunakan RFC3339)",
				"success": false,
			})
		}
	} else {
		startTime = time.Now().Add(-24 * time.Hour)
	}

	if endTimeStr != "" {
		endTime, err = time.Parse(time.RFC3339, endTimeStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "format end_time tidak valid (gunakan RFC3339)",
				"success": false,
			})
		}
	} else {
		endTime = time.Now()
	}

	rawDataList, err := models.GetRawDataByLokasiID(lokasiID, startTime, endTime)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal mengambil raw data",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success":    true,
		"data":       rawDataList,
		"count":      len(rawDataList),
		"start_time": startTime,
		"end_time":   endTime,
	})
}

func GetAllRawData(c *fiber.Ctx) error {
	lokasiID := c.Query("lokasi_id")
	cameraID := c.Query("camera_id")
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")
	limitStr := c.Query("limit", "100")
	isProcessedStr := c.Query("is_processed")

	filter := bson.M{}

	if lokasiID != "" {
		filter["lokasi_id"] = lokasiID
	}

	if cameraID != "" {
		filter["camera_id"] = cameraID
	}

	if isProcessedStr != "" {
		isProcessed := isProcessedStr == "true"
		filter["is_processed"] = isProcessed
	}

	if startTimeStr != "" && endTimeStr != "" {
		startTime, err1 := time.Parse(time.RFC3339, startTimeStr)
		endTime, err2 := time.Parse(time.RFC3339, endTimeStr)

		if err1 == nil && err2 == nil {
			filter["timestamp"] = bson.M{
				"$gte": startTime,
				"$lte": endTime,
			}
		}
	}

	var limit int64
	limitInt, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 100
	} else {
		limit = int64(limitInt)
	}

	findOptions := options.Find().
		SetSort(bson.D{{Key: "timestamp", Value: -1}}).
		SetLimit(limit)

	collection := models.GetRawDataCollection()
	cursor, err := collection.Find(c.Context(), filter, findOptions)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal mengambil raw data",
			"success": false,
		})
	}

	var rawDataList []models.TrafficRawData
	if err = cursor.All(c.Context(), &rawDataList); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal parsing raw data",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    rawDataList,
		"count":   len(rawDataList),
	})
}

func GetUnprocessedRawData(c *fiber.Ctx) error {
	limitStr := c.Query("limit", "50")

	var limit int64
	limitInt, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 50
	} else {
		limit = int64(limitInt)
	}

	rawDataList, err := models.GetUnprocessedRawData(limit)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal mengambil unprocessed raw data",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    rawDataList,
		"count":   len(rawDataList),
	})
}

func DeleteRawData(c *fiber.Ctx) error {
	id := c.Params("id")

	collection := models.GetRawDataCollection()
	result, err := collection.DeleteOne(c.Context(), bson.M{"_id": id})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal menghapus raw data",
			"success": false,
		})
	}

	if result.DeletedCount == 0 {
		return c.Status(404).JSON(fiber.Map{
			"error":   "raw data tidak ditemukan",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "raw data berhasil dihapus",
	})
}

func CleanupOldRawData(c *fiber.Ctx) error {
	daysStr := c.Query("days", "30")
	days, err := strconv.Atoi(daysStr)
	if err != nil {
		days = 30
	}

	beforeTime := time.Now().AddDate(0, 0, -days)
	deletedCount, err := models.DeleteOldRawData(beforeTime)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal menghapus raw data lama",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success":       true,
		"message":       "raw data lama berhasil dihapus",
		"deleted_count": deletedCount,
		"before_date":   beforeTime,
	})
}

func ExportRawDataToExcel(c *fiber.Ctx) error {
	// Validasi parameter yang diperlukan
	lokasiID := c.Query("lokasi_id")
	if lokasiID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "lokasi_id harus diisi",
			"success": false,
		})
	}

	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	if startTimeStr == "" || endTimeStr == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "start_time dan end_time harus diisi",
			"success": false,
		})
	}

	// Parse waktu
	startTime, err := time.Parse(time.RFC3339, startTimeStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "format start_time tidak valid (gunakan RFC3339, contoh: 2026-01-01T00:00:00Z)",
			"success": false,
		})
	}

	endTime, err := time.Parse(time.RFC3339, endTimeStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "format end_time tidak valid (gunakan RFC3339, contoh: 2026-01-08T23:59:59Z)",
			"success": false,
		})
	}

	// Ambil data dari database
	rawDataList, err := models.GetRawDataByLokasiID(lokasiID, startTime, endTime)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal mengambil raw data",
			"success": false,
		})
	}

	if len(rawDataList) == 0 {
		return c.Status(404).JSON(fiber.Map{
			"error":   "tidak ada data untuk lokasi dan periode waktu yang dipilih",
			"success": false,
		})
	}

	// Ambil info lokasi
	lokasi, err := models.GetLocationByID(lokasiID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal mengambil informasi lokasi",
			"success": false,
		})
	}

	// Buat file Excel
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	// Buat sheet baru
	sheetName := "Summary Data"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal membuat sheet Excel",
			"success": false,
		})
	}

	// Set sheet aktif
	f.SetActiveSheet(index)

	// Hapus Sheet1 default
	f.DeleteSheet("Sheet1")

	// Styles
	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
			Size: 14,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "left",
			Vertical:   "center",
		},
	})

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold: true,
			Size: 11,
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"#D9E1F2"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
			WrapText:   true,
		},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
		},
	})

	dataStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
		},
	})

	// Tulis Title dan Info
	f.SetCellValue(sheetName, "A1", "SUMMARY DATA KAMERA "+lokasi.Nama_lokasi)
	f.SetCellStyle(sheetName, "A1", "A1", titleStyle)

	f.SetCellValue(sheetName, "A2", "LOKASI : "+lokasi.Nama_lokasi)
	f.SetCellStyle(sheetName, "A2", "A2", titleStyle)

	// Waktu cetak dengan format WIB
	waktuCetak := time.Now()
	// Convert ke WIB (UTC+7)
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		// Fallback jika tzdata tidak tersedia
		loc = time.FixedZone("WIB", 7*60*60)
	}
	waktuCetakWIB := waktuCetak.In(loc)
	f.SetCellValue(sheetName, "A4", "DICETAK TANGGAL : "+waktuCetakWIB.Format("02-01-2006 15:04:05")+" WIB")

	// Ambil semua zona unik dari data
	zonaMap := make(map[string]string) // map[IDZonaArah]NamaArah
	for _, data := range rawDataList {
		for _, zona := range data.ZonaData {
			if _, exists := zonaMap[zona.IDZonaArah]; !exists {
				zonaMap[zona.IDZonaArah] = zona.NamaArah
			}
		}
	}

	// Convert map to slice untuk sorting
	type ZonaInfo struct {
		ID   string
		Nama string
	}
	var zonas []ZonaInfo
	for id, nama := range zonaMap {
		zonas = append(zonas, ZonaInfo{ID: id, Nama: nama})
	}

	// Header row dimulai dari row 6
	headerRow := 6
	currentCol := 1

	// Set header "No"
	f.SetCellValue(sheetName, fmt.Sprintf("A%d", headerRow), "No")
	f.MergeCell(sheetName, fmt.Sprintf("A%d", headerRow), fmt.Sprintf("A%d", headerRow+1))
	f.SetCellStyle(sheetName, fmt.Sprintf("A%d", headerRow), fmt.Sprintf("A%d", headerRow+1), headerStyle)
	f.SetColWidth(sheetName, "A", "A", 5)

	// Set header "Timestamp"
	f.SetCellValue(sheetName, fmt.Sprintf("B%d", headerRow), "Timestamp")
	f.MergeCell(sheetName, fmt.Sprintf("B%d", headerRow), fmt.Sprintf("B%d", headerRow+1))
	f.SetCellStyle(sheetName, fmt.Sprintf("B%d", headerRow), fmt.Sprintf("B%d", headerRow+1), headerStyle)
	f.SetColWidth(sheetName, "B", "B", 18)

	currentCol = 3 // Mulai dari kolom C

	// Untuk setiap zona, buat header group
	for _, zona := range zonas {
		startCol := currentCol
		endCol := currentCol + 9 // 5 kelas jumlah + 5 kelas kecepatan = 10 kolom

		// Merge cell untuk nama zona (row 6)
		startCell, _ := excelize.CoordinatesToCellName(startCol, headerRow)
		endCell, _ := excelize.CoordinatesToCellName(endCol, headerRow)
		f.MergeCell(sheetName, startCell, endCell)
		f.SetCellValue(sheetName, startCell, "Arah ke "+zona.Nama)
		f.SetCellStyle(sheetName, startCell, endCell, headerStyle)

		// Sub header untuk Jumlah Kendaraan (5 kolom)
		jumlahStartCol := startCol
		jumlahEndCol := startCol + 4
		jumlahStartCell, _ := excelize.CoordinatesToCellName(jumlahStartCol, headerRow+1)
		jumlahEndCell, _ := excelize.CoordinatesToCellName(jumlahEndCol, headerRow+1)
		f.MergeCell(sheetName, jumlahStartCell, jumlahEndCell)
		f.SetCellValue(sheetName, jumlahStartCell, "Jumlah Kendaraan (unit)")
		f.SetCellStyle(sheetName, jumlahStartCell, jumlahEndCell, headerStyle)

		// Sub header untuk Kecepatan (5 kolom)
		kecepatanStartCol := startCol + 5
		kecepatanEndCol := startCol + 9
		kecepatanStartCell, _ := excelize.CoordinatesToCellName(kecepatanStartCol, headerRow+1)
		kecepatanEndCell, _ := excelize.CoordinatesToCellName(kecepatanEndCol, headerRow+1)
		f.MergeCell(sheetName, kecepatanStartCell, kecepatanEndCell)
		f.SetCellValue(sheetName, kecepatanStartCell, "Kecepatan Rata-Rata (Km/h)")
		f.SetCellStyle(sheetName, kecepatanStartCell, kecepatanEndCell, headerStyle)

		// Header Kelas 1-5 untuk Jumlah Kendaraan (row 8)
		for i := 0; i < 5; i++ {
			cellName, _ := excelize.CoordinatesToCellName(jumlahStartCol+i, headerRow+2)
			f.SetCellValue(sheetName, cellName, fmt.Sprintf("Kelas %d", i+1))
			f.SetCellStyle(sheetName, cellName, cellName, headerStyle)
			colName, _ := excelize.ColumnNumberToName(jumlahStartCol + i)
			f.SetColWidth(sheetName, colName, colName, 10)
		}

		// Header Kelas 1-5 untuk Kecepatan (row 8)
		for i := 0; i < 5; i++ {
			cellName, _ := excelize.CoordinatesToCellName(kecepatanStartCol+i, headerRow+2)
			f.SetCellValue(sheetName, cellName, fmt.Sprintf("Kelas %d", i+1))
			f.SetCellStyle(sheetName, cellName, cellName, headerStyle)
			colName, _ := excelize.ColumnNumberToName(kecepatanStartCol + i)
			f.SetColWidth(sheetName, colName, colName, 10)
		}

		currentCol = endCol + 1
	}

	// Tulis data
	dataRow := headerRow + 3 // Mulai dari row 9
	no := 1

	for _, data := range rawDataList {
		// Kolom No
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", dataRow), no)
		f.SetCellStyle(sheetName, fmt.Sprintf("A%d", dataRow), fmt.Sprintf("A%d", dataRow), dataStyle)

		// Kolom Timestamp
		timestampStr := data.Timestamp.Format("2006-01-02 15:04:05")
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", dataRow), timestampStr)
		f.SetCellStyle(sheetName, fmt.Sprintf("B%d", dataRow), fmt.Sprintf("B%d", dataRow), dataStyle)

		// Untuk setiap zona
		currentCol = 3
		for _, zona := range zonas {
			// Cari data zona yang sesuai
			var zonaData *models.RawZonaData
			for i := range data.ZonaData {
				if data.ZonaData[i].IDZonaArah == zona.ID {
					zonaData = &data.ZonaData[i]
					break
				}
			}

			// Buat map kelas untuk data zona ini
			kelasDataMap := make(map[int]models.RawKelasData)
			if zonaData != nil {
				for _, kd := range zonaData.KelasData {
					kelasDataMap[kd.Kelas] = kd
				}
			}

			// Tulis Jumlah Kendaraan untuk kelas 1-5
			for kelas := 1; kelas <= 5; kelas++ {
				cellName, _ := excelize.CoordinatesToCellName(currentCol, dataRow)
				if kd, exists := kelasDataMap[kelas]; exists {
					f.SetCellValue(sheetName, cellName, kd.JumlahKendaraan)
				} else {
					f.SetCellValue(sheetName, cellName, 0)
				}
				f.SetCellStyle(sheetName, cellName, cellName, dataStyle)
				currentCol++
			}

			// Tulis Kecepatan untuk kelas 1-5
			for kelas := 1; kelas <= 5; kelas++ {
				cellName, _ := excelize.CoordinatesToCellName(currentCol, dataRow)
				if kd, exists := kelasDataMap[kelas]; exists {
					f.SetCellValue(sheetName, cellName, kd.Kecepatan)
				} else {
					f.SetCellValue(sheetName, cellName, 0)
				}
				f.SetCellStyle(sheetName, cellName, cellName, dataStyle)
				currentCol++
			}
		}

		dataRow++
		no++
		currentCol = 3 // Reset untuk row berikutnya
	}

	// Simpan ke buffer
	buffer, err := f.WriteToBuffer()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "gagal membuat file Excel",
			"success": false,
		})
	}

	// Set response header untuk download file
	fileName := fmt.Sprintf("summary_data_%s_%s.xlsx",
		lokasi.Nama_lokasi,
		time.Now().Format("20060102_150405"))

	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
	c.Set("Content-Length", fmt.Sprintf("%d", buffer.Len()))

	return c.Send(buffer.Bytes())
}
