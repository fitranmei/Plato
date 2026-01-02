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

	// Start collectors for each active location
	locations, err := s.getActiveLocations()
	if err != nil {
		log.Printf("Error getting active locations: %v", err)
		return
	}

	for _, location := range locations {
		s.startLocationCollector(location)
	}

	// Monitor for location changes and restart collectors as needed
	go s.monitorLocationChanges()

	// Monitor inactive locations and set them to non-public
	go s.monitorInactiveLocations()
}

func (s *TrafficCollectorService) Stop() {
	// Stop all location tickers
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
	// Stop existing ticker for this location if any
	if ticker, exists := s.locationTickers[location.ID]; exists && ticker != nil {
		ticker.Stop()
	}

	intervalMinutes := location.Interval
	if intervalMinutes <= 0 {
		intervalMinutes = 1 // Default to 1 minute if invalid interval
	}

	log.Printf("Starting collector for location %s (%s) with interval: %d minutes",
		location.ID, location.Nama_lokasi, intervalMinutes)

	ticker := time.NewTicker(time.Duration(intervalMinutes) * time.Minute)
	s.locationTickers[location.ID] = ticker

	go func(loc models.Location, interval int) {
		// Collect data immediately when starting
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
	// Check for location changes every 5 minutes
	monitorTicker := time.NewTicker(5 * time.Minute)
	defer monitorTicker.Stop()

	for {
		select {
		case <-monitorTicker.C:
			s.updateLocationCollectors()
		case <-s.stopChan:
			return
		}
	}
}

func (s *TrafficCollectorService) updateLocationCollectors() {
	locations, err := s.getActiveLocations()
	if err != nil {
		log.Printf("Error getting locations for update: %v", err)
		return
	}

	currentLocationIDs := make(map[string]bool)

	// Start or update collectors for current locations
	for _, location := range locations {
		currentLocationIDs[location.ID] = true

		// Check if location needs new collector or interval change
		if _, exists := s.locationTickers[location.ID]; !exists {
			log.Printf("New location detected: %s, starting collector", location.ID)
			s.startLocationCollector(location)
		}
		// Note: For interval changes, we'd need to compare current vs stored interval
		// This could be enhanced by storing location metadata
	}

	// Remove collectors for locations that no longer exist
	for locationID, ticker := range s.locationTickers {
		if !currentLocationIDs[locationID] {
			log.Printf("Location %s no longer active, stopping collector", locationID)
			if ticker != nil {
				ticker.Stop()
			}
			delete(s.locationTickers, locationID)
		}
	}
}

func (s *TrafficCollectorService) getActiveLocations() ([]models.Location, error) {
	collection := database.DB.Collection("locations")

	// Only get location with ID "LOC-00001" for testing purposes
	cursor, err := collection.Find(context.Background(), bson.M{"_id": "LOC-00001"})
	if err != nil {
		return nil, err
	}

	var locations []models.Location
	if err = cursor.All(context.Background(), &locations); err != nil {
		return nil, err
	}

	log.Printf("Filtered active locations (testing): %d locations (only LOC-00001)", len(locations))
	return locations, nil
}

func (s *TrafficCollectorService) collectTrafficForLocation(location models.Location, intervalMinutes int) error {
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

	for i, camera := range cameras {
		if i > 0 {
			log.Printf("Skipping data generation for camera %s (testing: only first camera gets data)", camera.ID)
			continue
		}

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
