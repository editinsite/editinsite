// Global configuration loading and saving
package config

import (
	"github.com/editinsite/editinsite/project"
)

const path = "settings.json"

// Configuration for development with editinsite.
var Values = struct {
	// Port number for the server to run on.
	Port int `json:"port"`

	// Projects is a list of development workspaces.
	Projects []project.Workspace `json:"projects"`
}{
	Port: 8080,
	Projects: []project.Workspace{
		project.Workspace{
			Name: "example",
			Path: "/home/ubuntu/src/github.com/editinsite/editinsite/example/",
		},
	},
}

func Load() {
	// todo
}

func Save() {
	// todo
}
