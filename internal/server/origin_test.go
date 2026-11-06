package server

import (
	"net/http"
	"testing"
)

func TestCheckOrigin(t *testing.T) {
	allowed := []string{"http://localhost:5173"}
	cases := []struct {
		name         string
		host, origin string
		want         bool
	}{
		{"same origin", "localhost:8080", "http://localhost:8080", true},
		{"127.0.0.1", "127.0.0.1:8080", "http://127.0.0.1:8080", true},
		{"mixture of localhost and 127.0.0.1", "127.0.0.1:8080", "http://localhost:8080", true},
		{"IPv6", "[::1]:8080", "http://[::1]:8080", true},
		{"No origin", "localhost:8080", "", false},
		{"access from other site", "localhost:8080", "https://example.com", false},
		{"different port", "localhost:8080", "http://localhost:9999", false},
		{"localhost.evil.com", "localhost:8080", "http://localhost.evil.com:8080", false},
		{"allowed origin", "localhost:8080", "http://localhost:5173", true},
	}
	for _, c := range cases {
		r := &http.Request{Host: c.host, Header: http.Header{}}
		if c.origin != "" {
			r.Header.Set("Origin", c.origin)
		}
		if got := checkOrigin(r, allowed); got != c.want {
			t.Errorf("%s: got %v, want %v", c.name, got, c.want)
		}
	}
}
