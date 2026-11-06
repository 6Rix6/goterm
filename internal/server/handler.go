package server

import (
	"goterm/internal/session"
	"log"
	"net/http"

	"github.com/creack/pty"
)

func (s *server) registerWSHandler(mux *http.ServeMux) {
	mux.HandleFunc("/ws", s.handleWS)
}

func (s *server) handleWS(w http.ResponseWriter, r *http.Request) {
	if !checkOrigin(r, s.opt.AllowedOrigins) {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade:", err)
		return
	}
	defer conn.Close()

	init, err := handshakeWS(conn, s.token)
	if err != nil {
		log.Println("handshake:", err)
		rejectWS(conn, "unauthorized")
		return
	}

	var (
		sess    *session.PTYSession
		created bool
	)
	if init.SessionID != "" {
		sess, err = s.sessions.Get(init.SessionID)
		if err != nil {
			rejectWS(conn, "session not found")
			return
		}
		_ = sess.Resize(init.Cols, init.Rows)
	} else {
		sess, err = s.sessions.Create(&pty.Winsize{Cols: init.Cols, Rows: init.Rows})
		if err != nil {
			log.Println("pty start:", err)
			return
		}
		created = true
	}

	// クライアントへセッションIDを通知(attach前なのでWS書き込みは競合しない)
	if err := conn.WriteJSON(controlMsg{Type: msgSession, SessionID: sess.ID}); err != nil {
		if created {
			_ = s.sessions.Delete(sess.ID)
		}
		return
	}

	sink := &wsSink{conn: conn}
	if err := sess.Attach(sink); err != nil {
		log.Println("attach:", err)
		if created {
			_ = s.sessions.Delete(sess.ID)
		}
		return
	}
	defer s.sessions.Detach(sess, sink)

	pumpWSToPTY(conn, sess)
}
