// Web development project registered with the system.
package project

import (
	"path/filepath"
	"sort"
)

type Workspace struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Path string `json:"path"`
}

var Workspaces map[string]*Workspace = make(map[string]*Workspace)

func LoadAll(paths []string) {
	for _, path := range paths {
		Load(path)
	}
}

func Load(path string) (*Workspace, error) {
	// todo: load and cache project settings file
	id := filepath.Base(path)
	project := &Workspace{
		ID:   id,
		Name: id,
		Path: path,
	}
	Workspaces[id] = project
	return project, nil
}

type wsList []*Workspace
func (p wsList) Len() int           { return len(p) }
func (p wsList) Swap(i, j int)      { p[i], p[j] = p[j], p[i] }
func (p wsList) Less(i, j int) bool { return p[i].ID < p[j].ID }

func SortByID() ([]*Workspace) {
	ws := make([]*Workspace, len(Workspaces))
	i := 0
	for _, value := range Workspaces {
		ws[i] = value
		i++
	}
	sort.Sort(wsList(ws))
	return ws
}
