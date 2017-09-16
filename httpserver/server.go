// HTTP server for EditInsite
package httpserver

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/editinsite/editinsite/config"
	"github.com/editinsite/editinsite/project"
)

func fileHandler(w http.ResponseWriter, r *http.Request) {
	// Skip the "/project/" text that begins the URL
	path := r.URL.Path[9:]
	if !strings.Contains(path, "..") {
		projEnd := strings.IndexByte(path, '/')
		if projEnd == -1 || projEnd == len(path)-1 {
			//projectName := path[2:]
			project := project.Workspaces["example"]
			listHandler(w, r, project)
		} else {
			//projectName := path[2:projEnd]
			filePath := path[projEnd+1:]
			project := project.Workspaces["example"]
			if r.Method == "POST" {
				saveHandler(w, r, project, filePath)
			} else {
				loadHandler(w, r, project, filePath)
			}
		}
	}
}

func listHandler(w http.ResponseWriter, r *http.Request, p *project.Workspace) {
	list, err := p.Files()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func loadHandler(w http.ResponseWriter, r *http.Request, p *project.Workspace,
	file string) {
	f, err := p.LoadFile(file)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(f)
}

func saveHandler(w http.ResponseWriter, r *http.Request, p *project.Workspace,
	file string) {
	body := r.FormValue("body")
	f := &project.File{Name: file, Path: file, Body: body}
	err := p.SaveFile(f)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func Start() error {
	port := fmt.Sprintf(":%d", config.Values.Port)
	http.HandleFunc("/project/", fileHandler)
	http.Handle("/", http.FileServer(http.Dir("ui")))
	return http.ListenAndServe(port, nil)
}
