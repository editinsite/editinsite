// Represents a single tracked web project.
package project

import (
	"io/ioutil"
	"strings"
)

type Workspace struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

type File struct {
	Name string `json:"name"`
	Path string `json:"path"`
	Body string `json:"body"`
}

func (w *Workspace) Files() (*[]string, error) {
	files, err := ioutil.ReadDir(w.Path)
	if err != nil {
		return nil, err
	}
	fileList := []string{}
	for _, f := range files {
		fileList = append(fileList, f.Name())
	}
	return &fileList, nil
}

func (w *Workspace) LoadFile(path string) (*File, error) {
	filename := w.Path + path
	body, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	name := path
	if i := strings.LastIndexByte(name, '/'); i != -1 {
		name = name[i+1:]
	}
	return &File{Name: name, Path: path, Body: string(body)}, nil
}

func (p *Workspace) SaveFile(file *File) error {
	return ioutil.WriteFile(p.Path+file.Path, []byte(file.Body), 0600)
}