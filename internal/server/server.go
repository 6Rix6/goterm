package server

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"goterm/internal/session"
	"goterm/web"

	"github.com/gorilla/websocket"
)

type ServerOption struct {
	Port           int
	AllowedOrigins []string
	NewToken       bool
	Shell          string
	Args           []string
}

type server struct {
	opt      *ServerOption
	upgrader websocket.Upgrader
	token    string
	sessions *session.SessionManager
}

func Serve(option *ServerOption) error {
	token, err := getOrCreateToken(option.NewToken)
	if err != nil {
		return err
	}

	s := &server{
		opt:   option,
		token: token,
		sessions: session.NewSessionManager(session.SessionConfig{
			Shell: resolveShell(option.Shell),
			Args:  option.Args,
			Env:   []string{"TERM=xterm-256color"},
		}),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return checkOrigin(r, option.AllowedOrigins)
			},
		},
	}
	defer s.sessions.CloseAll()

	mux := http.NewServeMux()

	s.registerWSHandler(mux)
	s.registerAPI(mux)

	mux.Handle("/", web.WebFsHandler())

	addr := fmt.Sprintf("127.0.0.1:%d", option.Port)
	log.Println("listening on http://" + addr + "/terminal#token=" + token)
	return http.ListenAndServe(addr, mux)
}

func resolveShell(configured string) string {
	if configured != "" {
		return configured
	}
	if sh := os.Getenv("SHELL"); sh != "" {
		return sh
	}
	return "/bin/sh"
}
