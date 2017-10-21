// Package httpserver provides the HTTP server for the EditInsite pages and API.
package httpserver

import (
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"os"
	"strings"

	"github.com/editinsite/editinsite/config"
	"github.com/editinsite/editinsite/projects"
)

var dirListTemplate = template.Must(template.New("dir").Parse(`<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<title>Directory listing</title>
</head>
<body>
	<ul>
	{{range .}}<li><a href="{{.}}">{{.}}</a></li>{{end}}
	</ul>
</body>
</html>`))

var projectListTemplate = template.Must(template.New("project").Parse(`<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<title>Project listing</title>
</head>
<body>
	<ul>
	{{range .}}<li><a href="/projects/{{.Name}}/">{{.Name}}</a></li>{{end}}
	</ul>
</body>
</html>`))

// Start will begin serving the editinsite pages and API.
func Start() error {
	port := fmt.Sprintf(":%d", config.Values.Port)
	http.HandleFunc("/projects/", handleProject)
	http.HandleFunc("/files/", handleEditor)
	http.HandleFunc("/preview/", handleEditor)
	http.HandleFunc("/run/", handleRun)
	http.Handle("/", http.FileServer(http.Dir("ui")))
	return http.ListenAndServe(port, nil)
}

func handleEditor(w http.ResponseWriter, r *http.Request) {
	path := "ui/index.html"
	info, err := os.Stat(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	file, err := os.Open(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer file.Close()
	http.ServeContent(w, r, info.Name(), info.ModTime(), file)
}

func handleProject(w http.ResponseWriter, r *http.Request) {
	if len(r.URL.Path) > len("/projects/") {
		handleFile(w, r)
	} else {
		list := projects.SortByID()
		accept := r.Header.Get("Accept")
		var err error
		if r.Method == "POST" && strings.Contains(accept, "application/json") {
			// for security, don't allow a JSON array response to a GET.
			w.Header().Set("Content-Type", "application/json")
			err = json.NewEncoder(w).Encode(list)
		} else {
			err = projectListTemplate.Execute(w, list)
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func handleFile(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path[len("/projects/"):]
	project, path := parseProject(w, r, path)
	if project == nil {
		return
	}
	path, isDir := parsePath(w, r, project, path)
	if path == "" {
		return
	}

	if isDir {
		handleList(w, r, project, path)
	} else {
		if r.Method == "POST" {
			handleSave(w, r, project, path)
		} else {
			handleLoad(w, r, project, path)
		}
	}
}

func handleRun(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path[len("/run/"):]
	project, path := parseProject(w, r, path)
	if project == nil {
		return
	}

	// TODO: serve based on config (static, or proxy for dyn server)
	handleStatic(w, r, project, path)
}

func handleList(w http.ResponseWriter, r *http.Request, p *projects.Workspace, subDir string) {
	list, err := p.Files(subDir)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	accept := r.Header.Get("Accept")
	if r.Method == "POST" && strings.Contains(accept, "application/json") {
		// for security, don't allow a JSON array response to a GET.
		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(list)
	} else {
		err = dirListTemplate.Execute(w, list)
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func handleLoad(w http.ResponseWriter, r *http.Request, p *projects.Workspace, file string) {
	if err := p.ServeFile(w, r, file); err != nil {
		if os.IsNotExist(err) {
			http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}
}

func handleSave(w http.ResponseWriter, r *http.Request, p *projects.Workspace, file string) {
	err := p.SaveFile(file, r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func handleStatic(w http.ResponseWriter, r *http.Request, p *projects.Workspace, path string) {
	path, isDir := parsePath(w, r, p, path)
	if isDir {
		handleLoad(w, r, p, path+"index.html")
	} else {
		// TODO: if index.html, remove filename and redirect to dir. See http.ServeFile
		handleLoad(w, r, p, path)
	}
}

// parseProject returns project (or nil) and relative path of content.
func parseProject(w http.ResponseWriter, r *http.Request, path string) (*projects.Workspace, string) {
	if strings.Contains(path, "..") {
		// prevent directory traversal attacks
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		return nil, ""
	}

	projEnd := strings.IndexByte(path, '/')
	if projEnd == -1 {
		http.Redirect(w, r, r.URL.Path+"/", http.StatusMovedPermanently)
		return nil, ""
	}
	projectID := path[0:projEnd]
	project := projects.Registry[projectID]
	path = path[projEnd:]
	return project, path
}

// parsePath returns file path (or "") and true if directory.
func parsePath(w http.ResponseWriter, r *http.Request, p *projects.Workspace, path string) (string, bool) {
	isDir := path[len(path)-1] == '/'
	if !isDir {
		var err error
		isDir, err = p.IsDir(path)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return "", false
		}
		if isDir {
			http.Redirect(w, r, r.URL.Path+"/", http.StatusMovedPermanently)
			return "", true
		}
	}
	return path, isDir
}
