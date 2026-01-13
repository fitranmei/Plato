package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

// Config for MediaMTX - configurable via environment
var (
	MediaMtxApiUrl = getEnv("MEDIAMTX_API_URL", "http://localhost:9997/v3")
	MediaMtxHlsUrl = getEnv("MEDIAMTX_HLS_URL", "http://localhost:8888")
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// RTSPStreamService handles RTSP to HLS conversion using MediaMTX
type RTSPStreamService struct {
	activeStreams map[string]*StreamInfo
	mu            sync.RWMutex
}

// MediaMtxPathConfig represents configuration for a path in MediaMTX
type MediaMtxPathConfig struct {
	Source string `json:"source"`
}

// StreamInfo contains information about an active stream
type StreamInfo struct {
	LocationID string `json:"location_id"`
	RTSPURL    string `json:"rtsp_url"`
	HLSURL     string `json:"hls_url"`
	IsRunning  bool   `json:"is_running"`
	StartedAt  string `json:"started_at"`
}

var (
	rtspService *RTSPStreamService
	rtspOnce    sync.Once
)

// GetRTSPStreamService returns singleton instance
func GetRTSPStreamService() *RTSPStreamService {
	rtspOnce.Do(func() {
		rtspService = &RTSPStreamService{
			activeStreams: make(map[string]*StreamInfo),
		}
	})
	return rtspService
}

// StartStream starts RTSP to HLS conversion for a location by configuring MediaMTX
func (s *RTSPStreamService) StartStream(locationID, rtspURL string) (*StreamInfo, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 1. Check if stream is already actively tracked in our memory
	if existing, exists := s.activeStreams[locationID]; exists {
		if existing.IsRunning {
			return existing, nil
		}
	}

	streamName := "stream_" + locationID

	// 2. Configure MediaMTX
	// API: POST /v3/config/paths/add/{name}
	// Body: { "source": "rtsp://..." }

	pathConfig := MediaMtxPathConfig{Source: rtspURL}
	jsonData, err := json.Marshal(pathConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal config: %v", err)
	}

	apiEndpoint := fmt.Sprintf("%s/config/paths/add/%s", MediaMtxApiUrl, streamName)
	resp, err := http.Post(apiEndpoint, "application/json", bytes.NewBuffer(jsonData))
	
	// If the path already exists (409 or 400), we assume it might be stale or already running.
	// We'll treat it as success if it exists, or try to update. 
	// For now, if error, we try to DELETE and Re-ADD to ensure it's the correct source.
	if err == nil && resp.StatusCode != 200 {
		// Clean up old path
		s.stopStreamInternal(streamName)
		// Retry add
		resp, err = http.Post(apiEndpoint, "application/json", bytes.NewBuffer(jsonData))
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to MediaMTX: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("MediaMTX error (%d): %s", resp.StatusCode, string(bodyBytes))
	}

	// 3. Create StreamInfo
	hlsUrl := fmt.Sprintf("%s/%s/index.m3u8", MediaMtxHlsUrl, streamName)
	
	info := &StreamInfo{
		LocationID: locationID,
		RTSPURL:    rtspURL,
		HLSURL:     hlsUrl,
		IsRunning:  true,
		StartedAt:  time.Now().Format(time.RFC3339),
	}

	s.activeStreams[locationID] = info
	log.Printf("Started MediaMTX stream for %s: %s", locationID, hlsUrl)

	return info, nil
}

// StopStream stops (removes) the stream config from MediaMTX
func (s *RTSPStreamService) StopStream(locationID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	streamName := "stream_" + locationID
	
	err := s.stopStreamInternal(streamName)
	if err != nil {
		return err
	}

	delete(s.activeStreams, locationID)
	log.Printf("Stopped MediaMTX stream for %s", locationID)
	return nil
}

func (s *RTSPStreamService) stopStreamInternal(streamName string) error {
	client := &http.Client{}
	req, err := http.NewRequest("DELETE", fmt.Sprintf("%s/config/paths/remove/%s", MediaMtxApiUrl, streamName), nil)
	if err != nil {
		return err
	}
	resp, err := client.Do(req)
	if err != nil {
		// If we can't reach it, it's problematic, but maybe we just assume it's gone?
		return fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()
	return nil
}

// GetStreamInfo returns information about a stream
func (s *RTSPStreamService) GetStreamInfo(locationID string) *StreamInfo {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if info, exists := s.activeStreams[locationID]; exists {
		return info
	}
	return nil
}

// GetAllStreams returns all active streams
func (s *RTSPStreamService) GetAllStreams() []StreamInfo {
	s.mu.RLock()
	defer s.mu.RUnlock()

	streams := make([]StreamInfo, 0, len(s.activeStreams))
	for _, info := range s.activeStreams {
		streams = append(streams, *info)
	}
	return streams
}

// IsStreamActive checks if a stream is active for a location
func (s *RTSPStreamService) IsStreamActive(locationID string) bool {
	info := s.GetStreamInfo(locationID)
	return info != nil && info.IsRunning
}

// StopAllStreams stops all active streams
func (s *RTSPStreamService) StopAllStreams() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for locationID := range s.activeStreams {
		s.stopStreamInternal("stream_" + locationID)
	}
	// Clear map
	s.activeStreams = make(map[string]*StreamInfo)
	log.Println("All MediaMTX streams cleared")
}

// GetHLSDirectory is deprecated in MediaMTX mode but kept for interface compatibility if needed
func (s *RTSPStreamService) GetHLSDirectory() string {
	return "./hls_streams" // Returns dummy path
}
