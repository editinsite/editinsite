// Global configuration loading and saving
package config

import (
	"encoding/json"
	"os"
)

const File = "editinsite.json"

// Configuration for development with editinsite.
var Values = struct {
	// Port number for the server to run on.
	Port int `json:"port"`

	// Projects is a list of development workspaces.
	Projects []string `json:"projects"`
}{
	Port: 8080,
}

// Load the settings JSON if possible, or fall back to defaults.
func Load() error {
	file, err := os.Open(File)
	if err != nil {
		if os.IsNotExist(err) {
			err = nil
		}
		return err
	}
	defer file.Close()
	return json.NewDecoder(file).Decode(&Values)
}

func Save() error {
	file, err := os.Create(File)
	if err != nil {
		return err
	}
	defer file.Close()
	enc := json.NewEncoder(file)
	enc.SetIndent("", "  ")
	return enc.Encode(Values)
}
