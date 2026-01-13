package controllers

import (
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v2"

	"backend/models"
	"backend/services"
)

// StartRTSPStream starts RTSP to HLS conversion for a location
func StartRTSPStream(c *fiber.Ctx) error {
	locationID := c.Params("location_id")

	// Get location source
	source, err := models.GetLocationSource(locationID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "source tidak ditemukan untuk lokasi ini"})
	}

	// Check if source is a link type
	if source.SourceType != models.SourceTypeLink {
		return c.Status(400).JSON(fiber.Map{"error": "source bukan tipe link (RTSP/YouTube)"})
	}

	// Check if it's an RTSP URL
	if !strings.HasPrefix(strings.ToLower(source.SourceData), "rtsp://") {
		return c.Status(400).JSON(fiber.Map{
			"error":   "source bukan URL RTSP. Untuk YouTube, gunakan embed langsung di frontend",
			"tip":     "URL harus dimulai dengan rtsp://",
			"current": source.SourceData,
		})
	}

	// Start the stream
	rtspService := services.GetRTSPStreamService()
	streamInfo, err := rtspService.StartStream(locationID, source.SourceData)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "stream RTSP berhasil dimulai",
		"data":    streamInfo,
	})
}

// StopRTSPStream stops RTSP to HLS conversion for a location
func StopRTSPStream(c *fiber.Ctx) error {
	locationID := c.Params("location_id")

	rtspService := services.GetRTSPStreamService()
	err := rtspService.StopStream(locationID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "stream RTSP berhasil dihentikan",
	})
}

// GetRTSPStreamInfo returns stream information for a location
func GetRTSPStreamInfo(c *fiber.Ctx) error {
	locationID := c.Params("location_id")

	rtspService := services.GetRTSPStreamService()
	streamInfo := rtspService.GetStreamInfo(locationID)

	if streamInfo == nil {
		source, err := models.GetLocationSource(locationID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{
				"error":     "stream tidak aktif dan source tidak ditemukan",
				"is_active": false,
			})
		}

		return c.JSON(fiber.Map{
			"message":     "stream tidak aktif",
			"is_active":   false,
			"source_type": source.SourceType,
			"has_source":  true,
		})
	}

	return c.JSON(fiber.Map{
		"data":      streamInfo,
		"is_active": true,
	})
}

// GetAllRTSPStreams returns all active streams
func GetAllRTSPStreams(c *fiber.Ctx) error {
	rtspService := services.GetRTSPStreamService()
	streams := rtspService.GetAllStreams()

	return c.JSON(fiber.Map{
		"data":  streams,
		"count": len(streams),
	})
}

// StartRTSPStreamManual starts RTSP stream with manual URL input
func StartRTSPStreamManual(c *fiber.Ctx) error {
	locationID := c.Params("location_id")

	type ManualRequest struct {
		RTSPURL string `json:"rtsp_url"`
	}

	var req ManualRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "request tidak valid"})
	}

	if req.RTSPURL == "" {
		return c.Status(400).JSON(fiber.Map{"error": "rtsp_url diperlukan"})
	}

	if !strings.HasPrefix(strings.ToLower(req.RTSPURL), "rtsp://") {
		return c.Status(400).JSON(fiber.Map{
			"error": "URL harus dimulai dengan rtsp://",
		})
	}

	// Start the stream
	rtspService := services.GetRTSPStreamService()
	streamInfo, err := rtspService.StartStream(locationID, req.RTSPURL)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "stream RTSP berhasil dimulai",
		"data":    streamInfo,
	})
}

func GetPlayableURL(c *fiber.Ctx) error {
	locationID := c.Params("location_id")

	// Get location source
	source, err := models.GetLocationSource(locationID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "source tidak ditemukan untuk lokasi ini"})
	}

	response := fiber.Map{
		"location_id": locationID,
		"source_type": source.SourceType,
	}

	if source.SourceType == models.SourceTypeImage {
		response["type"] = "image"
		response["url"] = source.SourceData
		return c.JSON(response)
	}

	// For link type
	sourceURL := strings.ToLower(source.SourceData)

	if strings.HasPrefix(sourceURL, "rtsp://") {
		rtspService := services.GetRTSPStreamService()
		streamInfo := rtspService.GetStreamInfo(locationID)

		if streamInfo != nil && streamInfo.IsRunning {
			response["type"] = "hls"
			response["url"] = streamInfo.HLSURL
			response["is_streaming"] = true
		} else {
			response["type"] = "rtsp"
			response["url"] = source.SourceData
			response["is_streaming"] = false
			response["message"] = "Stream belum dimulai. Gunakan POST /streams/:location_id/start untuk memulai"
		}
	} else if isYouTubeURL(source.SourceData) {
		// YouTube - convert to embed URL
		videoID := extractYouTubeVideoID(source.SourceData)
		if videoID != "" {
			response["type"] = "youtube"
			response["url"] = source.SourceData
			response["embed_url"] = "https://www.youtube.com/embed/" + videoID
			response["video_id"] = videoID
		} else {
			response["type"] = "youtube"
			response["url"] = source.SourceData
			response["error"] = "tidak dapat mengekstrak video ID"
		}
	} else {
		response["type"] = "direct"
		response["url"] = source.SourceData
	}

	return c.JSON(response)
}

// Helper functions for YouTube URL parsing
func isYouTubeURL(url string) bool {
	lowerURL := strings.ToLower(url)
	return strings.Contains(lowerURL, "youtube.com") || strings.Contains(lowerURL, "youtu.be")
}

func extractYouTubeVideoID(url string) string {
	if strings.Contains(url, "youtu.be/") {
		re := regexp.MustCompile(`youtu\.be/([a-zA-Z0-9_-]{11})`)
		matches := re.FindStringSubmatch(url)
		if len(matches) > 1 {
			return matches[1]
		}
	}

	// Handle youtube.com/watch?v=VIDEO_ID
	if strings.Contains(url, "youtube.com") {
		re := regexp.MustCompile(`[?&]v=([a-zA-Z0-9_-]{11})`)
		matches := re.FindStringSubmatch(url)
		if len(matches) > 1 {
			return matches[1]
		}

		// Handle youtube.com/embed/VIDEO_ID
		re = regexp.MustCompile(`/embed/([a-zA-Z0-9_-]{11})`)
		matches = re.FindStringSubmatch(url)
		if len(matches) > 1 {
			return matches[1]
		}

		// Handle youtube.com/live/VIDEO_ID
		re = regexp.MustCompile(`/live/([a-zA-Z0-9_-]{11})`)
		matches = re.FindStringSubmatch(url)
		if len(matches) > 1 {
			return matches[1]
		}
	}

	return ""
}
