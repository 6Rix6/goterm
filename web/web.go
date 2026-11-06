package web

import (
	"embed"
	"io/fs"
	"net/http"
	"os"
)

//go:embed all:dist
var distFS embed.FS

var MainFS fs.FS

func init() {
	sub, err := fs.Sub(distFS, "dist")
	if err != nil {
		panic(err)
	}
	MainFS = sub
}

func WebFsHandler() http.Handler {
	return spaFileSystemHandler(MainFS)
}

func spaFileSystemHandler(fSys fs.FS) http.Handler {
	fileServer := http.FileServer(http.FS(fSys))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path != "" && path[0] == '/' {
			path = path[1:]
		}

		if path == "" {
			fileServer.ServeHTTP(w, r)
			return
		}

		_, err := fs.Stat(fSys, path)
		if os.IsNotExist(err) {
			r.URL.Path = "/"
		}

		fileServer.ServeHTTP(w, r)
	})
}
