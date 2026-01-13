package routes

import (
	"backend/controllers"
	"backend/middleware"
	"backend/services"

	"github.com/gofiber/fiber/v2"
)

func SetupRTSPStreamRoutes(router fiber.Router) {
	stream := router.Group("/streams")
	stream.Use(middleware.Protected())

	// Get all active streams
	stream.Get("/", controllers.GetAllRTSPStreams)

	// Get stream info for a specific location
	stream.Get("/:location_id", controllers.GetRTSPStreamInfo)

	// Get playable URL (HLS for RTSP, embed for YouTube, base64 for image)
	stream.Get("/:location_id/playable", controllers.GetPlayableURL)

	// Start stream from location source (auto-detect RTSP URL)
	stream.Post("/:location_id/start", middleware.RestrictTo("superadmin"), controllers.StartRTSPStream)

	// Start stream with manual RTSP URL
	stream.Post("/:location_id/start-manual", middleware.RestrictTo("superadmin"), controllers.StartRTSPStreamManual)

	// Stop stream
	stream.Post("/:location_id/stop", middleware.RestrictTo("superadmin"), controllers.StopRTSPStream)

	// Serve HLS files (public access for video playback)
	rtspService := services.GetRTSPStreamService()
	router.Static("/hls", rtspService.GetHLSDirectory())
}
