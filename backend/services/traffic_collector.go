package services

import (
	"context"
	"log"
	"time"

	"backend/database"
	"backend/models"

	"go.mongodb.org/mongo-driver/v2/bson"
)

const (
	InactiveDuration = 10 * time.Minute
	MonitorInterval  = 1 * time.Minute
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
	err := models.CheckInactiveLocations(InactiveDuration)
	if err != nil {
		log.Printf("Error checking inactive locations: %v", err)
	}
	s.logLocationStatus()

	go s.monitorInactiveLocations()
	go s.scheduleDailyLHRAnalysis()
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

func (s *TrafficCollectorService) scheduleDailyLHRAnalysis() {
	now := time.Now()
	nextMidnight := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 5, 0, 0, now.Location())
	durationUntilMidnight := nextMidnight.Sub(now)

	log.Printf("Daily LHR analysis scheduled to run in %v", durationUntilMidnight)

	time.Sleep(durationUntilMidnight)

	s.runDailyLHRAnalysis()

	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.runDailyLHRAnalysis()
		case <-s.stopChan:
			log.Println("Stopping daily LHR analysis scheduler")
			return
		}
	}
}

func (s *TrafficCollectorService) runDailyLHRAnalysis() {
	log.Println("Running daily LHR analysis for all locations...")

	locations, err := s.getActiveLocations()
	if err != nil {
		log.Printf("Error getting active locations for LHR analysis: %v", err)
		return
	}

	for _, location := range locations {
		err := s.calculateDailyLHRForLocation(location)
		if err != nil {
			log.Printf("Error calculating daily LHR for location %s: %v", location.ID, err)
		}
	}
}

func (s *TrafficCollectorService) calculateDailyLHRForLocation(location models.Location) error {
	now := time.Now()
	yesterday := now.AddDate(0, 0, -1)
	startOfYesterday := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, yesterday.Location())
	endOfYesterday := startOfYesterday.Add(24 * time.Hour)

	trafficDataList, err := models.GetTrafficDataByLokasiID(location.ID, startOfYesterday, endOfYesterday)
	if err != nil {
		return err
	}

	if len(trafficDataList) == 0 {
		log.Printf("No traffic data found for location %s yesterday", location.ID)
		return nil
	}

	totalKendaraanHari := 0
	for _, td := range trafficDataList {
		totalKendaraanHari += td.TotalKendaraan
	}

	pkjiCount := models.HitungPKJICount(trafficDataList, location.Tipe_lokasi)
	arusLaluLintasPKJI, jamPuncakPKJI := models.HitungVolumePKJI(trafficDataList, location.Tipe_lokasi)

	lhrPKJI := float64(totalKendaraanHari)
	lhrSKR := pkjiCount.TotalSkr

	log.Printf("Daily LHR (PKJI2023) for %s (%s): Total=%d, SM=%d, KR=%d, KB=%d, KTB=%d, LHR=%.0f, LHRSKR=%.2f, JamPuncak=%s, ArusPuncak=%.2f skr/jam",
		location.Nama_lokasi, startOfYesterday.Format("2006-01-02"),
		totalKendaraanHari, pkjiCount.SM, pkjiCount.KR, pkjiCount.KB, pkjiCount.KTB,
		lhrPKJI, lhrSKR, jamPuncakPKJI, arusLaluLintasPKJI)

	mkjiCount := models.HitungMKJICount(trafficDataList, location.Tipe_lokasi)
	arusLaluLintasMKJI, jamPuncakMKJI := models.HitungArusLaluLintas(trafficDataList, location.Tipe_lokasi)

	lhrMKJI := models.HitungLHR(totalKendaraanHari, 1)
	lhrSMP := models.HitungLHRSMP(mkjiCount, 1)

	log.Printf("Daily LHR (MKJI1997) for %s (%s): Total=%d, MC=%d, LV=%d, HV=%d, UM=%d, LHR=%.0f, LHRSMP=%.2f, JamPuncak=%s, ArusPuncak=%.2f smp/jam",
		location.Nama_lokasi, startOfYesterday.Format("2006-01-02"),
		totalKendaraanHari, mkjiCount.MC, mkjiCount.LV, mkjiCount.HV, mkjiCount.UM,
		lhrMKJI, lhrSMP, jamPuncakMKJI, arusLaluLintasMKJI)

	return nil
}

func (s *TrafficCollectorService) runMKJIAnalysisForAllLocations() {
	locations, err := s.getActiveLocations()
	if err != nil {
		log.Printf("Error getting active locations for analysis: %v", err)
		return
	}

	for _, location := range locations {
		err := s.calculateAnalysisForLocation(location)
		if err != nil {
			log.Printf("Error calculating analysis for location %s: %v", location.ID, err)
		}
	}
}

func (s *TrafficCollectorService) calculateAnalysisForLocation(location models.Location) error {
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	trafficDataList, err := models.GetTrafficDataByLokasiID(location.ID, startOfDay, endOfDay)
	if err != nil {
		return err
	}

	if len(trafficDataList) == 0 {
		log.Printf("No traffic data found for location %s today", location.ID)
		return nil
	}

	totalKendaraanHari := 0
	for _, td := range trafficDataList {
		totalKendaraanHari += td.TotalKendaraan
	}

	err1 := s.calculateMKJI1997ForLocation(location, trafficDataList, totalKendaraanHari)
	err2 := s.calculatePKJI2023ForLocation(location, trafficDataList, totalKendaraanHari)

	if err1 != nil {
		log.Printf("Error calculating MKJI 1997: %v", err1)
	}
	if err2 != nil {
		log.Printf("Error calculating PKJI 2023: %v", err2)
	}

	return nil
}

func (s *TrafficCollectorService) calculateMKJI1997ForLocation(location models.Location, trafficDataList []models.TrafficData, totalKendaraanHari int) error {
	mkjiCount := models.HitungMKJICount(trafficDataList, location.Tipe_lokasi)

	arusLaluLintas, jamPuncak := models.HitungArusLaluLintas(trafficDataList, location.Tipe_lokasi)

	kapasitasDasar := models.GetKapasitasDasar(location.Tipe_arah, location.Tipe_lokasi)
	fcw := models.GetFCW(location.Lebar_jalur, location.Tipe_arah)
	fcsp := models.GetFCSP(location.Persentase, location.Tipe_arah)

	var fcsf, fccs float64
	var kapasitas float64

	switch location.Tipe_lokasi {
	case "perkotaan":
		fcsf = models.GetFCSF(location.Tipe_hambatan, location.Kelas_hambatan, 1.5)
		fccs = models.GetFCCS(location.Ukuran_kota)
		kapasitas = kapasitasDasar * fcw * fcsp * fcsf * fccs
	case "luar_kota", "12_kelas":
		fcsf = models.GetFCSF(location.Tipe_hambatan, location.Kelas_hambatan, 1.5)
		fccs = 1.0
		kapasitas = kapasitasDasar * fcw * fcsp * fcsf
	case "bebas_hambatan":
		fcsf = 1.0
		fccs = 1.0
		kapasitas = kapasitasDasar * fcw * fcsp
	default:
		fcsf = models.GetFCSF(location.Tipe_hambatan, location.Kelas_hambatan, 1.5)
		fccs = models.GetFCCS(location.Ukuran_kota)
		kapasitas = kapasitasDasar * fcw * fcsp * fcsf * fccs
	}

	derajatKejenuhan := 0.0
	if kapasitas > 0 {
		derajatKejenuhan = arusLaluLintas / kapasitas
	}

	tingkatPelayanan, _ := models.GetTingkatPelayanan(derajatKejenuhan)

	lhr := models.HitungLHR(totalKendaraanHari, 1)
	lhrSMP := models.HitungLHRSMP(mkjiCount, 1)

	log.Printf("MKJI1997 Analysis for %s: MC=%d, LV=%d, HV=%d, UM=%d, DS=%.3f, LoS=%s, LHR=%.0f, LHRSMP=%.2f, JamPuncak=%s",
		location.Nama_lokasi, mkjiCount.MC, mkjiCount.LV, mkjiCount.HV, mkjiCount.UM,
		derajatKejenuhan, tingkatPelayanan, lhr, lhrSMP, jamPuncak)

	return nil
}

func (s *TrafficCollectorService) calculatePKJI2023ForLocation(location models.Location, trafficDataList []models.TrafficData, totalKendaraanHari int) error {
	pkjiCount := models.HitungPKJICount(trafficDataList, location.Tipe_lokasi)
	volumeLaluLintas, jamPuncak := models.HitungVolumePKJI(trafficDataList, location.Tipe_lokasi)
	kapasitas, _, _, _, _, _ := models.HitungKapasitasPKJI(location)

	derajatKejenuhan := 0.0
	if kapasitas > 0 {
		derajatKejenuhan = volumeLaluLintas / kapasitas
	}

	tingkatPelayanan, _ := models.GetTingkatPelayananPKJI(derajatKejenuhan)

	lhr := float64(totalKendaraanHari)
	lhrSKR := pkjiCount.TotalSkr

	log.Printf("PKJI2023 Analysis for %s: SM=%d, KR=%d, KB=%d, KTB=%d, DJ=%.3f, LoS=%s, LHR=%.0f, LHRSKR=%.2f, JamPuncak=%s",
		location.Nama_lokasi, pkjiCount.SM, pkjiCount.KR, pkjiCount.KB, pkjiCount.KTB,
		derajatKejenuhan, tingkatPelayanan, lhr, lhrSKR, jamPuncak)

	return nil
}

func (s *TrafficCollectorService) ProcessIncomingCameraData(xmlData string) (*models.TrafficData, error) {
	trafficData, err := models.ProcessCameraData(xmlData)
	if err != nil {
		return nil, err
	}

	// MongoDB menyimpan waktu dalam UTC, jadi kita simpan waktu lokal (UTC+7)
	localTime := time.Now().Add(7 * time.Hour)
	err = models.UpdateLastDataReceived(trafficData.LokasiID, localTime)
	if err != nil {
		log.Printf("Warning: Failed to update last data received for location %s: %v",
			trafficData.LokasiID, err)
	}

	log.Printf("Processed camera data for location %s: %d vehicles",
		trafficData.NamaLokasi, trafficData.TotalKendaraan)

	return trafficData, nil
}

func (s *TrafficCollectorService) getActiveLocations() ([]models.Location, error) {
	collection := database.DB.Collection("locations")

	filter := bson.M{}

	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		return nil, err
	}

	var locations []models.Location
	if err = cursor.All(context.Background(), &locations); err != nil {
		return nil, err
	}

	return locations, nil
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
	ticker := time.NewTicker(MonitorInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			err := models.CheckInactiveLocations(InactiveDuration)
			if err != nil {
				log.Printf("Error checking inactive locations: %v", err)
			}
			s.logLocationStatus()
		case <-s.stopChan:
			log.Println("Stopping inactive location monitor")
			return
		}
	}
}

func (s *TrafficCollectorService) logLocationStatus() {
	collection := database.DB.Collection("locations")

	cursorOnline, err := collection.Find(context.Background(), bson.M{"publik": true})
	if err != nil {
		log.Printf("Error getting online locations: %v", err)
		return
	}
	var onlineLocations []models.Location
	cursorOnline.All(context.Background(), &onlineLocations)

	cursorOffline, err := collection.Find(context.Background(), bson.M{"publik": false})
	if err != nil {
		log.Printf("Error getting offline locations: %v", err)
		return
	}
	var offlineLocations []models.Location
	cursorOffline.All(context.Background(), &offlineLocations)

	log.Println("---------------------------------------")
	log.Printf("Online Lokasi: %d", len(onlineLocations))
	for _, loc := range onlineLocations {
		log.Printf("- %s (%s)", loc.Nama_lokasi, loc.ID)
	}
	log.Println("")
	log.Printf("Offline Lokasi: %d", len(offlineLocations))
	for _, loc := range offlineLocations {
		log.Printf("- %s (%s)", loc.Nama_lokasi, loc.ID)
	}
	log.Println("---------------------------------------")
}

func (s *TrafficCollectorService) GetLocationTrafficSummary(lokasiID string, startTime, endTime time.Time) (*TrafficSummary, error) {
	location, err := models.GetLocationByID(lokasiID)
	if err != nil {
		return nil, err
	}

	trafficDataList, err := models.GetTrafficDataByLokasiID(lokasiID, startTime, endTime)
	if err != nil {
		return nil, err
	}

	if len(trafficDataList) == 0 {
		return &TrafficSummary{
			LokasiID:   lokasiID,
			NamaLokasi: location.Nama_lokasi,
			StartTime:  startTime,
			EndTime:    endTime,
			DataCount:  0,
		}, nil
	}

	mkjiCount := models.HitungMKJICount(trafficDataList, location.Tipe_lokasi)
	arusLaluLintas, jamPuncak := models.HitungArusLaluLintas(trafficDataList, location.Tipe_lokasi)

	kapasitasDasar := models.GetKapasitasDasar(location.Tipe_arah, location.Tipe_lokasi)
	fcw := models.GetFCW(location.Lebar_jalur, location.Tipe_arah)
	fcsp := models.GetFCSP(location.Persentase, location.Tipe_arah)

	var fcsf, fccs float64
	var kapasitas float64

	switch location.Tipe_lokasi {
	case "perkotaan":
		fcsf = models.GetFCSF(location.Tipe_hambatan, location.Kelas_hambatan, 1.5)
		fccs = models.GetFCCS(location.Ukuran_kota)
		kapasitas = kapasitasDasar * fcw * fcsp * fcsf * fccs

	case "luar_kota", "12_kelas":
		fcsf = models.GetFCSF(location.Tipe_hambatan, location.Kelas_hambatan, 1.5)
		fccs = 1.0
		kapasitas = kapasitasDasar * fcw * fcsp * fcsf

	case "bebas_hambatan":
		fcsf = 1.0
		fccs = 1.0
		kapasitas = kapasitasDasar * fcw * fcsp

	default:
		fcsf = models.GetFCSF(location.Tipe_hambatan, location.Kelas_hambatan, 1.5)
		fccs = models.GetFCCS(location.Ukuran_kota)
		kapasitas = kapasitasDasar * fcw * fcsp * fcsf * fccs
	}

	derajatKejenuhan := 0.0
	if kapasitas > 0 {
		derajatKejenuhan = arusLaluLintas / kapasitas
	}

	tingkatPelayanan, _ := models.GetTingkatPelayanan(derajatKejenuhan)

	totalKendaraan := 0
	for _, td := range trafficDataList {
		totalKendaraan += td.TotalKendaraan
	}

	return &TrafficSummary{
		LokasiID:         lokasiID,
		NamaLokasi:       location.Nama_lokasi,
		StartTime:        startTime,
		EndTime:          endTime,
		DataCount:        len(trafficDataList),
		TotalKendaraan:   totalKendaraan,
		MKJICount:        mkjiCount,
		ArusLaluLintas:   arusLaluLintas,
		JamPuncak:        jamPuncak,
		Kapasitas:        kapasitas,
		DerajatKejenuhan: derajatKejenuhan,
		TingkatPelayanan: tingkatPelayanan,
	}, nil
}

type TrafficSummary struct {
	LokasiID         string           `json:"lokasi_id"`
	NamaLokasi       string           `json:"nama_lokasi"`
	StartTime        time.Time        `json:"start_time"`
	EndTime          time.Time        `json:"end_time"`
	DataCount        int              `json:"data_count"`
	TotalKendaraan   int              `json:"total_kendaraan"`
	MKJICount        models.MKJICount `json:"mkji_count"`
	ArusLaluLintas   float64          `json:"arus_lalu_lintas"`
	JamPuncak        string           `json:"jam_puncak"`
	Kapasitas        float64          `json:"kapasitas"`
	DerajatKejenuhan float64          `json:"derajat_kejenuhan"`
	TingkatPelayanan string           `json:"tingkat_pelayanan"`
}
