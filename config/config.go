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
	file, err := os.Open("./" + File)
	defer file.Close()
	if err == nil {
		err = json.NewDecoder(file).Decode(&Values)
	} else if os.IsNotExist(err) {
		err = nil
	}
	return err
}

func Save() error {
	file, err := os.Create("./" + File)
	defer file.Close()
	if (err == nil) {
		enc := json.NewEncoder(file)
		enc.SetIndent("", "  ")
		err = enc.Encode(Values)
	}
	return err
}
