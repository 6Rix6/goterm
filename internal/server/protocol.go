package server

type controlMsg struct {
	Type      string `json:"type"`
	Token     string `json:"token,omitempty"`
	SessionID string `json:"session_id,omitempty"`
	Cols      uint16 `json:"cols"`
	Rows      uint16 `json:"rows"`
}

const (
	msgInit    = "init"    // client -> server
	msgResize  = "resize"  // client -> server
	msgSession = "session" // server -> client
)
