package services

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"backend/models"
)

type DummyDataGenerator struct {
	service          *TrafficCollectorService
	targetLocationID string
	ticker           *time.Ticker
	stopChan         chan bool
}

func NewDummyDataGenerator(service *TrafficCollectorService) *DummyDataGenerator {
	return &DummyDataGenerator{
		service:          service,
		targetLocationID: "LOC-00001",
		stopChan:         make(chan bool),
	}
}

func (d *DummyDataGenerator) Start() {
	location, err := models.GetLocationByID(d.targetLocationID)
	if err != nil {
		log.Printf("Dummy data generator: Location %s not found", d.targetLocationID)
		return
	}

	cameras, err := d.service.getCamerasByLokasiID(d.targetLocationID)
	if err != nil || len(cameras) == 0 {
		log.Printf("Dummy data generator: No cameras found for location %s", d.targetLocationID)
		return
	}

	intervalSeconds := location.Interval
	if intervalSeconds <= 0 {
		intervalSeconds = 300
	}

	log.Printf("Dummy data generator: %s - interval %ds", location.Nama_lokasi, intervalSeconds)

	camera := cameras[0]

	d.generateAndSendDummyXML(camera, *location, intervalSeconds)

	d.ticker = time.NewTicker(time.Duration(intervalSeconds) * time.Second)
	d.service.locationTickers[d.targetLocationID] = d.ticker

	go d.run(camera, *location, intervalSeconds)
}

func (d *DummyDataGenerator) Stop() {
	if d.ticker != nil {
		d.ticker.Stop()
		log.Printf("Stopped dummy data generator for %s", d.targetLocationID)
	}
	d.stopChan <- true
}

func (d *DummyDataGenerator) run(camera models.Camera, location models.Location, intervalSeconds int) {
	for {
		select {
		case <-d.ticker.C:
			d.generateAndSendDummyXML(camera, location, intervalSeconds)
		case <-d.stopChan:
			log.Printf("Dummy data generator stopped for %s", d.targetLocationID)
			return
		case <-d.service.stopChan:
			log.Printf("Dummy data generator stopped (service stopped)")
			return
		}
	}
}

func (d *DummyDataGenerator) generateAndSendDummyXML(camera models.Camera, location models.Location, intervalSeconds int) {
	klasifikasiList, err := d.service.getKlasifikasiByTipeLokasi(location.Tipe_lokasi)
	if err != nil || len(klasifikasiList) == 0 {
		log.Printf("Dummy generator: Failed to get klasifikasi: %v", err)
		return
	}

	numZones := len(camera.ZonaArah)
	if numZones == 0 {
		numZones = 1
	}

	xmlData := fmt.Sprintf(`<Root>
<API>%s</API>
<Message Type="Data">
<Body Type="IntegratedData" IntervalTime="%d" DataNumber="0" Utc="" MilliSeconds="0">`,
		camera.APIKey, intervalSeconds)

	for i := 1; i <= numZones; i++ {
		xmlData += fmt.Sprintf(`
<Zone ZoneId="%d" Occupancy="0" Confidence="0" Length="0" HeadWay="0" Density="0">`, i)

		for _, klas := range klasifikasiList {
			numVeh := rand.Intn(51)
			speed := 40.0 + rand.Float64()*40.0
			xmlData += fmt.Sprintf(`
    <Class ClassNr="%d" NumVeh="%d" Speed="%.0f" GapTime="0" />`,
				klas.Kelas, numVeh, speed)
		}

		xmlData += `
</Zone>`
	}

	xmlData += `
</Body>
</Message>
<Image>base64</Image>
</Root>`

	trafficData, err := models.ProcessCameraData(xmlData)
	if err != nil {
		log.Printf("Dummy generator: Error processing XML: %v", err)
		return
	}

	localTime := time.Now().Add(7 * time.Hour)
	err = models.UpdateLastDataReceived(location.ID, localTime)
	if err != nil {
		log.Printf("Dummy generator: Warning - Failed to update last data received: %v", err)
	}

	if trafficData.MKJIAnalysis != nil {
		log.Printf("✓ Dummy data generated for %s: %d vehicles (MC=%d, LV=%d, HV=%d) | DS=%.3f | LoS=%s",
			location.Nama_lokasi,
			trafficData.TotalKendaraan,
			trafficData.MKJIAnalysis.MC,
			trafficData.MKJIAnalysis.LV,
			trafficData.MKJIAnalysis.HV,
			trafficData.MKJIAnalysis.DerajatKejenuhan,
			trafficData.MKJIAnalysis.TingkatPelayanan)
	} else {
		log.Printf("✓ Dummy data generated for %s: %d vehicles",
			location.Nama_lokasi,
			trafficData.TotalKendaraan)
	}
}
