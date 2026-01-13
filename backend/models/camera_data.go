package models

import (
	"context"
	"encoding/xml"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"backend/database"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type CameraXMLData struct {
	XMLName xml.Name      `xml:"Root"`
	API     string        `xml:"API"`
	Message CameraMessage `xml:"Message"`
	Image   string        `xml:"Image"`
}

type CameraMessage struct {
	Type string     `xml:"Type,attr"`
	Body CameraBody `xml:"Body"`
}

type CameraBody struct {
	Type         string       `xml:"Type,attr"`
	IntervalTime int          `xml:"IntervalTime,attr"`
	DataNumber   int          `xml:"DataNumber,attr"`
	Utc          string       `xml:"Utc,attr"`
	MilliSeconds int          `xml:"MilliSeconds,attr"`
	Zones        []CameraZone `xml:"Zone"`
}

type CameraZone struct {
	ZoneId     int           `xml:"ZoneId,attr"`
	Occupancy  float64       `xml:"Occupancy,attr"`
	Confidence float64       `xml:"Confidence,attr"`
	Length     float64       `xml:"Length,attr"`
	HeadWay    float64       `xml:"HeadWay,attr"`
	Density    float64       `xml:"Density,attr"`
	Classes    []CameraClass `xml:"Class"`
}

type CameraClass struct {
	ClassNr int     `xml:"ClassNr,attr"`
	NumVeh  int     `xml:"NumVeh,attr"`
	Speed   float64 `xml:"Speed,attr"`
	GapTime float64 `xml:"GapTime,attr"`
}

func ParseCameraXML(xmlData string) (*CameraXMLData, error) {
	xmlData = strings.ReplaceAll(xmlData, `\"`, `"`)
	xmlData = strings.TrimPrefix(xmlData, `"`)
	xmlData = strings.TrimSuffix(xmlData, `"`)

	if !strings.HasPrefix(strings.TrimSpace(xmlData), "<?xml") && !strings.HasPrefix(strings.TrimSpace(xmlData), "<Root") {
		xmlData = "<Root>" + xmlData + "</Root>"
	}

	var data CameraXMLData
	err := xml.Unmarshal([]byte(xmlData), &data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse XML: %v", err)
	}

	return &data, nil
}

func ValidateCameraAPIKey(apiKey string) (*Camera, error) {
	collection := database.DB.Collection("cameras")

	var camera Camera
	err := collection.FindOne(context.Background(), bson.M{"api_key": apiKey}).Decode(&camera)
	if err != nil {
		return nil, fmt.Errorf("invalid API key: %v", err)
	}

	return &camera, nil
}

func GetCameraByAPIKey(apiKey string) (*Camera, error) {
	collection := database.DB.Collection("cameras")

	var camera Camera
	err := collection.FindOne(context.Background(), bson.M{"api_key": apiKey}).Decode(&camera)
	if err != nil {
		return nil, err
	}

	return &camera, nil
}

func ConvertCameraDataToTrafficData(cameraData *CameraXMLData, camera *Camera) (*TrafficData, error) {
	location, err := GetLocationByID(camera.LokasiID)
	if err != nil {
		return nil, fmt.Errorf("failed to get location: %v", err)
	}

	klasifikasiList, err := GetMasterKlasifikasiByTipeLokasi(location.Tipe_lokasi)
	if err != nil {
		log.Printf("Warning: failed to get klasifikasi: %v", err)
	}

	klasifikasiMap := make(map[int]KlasifikasiKendaraan)
	for _, k := range klasifikasiList {
		klasifikasiMap[k.Kelas] = k
	}

	// Build a map of configured zona_arah from camera
	configuredZonaMap := make(map[int]CameraZonaArah)
	for i, za := range camera.ZonaArah {
		configuredZonaMap[i+1] = za // ZoneId is 1-based
	}

	// Build a map of incoming zones from camera data
	incomingZonesMap := make(map[int]CameraZone)
	for _, zone := range cameraData.Message.Body.Zones {
		incomingZonesMap[zone.ZoneId] = zone
	}

	// Check for extra zones (zones in incoming data but not in camera config)
	var extraZones []int
	for zoneId := range incomingZonesMap {
		if _, exists := configuredZonaMap[zoneId]; !exists {
			extraZones = append(extraZones, zoneId)
		}
	}
	if len(extraZones) > 0 {
		log.Printf("WARNING [TrafficData - Camera %s]: Data diterima dengan zona berlebih yang tidak terdaftar di kamera: %v. Data zona tersebut tidak akan diproses.", camera.ID, extraZones)
	}

	// Check for missing zones (zones in camera config but not in incoming data)
	var missingZones []int
	for zoneId := range configuredZonaMap {
		if _, exists := incomingZonesMap[zoneId]; !exists {
			missingZones = append(missingZones, zoneId)
		}
	}
	if len(missingZones) > 0 {
		log.Printf("WARNING [TrafficData - Camera %s]: Data diterima tanpa zona yang terdaftar di kamera: %v. Zona tersebut akan diset ke 0.", camera.ID, missingZones)
	}

	var zonaArahData []TrafficZonaArahData

	// Process only zones that are configured in the camera
	for zoneId, zonaArahConfig := range configuredZonaMap {
		var kelasData []TrafficKelasDetail
		totalKendaraan := 0

		// Check if we have data for this zone
		if zone, exists := incomingZonesMap[zoneId]; exists {
			for _, class := range zone.Classes {
				var idKlasifikasi, namaKelas string
				if k, exists := klasifikasiMap[class.ClassNr]; exists {
					idKlasifikasi = k.ID
					namaKelas = k.NamaKelas
				} else {
					idKlasifikasi = fmt.Sprintf("KK-%s-%d", location.Tipe_lokasi, class.ClassNr)
					namaKelas = fmt.Sprintf("Kelas %d", class.ClassNr)
				}

				kelasDetail := TrafficKelasDetail{
					IDKlasifikasi:     idKlasifikasi,
					NamaKelas:         namaKelas,
					Kelas:             class.ClassNr,
					JumlahKendaraan:   class.NumVeh,
					KecepatanRataRata: class.Speed,
				}
				kelasData = append(kelasData, kelasDetail)
				totalKendaraan += class.NumVeh
			}
		} else {
			// Zone is missing from incoming data, initialize with empty kelas data
			kelasData = []TrafficKelasDetail{}
			totalKendaraan = 0
		}

		zonaArah := TrafficZonaArahData{
			IDZonaArah:     zonaArahConfig.IDZonaArah,
			NamaArah:       zonaArahConfig.Arah,
			KelasData:      kelasData,
			TotalKendaraan: totalKendaraan,
		}
		zonaArahData = append(zonaArahData, zonaArah)
	}

	intervalMenit := cameraData.Message.Body.IntervalTime / 60
	if intervalMenit <= 0 {
		intervalMenit = 5
	}

	var timestamp time.Time

	if cameraData.Message.Body.Utc != "" && cameraData.Message.Body.Utc != "$utcVar" {
		utcValue := cameraData.Message.Body.Utc

		var zoneOffset int64
		var parsed bool

		if offset, err := strconv.ParseInt(utcValue, 10, 64); err == nil && offset >= -12 && offset <= 14 {
			zoneOffset = offset
			parsed = true
		} else if len(utcValue) >= 4 && (utcValue[:3] == "utc" || utcValue[:3] == "UTC") {
			if offset, err := strconv.ParseInt(utcValue[3:], 10, 64); err == nil && offset >= -12 && offset <= 14 {
				zoneOffset = offset
				parsed = true
			}
		}

		if parsed {
			offsetDuration := time.Duration(zoneOffset * int64(time.Hour))
			timestamp = time.Now().UTC().Add(offsetDuration)
		} else {
			timestamp = time.Now().UTC()
			if location.Zona_waktu != 0 {
				offsetDuration := time.Duration(location.Zona_waktu * float64(time.Hour))
				timestamp = timestamp.Add(offsetDuration)
			}
		}
	} else {
		timestamp = time.Now().UTC()
		if location.Zona_waktu != 0 {
			offsetDuration := time.Duration(location.Zona_waktu * float64(time.Hour))
			timestamp = timestamp.Add(offsetDuration)
		}
	}

	id, err := NextTrafficDataID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate traffic data ID: %v", err)
	}

	totalKendaraan := 0
	for _, za := range zonaArahData {
		totalKendaraan += za.TotalKendaraan
	}

	trafficData := &TrafficData{
		ID:             id,
		LokasiID:       camera.LokasiID,
		NamaLokasi:     location.Nama_lokasi,
		TipeLokasi:     location.Tipe_lokasi,
		Timestamp:      timestamp,
		ZonaArahData:   zonaArahData,
		TotalKendaraan: totalKendaraan,
		IntervalMenit:  intervalMenit,
	}

	return trafficData, nil
}

func SaveCameraTrafficData(trafficData *TrafficData) error {
	collection := database.DB.Collection("traffic_data")

	_, err := collection.InsertOne(context.Background(), trafficData)
	if err != nil {
		return fmt.Errorf("failed to save traffic data: %v", err)
	}

	log.Printf("Saved traffic data from camera: ID=%s, Location=%s, Total=%d vehicles",
		trafficData.ID, trafficData.NamaLokasi, trafficData.TotalKendaraan)

	// MongoDB menyimpan waktu dalam UTC, jadi kita simpan waktu lokal (UTC+7)
	localTime := time.Now().Add(7 * time.Hour)
	err = UpdateLocationOnDataReceived(trafficData.LokasiID, localTime)
	if err != nil {
		log.Printf("Warning: failed to update location status: %v", err)
	}

	return nil
}

func ProcessCameraData(xmlData string) (*TrafficData, error) {

	cameraData, err := ParseCameraXML(xmlData)
	if err != nil {
		return nil, fmt.Errorf("failed to parse camera data: %v", err)
	}

	camera, err := ValidateCameraAPIKey(cameraData.API)
	if err != nil {
		return nil, fmt.Errorf("API key validation failed: %v", err)
	}

	// Update location source image if provided in XML
	if cameraData.Image != "" && cameraData.Image != "base64" {
		go UpdateLocationSourceImage(camera.LokasiID, cameraData.Image)
	}

	rawData, err := SaveRawDataFromCamera(cameraData, camera)
	if err != nil {
		log.Printf("Warning: failed to save raw data: %v", err)
	}

	trafficData, err := ConvertCameraDataToTrafficData(cameraData, camera)
	if err != nil {
		return nil, fmt.Errorf("failed to convert camera data: %v", err)
	}

	if rawData != nil {
		trafficData.RawDataID = rawData.ID
	}

	// Calculate both MKJI 1997 and PKJI 2023 analysis
	mkjiAnalysis, err := CalculateRealTimeMKJI(trafficData, camera.LokasiID)
	if err != nil {
		log.Printf("Warning: failed to calculate MKJI: %v", err)
	} else {
		trafficData.MKJIAnalysis = mkjiAnalysis
	}

	pkjiAnalysis, err := CalculateRealTimePKJI(trafficData, camera.LokasiID)
	if err != nil {
		log.Printf("Warning: failed to calculate PKJI: %v", err)
	} else {
		trafficData.PKJIAnalysis = pkjiAnalysis
	}

	if rawData != nil {
		_ = MarkRawDataAsProcessed(rawData.ID, trafficData.ID)
	}

	err = SaveCameraTrafficData(trafficData)
	if err != nil {
		return nil, fmt.Errorf("failed to save traffic data: %v", err)
	}

	return trafficData, nil
}

func SaveRawDataFromCamera(cameraData *CameraXMLData, camera *Camera) (*TrafficRawData, error) {
	location, err := GetLocationByID(camera.LokasiID)
	if err != nil {
		return nil, fmt.Errorf("failed to get location: %v", err)
	}

	var timestamp time.Time

	if cameraData.Message.Body.Utc != "" && cameraData.Message.Body.Utc != "$utcVar" {
		utcValue := cameraData.Message.Body.Utc

		var zoneOffset int64
		var parsed bool

		if offset, err := strconv.ParseInt(utcValue, 10, 64); err == nil && offset >= -12 && offset <= 14 {
			zoneOffset = offset
			parsed = true
		} else if len(utcValue) >= 4 && (utcValue[:3] == "utc" || utcValue[:3] == "UTC") {
			if offset, err := strconv.ParseInt(utcValue[3:], 10, 64); err == nil && offset >= -12 && offset <= 14 {
				zoneOffset = offset
				parsed = true
			}
		}

		if parsed {
			offsetDuration := time.Duration(zoneOffset * int64(time.Hour))
			timestamp = time.Now().UTC().Add(offsetDuration)
			log.Printf("Raw data timestamp: Using server time at UTC%+d", zoneOffset)
		} else {
			timestamp = time.Now().UTC()
			if location.Zona_waktu != 0 {
				offsetDuration := time.Duration(location.Zona_waktu * float64(time.Hour))
				timestamp = timestamp.Add(offsetDuration)
				log.Printf("Raw data timestamp: Invalid Utc format, using server time + zona_waktu from location (%.1f)", location.Zona_waktu)
			} else {
				log.Printf("Raw data timestamp: Invalid Utc format, using server UTC time")
			}
		}
	} else {
		timestamp = time.Now().UTC()
		if location.Zona_waktu != 0 {
			offsetDuration := time.Duration(location.Zona_waktu * float64(time.Hour))
			timestamp = timestamp.Add(offsetDuration)
			log.Printf("Raw data timestamp: Using server time + zona_waktu from location (%.1f)", location.Zona_waktu)
		} else {
			log.Printf("Raw data timestamp: Using server UTC time")
		}
	}

	intervalMenit := cameraData.Message.Body.IntervalTime / 60
	if intervalMenit <= 0 {
		intervalMenit = 5
	}

	// Build a map of configured zona_arah from camera
	configuredZonaMap := make(map[int]CameraZonaArah)
	for i, za := range camera.ZonaArah {
		configuredZonaMap[i+1] = za // ZoneId is 1-based
	}

	// Build a map of incoming zones from camera data
	incomingZonesMap := make(map[int]CameraZone)
	for _, zone := range cameraData.Message.Body.Zones {
		incomingZonesMap[zone.ZoneId] = zone
	}

	// Check for extra zones (zones in incoming data but not in camera config)
	var extraZones []int
	for zoneId := range incomingZonesMap {
		if _, exists := configuredZonaMap[zoneId]; !exists {
			extraZones = append(extraZones, zoneId)
		}
	}
	if len(extraZones) > 0 {
		log.Printf("WARNING [Camera %s]: Data diterima dengan zona berlebih yang tidak terdaftar di kamera: %v. Data zona tersebut tidak akan diproses.", camera.ID, extraZones)
	}

	// Check for missing zones (zones in camera config but not in incoming data)
	var missingZones []int
	for zoneId := range configuredZonaMap {
		if _, exists := incomingZonesMap[zoneId]; !exists {
			missingZones = append(missingZones, zoneId)
		}
	}
	if len(missingZones) > 0 {
		log.Printf("WARNING [Camera %s]: Data diterima tanpa zona yang terdaftar di kamera: %v. Zona tersebut akan diset ke 0.", camera.ID, missingZones)
	}

	var zonaData []RawZonaData
	totalKendaraan := 0

	// Process only zones that are configured in the camera
	for zoneId, zonaArahConfig := range configuredZonaMap {
		var kelasData []RawKelasData
		zonaTotalKendaraan := 0
		var occupancy, confidence, length, headway, density float64

		// Check if we have data for this zone
		if zone, exists := incomingZonesMap[zoneId]; exists {
			for _, class := range zone.Classes {
				kelasData = append(kelasData, RawKelasData{
					Kelas:           class.ClassNr,
					JumlahKendaraan: class.NumVeh,
					Kecepatan:       class.Speed,
					GapTime:         class.GapTime,
				})
				zonaTotalKendaraan += class.NumVeh
			}
			occupancy = zone.Occupancy
			confidence = zone.Confidence
			length = zone.Length
			headway = zone.HeadWay
			density = zone.Density
		} else {
			// Zone is missing from incoming data, initialize with zeros
			kelasData = []RawKelasData{}
			zonaTotalKendaraan = 0
			occupancy = 0
			confidence = 0
			length = 0
			headway = 0
			density = 0
		}

		zonaData = append(zonaData, RawZonaData{
			IDZonaArah:     zonaArahConfig.IDZonaArah,
			ZonaID:         zoneId,
			NamaArah:       zonaArahConfig.Arah,
			Occupancy:      occupancy,
			Confidence:     confidence,
			Length:         length,
			HeadWay:        headway,
			Density:        density,
			KelasData:      kelasData,
			TotalKendaraan: zonaTotalKendaraan,
		})
		totalKendaraan += zonaTotalKendaraan
	}

	rawData, err := SaveRawData(camera.LokasiID, camera.ID, timestamp, zonaData, intervalMenit, totalKendaraan)
	if err != nil {
		return nil, err
	}

	return rawData, nil
}

func CalculateRealTimeMKJI(trafficData *TrafficData, lokasiID string) (*TrafficMKJIAnalysis, error) {
	location, err := GetLocationByID(lokasiID)
	if err != nil {
		return nil, fmt.Errorf("failed to get location: %v", err)
	}

	var mc, lv, hv, um int
	for _, za := range trafficData.ZonaArahData {
		for _, kd := range za.KelasData {
			kategori := GetKategoriMKJI(trafficData.TipeLokasi, kd.Kelas)
			switch kategori {
			case KategoriMC:
				mc += kd.JumlahKendaraan
			case KategoriLV:
				lv += kd.JumlahKendaraan
			case KategoriHV:
				hv += kd.JumlahKendaraan
			case KategoriUM:
				um += kd.JumlahKendaraan
			}
		}
	}

	totalMotor := mc + lv + hv

	totalSMP := float64(mc)*SMPValues[KategoriMC] +
		float64(lv)*SMPValues[KategoriLV] +
		float64(hv)*SMPValues[KategoriHV]

	intervalMenit := trafficData.IntervalMenit
	if intervalMenit <= 0 {
		intervalMenit = 5
	}
	multiplier := 60.0 / float64(intervalMenit)
	arusSMP := totalSMP * multiplier

	kapasitasDasar := GetKapasitasDasar(location.Tipe_arah, location.Tipe_lokasi)
	fcw := GetFCW(location.Lebar_jalur, location.Tipe_arah)
	fcsp := GetFCSP(location.Persentase, location.Tipe_arah)

	var fcsf, fccs float64
	var kapasitas float64

	switch location.Tipe_lokasi {
	case "perkotaan":
		fcsf = GetFCSF(location.Tipe_hambatan, location.Kelas_hambatan, 1.5)
		fccs = GetFCCS(location.Ukuran_kota)
		kapasitas = kapasitasDasar * fcw * fcsp * fcsf * fccs

	case "luar_kota", "12_kelas":
		fcsf = GetFCSF(location.Tipe_hambatan, location.Kelas_hambatan, 1.5)
		fccs = 1.0
		kapasitas = kapasitasDasar * fcw * fcsp * fcsf

	case "bebas_hambatan":
		fcsf = 1.0
		fccs = 1.0
		kapasitas = kapasitasDasar * fcw * fcsp

	default:
		fcsf = GetFCSF(location.Tipe_hambatan, location.Kelas_hambatan, 1.5)
		fccs = GetFCCS(location.Ukuran_kota)
		kapasitas = kapasitasDasar * fcw * fcsp * fcsf * fccs
	}

	derajatKejenuhan := 0.0
	if kapasitas > 0 {
		derajatKejenuhan = arusSMP / kapasitas
	}

	tingkatPelayanan, keterangan := GetTingkatPelayanan(derajatKejenuhan)

	mkjiAnalysis := &TrafficMKJIAnalysis{
		MC:               mc,
		LV:               lv,
		HV:               hv,
		UM:               um,
		TotalMotor:       totalMotor,
		TotalSMP:         totalSMP,
		ArusSMP:          arusSMP,
		KapasitasDasar:   kapasitasDasar,
		FCW:              fcw,
		FCSP:             fcsp,
		FCSF:             fcsf,
		FCCS:             fccs,
		Kapasitas:        kapasitas,
		DerajatKejenuhan: derajatKejenuhan,
		TingkatPelayanan: tingkatPelayanan,
		Keterangan:       keterangan,
	}

	log.Printf("MKJI Analysis: MC=%d, LV=%d, HV=%d, UM=%d, SMP=%.2f, Q=%.2f smp/jam, C=%.2f, DS=%.3f, LoS=%s",
		mc, lv, hv, um, totalSMP, arusSMP, kapasitas, derajatKejenuhan, tingkatPelayanan)

	return mkjiAnalysis, nil
}

func CalculateRealTimePKJI(trafficData *TrafficData, lokasiID string) (*TrafficPKJIAnalysis, error) {
	location, err := GetLocationByID(lokasiID)
	if err != nil {
		return nil, fmt.Errorf("failed to get location: %v", err)
	}

	var sm, kr, kb, ktb int
	for _, za := range trafficData.ZonaArahData {
		for _, kd := range za.KelasData {
			kategori := GetKategoriPKJI(trafficData.TipeLokasi, kd.Kelas)
			switch kategori {
			case KategoriSM:
				sm += kd.JumlahKendaraan
			case KategoriKR:
				kr += kd.JumlahKendaraan
			case KategoriKB:
				kb += kd.JumlahKendaraan
			case KategoriKTB:
				ktb += kd.JumlahKendaraan
			}
		}
	}

	totalMotor := sm + kr + kb

	totalSKR := float64(sm)*GetEMPPKJI(KategoriSM, trafficData.TipeLokasi) +
		float64(kr)*GetEMPPKJI(KategoriKR, trafficData.TipeLokasi) +
		float64(kb)*GetEMPPKJI(KategoriKB, trafficData.TipeLokasi)

	intervalMenit := trafficData.IntervalMenit
	if intervalMenit <= 0 {
		intervalMenit = 5
	}
	multiplier := 60.0 / float64(intervalMenit)
	volumeSKR := totalSKR * multiplier

	kapasitas, c0, fclj, fcpa, fchs, fcuk := HitungKapasitasPKJI(*location)

	derajatKejenuhan := 0.0
	if kapasitas > 0 {
		derajatKejenuhan = volumeSKR / kapasitas
	}

	tingkatPelayanan, keterangan := GetTingkatPelayananPKJI(derajatKejenuhan)

	pkjiAnalysis := &TrafficPKJIAnalysis{
		SM:               sm,
		KR:               kr,
		KB:               kb,
		KTB:              ktb,
		TotalMotor:       totalMotor,
		TotalSKR:         totalSKR,
		VolumeSKR:        volumeSKR,
		KapasitasDasar:   c0,
		FCLJ:             fclj,
		FCPA:             fcpa,
		FCHS:             fchs,
		FCUK:             fcuk,
		Kapasitas:        kapasitas,
		DerajatKejenuhan: derajatKejenuhan,
		TingkatPelayanan: tingkatPelayanan,
		Keterangan:       keterangan,
	}

	log.Printf("PKJI Analysis: SM=%d, KR=%d, KB=%d, KTB=%d, SKR=%.2f, V=%.2f skr/jam, C=%.2f, DJ=%.3f, LoS=%s",
		sm, kr, kb, ktb, totalSKR, volumeSKR, kapasitas, derajatKejenuhan, tingkatPelayanan)

	return pkjiAnalysis, nil
}
