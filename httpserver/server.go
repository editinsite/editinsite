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

func projectHandler(w http.ResponseWriter, r *http.Request) {
	if len(r.URL.Path) > len("/projects/") {
		fileHandler(w, r)
	} else {
		list := project.SortByID()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(list)
	}
}

func fileHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path[len("/projects/"):]
	if !strings.Contains(path, "..") { // for security
		projEnd := strings.IndexByte(path, '/')
		if projEnd == -1 {
			projEnd = len(path)
		}
		projectID := path[0:projEnd]
		project := project.Workspaces[projectID]
		if projEnd >= len(path)-1 {
			listHandler(w, r, project)
		} else {
			filePath := path[projEnd+1:]
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
	http.HandleFunc("/projects/", projectHandler)
	http.Handle("/", http.FileServer(http.Dir("ui")))
	return http.ListenAndServe(port, nil)
}
