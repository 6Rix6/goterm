package server

import (
	"encoding/json"
	"goterm/internal/session"
	"time"

	"github.com/gorilla/websocket"
)

const writeTimeout = 10 * time.Second

// wsSink は Sink の WebSocket 実装。
// Send は PTYSession.mu の下でのみ呼ばれるため、書き込みは直列化される。
type wsSink struct {
	conn *websocket.Conn
}

func (w *wsSink) Send(p []byte) error {
	_ = w.conn.SetWriteDeadline(time.Now().Add(writeTimeout))
	return w.conn.WriteMessage(websocket.BinaryMessage, p)
}

func (w *wsSink) Close() error { return w.conn.Close() }

// pumpWSToPTY はWSが切れるまで入力とresizeをセッションに流す。
func pumpWSToPTY(conn *websocket.Conn, sess *session.PTYSession) {
	for {
		msgType, msg, err := conn.ReadMessage()
		if err != nil {
			return
		}
		switch msgType {
		case websocket.BinaryMessage:
			if _, err := sess.Write(msg); err != nil {
				return
			}
		case websocket.TextMessage:
			handleControl(sess, msg)
		}
	}
}

func handleControl(sess *session.PTYSession, msg []byte) {
	var c controlMsg
	if err := json.Unmarshal(msg, &c); err != nil {
		return
	}
	if c.Type == msgResize && c.Cols > 0 && c.Rows > 0 {
		_ = sess.Resize(c.Cols, c.Rows)
	}
}
