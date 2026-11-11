package server

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/gorilla/websocket"
)

const (
	handshakeTimeout   = 5 * time.Second
	handshakeReadLimit = 4096
	sessionReadLimit   = 1 << 20
)

func handshakeWS(conn *websocket.Conn, token string) (*controlMsg, error) {
	conn.SetReadLimit(handshakeReadLimit)
	_ = conn.SetReadDeadline(time.Now().Add(handshakeTimeout))

	msgType, msg, err := conn.ReadMessage()
	if err != nil {
		return nil, err
	}
	if msgType != websocket.TextMessage {
		return nil, errors.New("first message must be text")
	}

	var c controlMsg
	if err := json.Unmarshal(msg, &c); err != nil || c.Type != msgInit {
		return nil, errors.New("invalid init")
	}
	if !compareTokens(token, c.Token) {
		return nil, errors.New("unauthorized")
	}
	if c.Cols <= 0 || c.Rows <= 0 {
		return nil, errors.New("invalid size")
	}

	_ = conn.SetReadDeadline(time.Time{})
	conn.SetReadLimit(sessionReadLimit)
	return &c, nil
}

func rejectWS(conn *websocket.Conn, reason string) {
	_ = conn.WriteControl(
		websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.ClosePolicyViolation, reason),
		time.Now().Add(time.Second),
	)
}
