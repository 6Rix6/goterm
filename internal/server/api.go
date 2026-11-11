package server

import (
	"encoding/json"
	"errors"
	"goterm/internal/session"
	"net/http"
	"strings"
)

func (s *server) registerAPI(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/sessions", s.auth(s.handleListSessions))
	mux.HandleFunc("PATCH /api/sessions/{id}", s.auth(s.handlePatchSession))
	mux.HandleFunc("DELETE /api/sessions/{id}", s.auth(s.handleDeleteSession))
}

// Validates Authorization: Bearer <token>.
func (s *server) auth(next http.HandlerFunc) http.HandlerFunc {
	const prefix = "Bearer "
	return func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if !strings.HasPrefix(h, prefix) || !compareTokens(s.token, h[len(prefix):]) {
			w.Header().Set("WWW-Authenticate", "Bearer")
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeSessionError(w http.ResponseWriter, err error) {
	if errors.Is(err, session.ErrSessionNotFound) {
		http.Error(w, "session not found", http.StatusNotFound)
		return
	}
	http.Error(w, "internal error", http.StatusInternalServerError)
}

func (s *server) handleListSessions(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"sessions": s.sessions.List()})
}

func (s *server) handlePatchSession(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Pinned *bool `json:"pinned"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 1024)
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Pinned == nil {
		http.Error(w, `body must be {"pinned": bool}`, http.StatusBadRequest)
		return
	}

	id := r.PathValue("id")
	if err := s.sessions.SetPinned(id, *body.Pinned); err != nil {
		writeSessionError(w, err)
		return
	}

	// Returns 204 if the session destroyed by revocation
	sess, err := s.sessions.Get(id)
	if err != nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	writeJSON(w, http.StatusOK, sess.Info())
}

func (s *server) handleDeleteSession(w http.ResponseWriter, r *http.Request) {
	if err := s.sessions.Delete(r.PathValue("id")); err != nil {
		writeSessionError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
