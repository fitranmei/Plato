package services

import (
	"context"
	"log"
	"math/rand"
	"time"

	"backend/database"
	"backend/models"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type TrafficCollectorService struct {
	locationTickers map[string]*time.Ticker
	stopChan        chan bool
}

func NewTrafficCollectorService() *TrafficCollectorService {
	return &TrafficCollectorService{
		locationTickers: make(map[string]*time.Ticker),
		stopChan:        make(chan bool),
	}
}

func (s *TrafficCollectorService) Start() {
	log.Println("Traffic Collector Service started with per-location intervals")

	locations, err := s.getActiveLocations()
	if err != nil {
		log.Printf("Error getting active locations: %v", err)
		return
	}

	for _, location := range locations {
		s.startLocationCollector(location)
	}

	go s.monitorLocationChanges()
	go s.monitorInactiveLocations()
}

func (s *TrafficCollectorService) Stop() {
	for locationID, ticker := range s.locationTickers {
		if ticker != nil {
			ticker.Stop()
		}
		log.Printf("Stopped collector for location: %s", locationID)
	}
	s.locationTickers = make(map[string]*time.Ticker)
	s.stopChan <- true
}

func (s *TrafficCollectorService) startLocationCollector(location models.Location) {
	if ticker, exists := s.locationTickers[location.ID]; exists && ticker != nil {
		ticker.Stop()
	}

	intervalMinutes := location.Interval
	if intervalMinutes <= 0 {
		intervalMinutes = 1
	}

	log.Printf("Starting collector for location %s (%s) with interval: %d minutes",
		location.ID, location.Nama_lokasi, intervalMinutes)

	ticker := time.NewTicker(time.Duration(intervalMinutes) * time.Minute)
	s.locationTickers[location.ID] = ticker

	go func(loc models.Location, interval int) {
		s.collectTrafficForLocation(loc, interval)

		for {
			select {
			case <-ticker.C:
				s.collectTrafficForLocation(loc, interval)
			case <-s.stopChan:
				log.Printf("Stopping collector for location: %s", loc.ID)
				return
			}
		}
	}(location, intervalMinutes)
}

func (s *TrafficCollectorService) monitorLocationChanges() {
	monitorTicker := time.NewTicker(1 * time.Minute)
	defer monitorTicker.Stop()

	lastUpdateTime := make(map[string]time.Time)

	for {
		select {
		case <-monitorTicker.C:
			s.updateLocationCollectorsWithDynamicInterval(lastUpdateTime)
		case <-s.stopChan:
			return
		}
	}
}

func (s *TrafficCollectorService) updateLocationCollectorsWithDynamicInterval(lastUpdateTime map[string]time.Time) {
	locations, err := s.getActiveLocations()
	if err != nil {
		log.Printf("Error getting locations for update: %v", err)
		return
	}

	currentLocationIDs := make(map[string]bool)
	currentTime := time.Now()

	for _, location := range locations {
		currentLocationIDs[location.ID] = true

		lastUpdate, exists := lastUpdateTime[location.ID]
		intervalDuration := time.Duration(location.Interval) * time.Minute

		shouldUpdate := !exists || currentTime.Sub(lastUpdate) >= intervalDuration

		if shouldUpdate {
			if _, collectorExists := s.locationTickers[location.ID]; !collectorExists {
				log.Printf("New location detected: %s (interval: %d min), starting collector", location.ID, location.Interval)
				s.startLocationCollector(location)
			}
			lastUpdateTime[location.ID] = currentTime
			log.Printf("Location %s checked/updated (interval: %d min)", location.ID, location.Interval)
		}
	}

	for locationID, ticker := range s.locationTickers {
		if !currentLocationIDs[locationID] {
			log.Printf("Location %s no longer active, stopping collector", locationID)
			if ticker != nil {
				ticker.Stop()
			}
			delete(s.locationTickers, locationID)
			delete(lastUpdateTime, locationID)
		}
	}
}

func (s *TrafficCollectorService) getActiveLocations() ([]models.Location, error) {
	collection := database.DB.Collection("locations")

	filter := bson.M{"publik": true}

	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		return nil, err
	}

	var locations []models.Location
	if err = cursor.All(context.Background(), &locations); err != nil {
		return nil, err
	}

	log.Printf("Active public locations found: %d locations", len(locations))
	for _, loc := range locations {
		log.Printf("- %s (%s) - Publik: %v", loc.ID, loc.Nama_lokasi, loc.Publik)
	}

	return locations, nil
}

func (s *TrafficCollectorService) collectTrafficForLocation(location models.Location, intervalMinutes int) error {
	// Generate dummy data only for LOC-00001 (testing purposes)
	if location.ID != "LOC-00001" {
		log.Printf("Skipping data generation for location %s (only LOC-00001 gets dummy data)", location.ID)
		return nil
	}

	cameras, err := s.getCamerasByLokasiID(location.ID)
	if err != nil {
		return err
	}

	if len(cameras) == 0 {
		log.Printf("No cameras found for location %s", location.ID)
		return nil
	}

	klasifikasiList, err := s.getKlasifikasiByTipeLokasi(location.Tipe_lokasi)
	if err != nil {
		return err
	}

	zonaArahDataMap := make(map[string]*models.TrafficZonaArahData)

	for _, camera := range cameras {
		log.Printf("Generating traffic data for camera %s", camera.ID)
		for _, zonaArah := range camera.ZonaArah {
			kelasDataList := s.generateTrafficDataForZonaArah(klasifikasiList)

			totalKendaraan := 0
			for _, kd := range kelasDataList {
				totalKendaraan += kd.JumlahKendaraan
			}

			zonaArahDataMap[zonaArah.IDZonaArah] = &models.TrafficZonaArahData{
				IDZonaArah:     zonaArah.IDZonaArah,
				NamaArah:       zonaArah.Arah,
				KelasData:      kelasDataList,
				TotalKendaraan: totalKendaraan,
			}
		}
	}

	zonaArahDataList := make([]models.TrafficZonaArahData, 0, len(zonaArahDataMap))
	for _, data := range zonaArahDataMap {
		zonaArahDataList = append(zonaArahDataList, *data)
	}

	trafficData, err := models.CreateTrafficData(location.ID, zonaArahDataList, intervalMinutes)
	if err != nil {
		return err
	}

	err = models.UpdateLastDataReceived(location.ID, trafficData.Timestamp)
	if err != nil {
		log.Printf("Warning: Failed to update last data received for location %s: %v", location.ID, err)
	}

	log.Printf("Traffic data created for location %s (%s)", location.ID, location.Nama_lokasi)
	return nil
}

func (s *TrafficCollectorService) getCamerasByLokasiID(lokasiID string) ([]models.Camera, error) {
	collection := database.DB.Collection("cameras")

	cursor, err := collection.Find(context.Background(), bson.M{"lokasi_id": lokasiID})
	if err != nil {
		return nil, err
	}

	var cameras []models.Camera
	if err = cursor.All(context.Background(), &cameras); err != nil {
		return nil, err
	}

	return cameras, nil
}

func (s *TrafficCollectorService) getKlasifikasiByTipeLokasi(tipeLokasi string) ([]models.KlasifikasiKendaraan, error) {
	collection := database.DB.Collection("klasifikasi_kendaraan")

	cursor, err := collection.Find(context.Background(), bson.M{"tipe_lokasi": tipeLokasi})
	if err != nil {
		return nil, err
	}

	var klasifikasiList []models.KlasifikasiKendaraan
	if err = cursor.All(context.Background(), &klasifikasiList); err != nil {
		return nil, err
	}

	return klasifikasiList, nil
}

// nganu dummy data otomatis
func (s *TrafficCollectorService) generateTrafficDataForZonaArah(klasifikasiList []models.KlasifikasiKendaraan) []models.TrafficKelasDetail {
	kelasDataList := make([]models.TrafficKelasDetail, 0, len(klasifikasiList))

	for _, klasifikasi := range klasifikasiList {
		jumlahKendaraan := rand.Intn(51)

		kecepatanRataRata := 40.0 + rand.Float64()*40.0

		kelasDataList = append(kelasDataList, models.TrafficKelasDetail{
			IDKlasifikasi:     klasifikasi.ID,
			NamaKelas:         klasifikasi.NamaKelas,
			Kelas:             klasifikasi.Kelas,
			JumlahKendaraan:   jumlahKendaraan,
			KecepatanRataRata: kecepatanRataRata,
		})
	}

	return kelasDataList
}

func (s *TrafficCollectorService) CleanupOldData(retentionDays int) {
	log.Printf("Cleaning up traffic data older than %d days", retentionDays)

	beforeTime := time.Now().AddDate(0, 0, -retentionDays)
	deletedCount, err := models.DeleteOldTrafficData(beforeTime)
	if err != nil {
		log.Printf("Error cleaning up old data: %v", err)
		return
	}

	log.Printf("Deleted %d old traffic data records", deletedCount)
}

func (s *TrafficCollectorService) monitorInactiveLocations() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// nganu berapa lama lokasi tidak aktif
			err := models.CheckInactiveLocations(10 * time.Minute)
			if err != nil {
				log.Printf("Error checking inactive locations: %v", err)
			}
		case <-s.stopChan:
			log.Println("Stopping inactive location monitor")
			return
		}
	}
}
