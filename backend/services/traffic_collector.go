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
	ticker   *time.Ticker
	stopChan chan bool
}

func NewTrafficCollectorService() *TrafficCollectorService {
	return &TrafficCollectorService{
		stopChan: make(chan bool),
	}
}

func (s *TrafficCollectorService) Start(intervalMinutes int) {
	log.Printf("Traffic Collector Service started with interval: %d minutes", intervalMinutes)

	s.ticker = time.NewTicker(time.Duration(intervalMinutes) * time.Minute)

	go func() {
		s.collectTrafficData(intervalMinutes)

		for {
			select {
			case <-s.ticker.C:
				s.collectTrafficData(intervalMinutes)
			case <-s.stopChan:
				log.Println("Traffic Collector Service stopped")
				return
			}
		}
	}()
}

func (s *TrafficCollectorService) Stop() {
	if s.ticker != nil {
		s.ticker.Stop()
	}
	s.stopChan <- true
}

func (s *TrafficCollectorService) collectTrafficData(intervalMinutes int) {
	log.Println("Collecting traffic data...")

	locations, err := s.getActiveLocations()
	if err != nil {
		log.Printf("Error getting active locations: %v", err)
		return
	}

	for _, location := range locations {
		err := s.collectTrafficForLocation(location, intervalMinutes)
		if err != nil {
			log.Printf("Error collecting traffic for location %s: %v", location.ID, err)
		}
	}

	log.Printf("Traffic data collected for %d locations", len(locations))
}

func (s *TrafficCollectorService) getActiveLocations() ([]models.Location, error) {
	collection := database.DB.Collection("locations")

	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		return nil, err
	}

	var locations []models.Location
	if err = cursor.All(context.Background(), &locations); err != nil {
		return nil, err
	}

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

	for _, camera := range cameras {
		for _, zonaArah := range camera.ZonaArah {
			kelasDataList := s.generateTrafficDataForZonaArah(klasifikasiList)

			totalKendaraan := 0
			for _, kd := range kelasDataList {
				totalKendaraan += kd.JumlahKendaraan
			}

			zonaArahDataMap[zonaArah.IDZonaArah] = &models.TrafficZonaArahData{
				IDZonaArahCamera: zonaArah.IDZonaArah,
				NamaArah:         zonaArah.Arah,
				KelasData:        kelasDataList,
				TotalKendaraan:   totalKendaraan,
			}
		}
	}

	zonaArahDataList := make([]models.TrafficZonaArahData, 0, len(zonaArahDataMap))
	for _, data := range zonaArahDataMap {
		zonaArahDataList = append(zonaArahDataList, *data)
	}

	_, err = models.CreateTrafficData(location.ID, zonaArahDataList, intervalMinutes)
	if err != nil {
		return err
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
