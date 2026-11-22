package server

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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
	srv := &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	log.Println("listening on http://" + addr + "/terminal#token=" + token)

	errCh := make(chan error, 1)
	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		log.Println("shutting down...")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)

	return nil
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
