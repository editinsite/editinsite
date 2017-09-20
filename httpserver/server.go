// HTTP server for EditInsite
package httpserver

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/editinsite/editinsite/config"
	"github.com/editinsite/editinsite/projects"
)

func projectHandler(w http.ResponseWriter, r *http.Request) {
	if len(r.URL.Path) > len("/projects/") {
		fileHandler(w, r)
	} else {
		list := projects.SortByID()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(list)
	}
}

func fileHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path[len("/projects/"):]
	if strings.Contains(path, "..") {
		// for security
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return
	}

	projEnd := strings.IndexByte(path, '/')
	if projEnd == -1 {
		http.Redirect(w, r, r.URL.Path+"/", http.StatusMovedPermanently)
		return
	}
	projectID := path[0:projEnd]
	project := projects.Registry[projectID]

	filePath := path[projEnd:]
	isDir := filePath[len(filePath)-1] == '/'
	if !isDir {
		var err error
		isDir, err = project.IsDir(filePath)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if isDir {
			http.Redirect(w, r, r.URL.Path+"/", http.StatusMovedPermanently)
			return
		}
	}
	if isDir {
		listHandler(w, r, project, filePath)
	} else {
		if r.Method == "POST" {
			saveHandler(w, r, project, filePath)
		} else {
			loadHandler(w, r, project, filePath)
		}
	}
}

func listHandler(w http.ResponseWriter, r *http.Request, p *projects.Workspace, subDir string) {
	list, err := p.Files(subDir)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	//w.Header().Set("Content-Length", strconv.Itoa(len(buffer)))
	json.NewEncoder(w).Encode(list)
}

func loadHandler(w http.ResponseWriter, r *http.Request, p *projects.Workspace, file string) {
	if err := p.ServeFile(w, r, file); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func saveHandler(w http.ResponseWriter, r *http.Request, p *projects.Workspace, file string) {
	err := p.SaveFile(file, r.Body)
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
