package httpserver

import (
	"fmt"
	"net/http"

	"github.com/editinsite/editinsite/config"
)

// StartUntrusted will use a different port to serve untrusted content.
func StartUntrusted() error {
	port := fmt.Sprintf(":%d", config.Values.Port+1)
	mux := http.NewServeMux()
	mux.HandleFunc("/", handleRequest)
	return http.ListenAndServe(port, mux)
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "ui/untrusted.html")
}
