package server

type controlMsg struct {
	Type         string `json:"type"`
	Token        string `json:"token,omitempty"`
	SessionID    string `json:"session_id,omitempty"`
	SessionTitle string `json:"session_title,omitempty"`
	Pinned       bool   `json:"pinned,omitempty"`
	Cols         uint16 `json:"cols,omitempty"`
	Rows         uint16 `json:"rows,omitempty"`
}

const (
	msgInit    = "init"    // client -> server
	msgResize  = "resize"  // client -> server
	msgSession = "session" // server -> client
)
