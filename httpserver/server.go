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

func editHandler(w http.ResponseWriter, r *http.Request) {
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

func projectHandler(w http.ResponseWriter, r *http.Request) {
	if len(r.URL.Path) > len("/projects/") {
		fileHandler(w, r)
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

func fileHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path[len("/projects/"):]
	if strings.Contains(path, "..") {
		// prevent directory traversal attacks
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

// Start will begin serving the editinsite pages and API.
func Start() error {
	port := fmt.Sprintf(":%d", config.Values.Port)
	http.HandleFunc("/projects/", projectHandler)
	http.HandleFunc("/files/", editHandler)
	http.Handle("/", http.FileServer(http.Dir("ui")))
	return http.ListenAndServe(port, nil)
}
