package server

import (
	"net"
	"net/http"
	"net/url"
	"slices"
	"strings"
)

func isLoopbackHost(h string) bool {
	switch strings.ToLower(h) {
	case "localhost", "127.0.0.1", "::1":
		return true
	}
	return false
}

func splitHostPort(hostport string) (host, port string) {
	h, p, err := net.SplitHostPort(hostport)
	if err != nil {
		return hostport, ""
	}
	return h, p
}

func checkOrigin(r *http.Request, allowedOrigins []string) bool {
	rh, rp := splitHostPort(r.Host)
	if !isLoopbackHost(rh) {
		return false
	}

	origin := r.Header.Get("Origin")
	if origin == "" {
		return false
	}

	if slices.Contains(allowedOrigins, origin) {
		return true
	}

	u, err := url.Parse(origin)
	if err != nil {
		return false
	}

	return isLoopbackHost(u.Hostname()) && u.Port() == rp
}
