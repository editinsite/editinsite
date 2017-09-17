// Track projects for editing in a local workspace.
package projects

import (
	"path/filepath"
	"sort"
)

type Workspace struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Path string `json:"path"`
}

var Registry map[string]*Workspace = make(map[string]*Workspace)

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
	Registry[id] = project
	return project, nil
}

// List of managed workspaces
func List() []*Workspace {
	list := make([]*Workspace, len(Registry))
	i := 0
	for _, value := range Registry {
		list[i] = value
		i++
	}
	return list
}

func SortByID() []*Workspace {
	projects := List()
	sort.Slice(projects, func(i, j int) bool { return projects[i].ID < projects[j].ID })
	return projects
}
