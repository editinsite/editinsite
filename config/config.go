// Global configuration loading and saving
package config

import (
	"encoding/json"
	"os"
	"time"
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
	var file *os.File

	// If the server is daemonized, it is possible that its config is a
	// symlink to a shared folder that has not mounted yet (Vagrant!),
	// so give it some time.
	for attempts := 0; ; attempts++ {
		var err error
		file, err = os.Open(File)
		if err != nil {
			if os.IsNotExist(err) {
				err = nil
				if attempts < 15 {
					if _, err2 := os.Lstat(File); err2 == nil {
						time.Sleep(1 * time.Second)
						continue
					}
				}
			}
			return err
		}
		break
	}
	defer file.Close()
	return json.NewDecoder(file).Decode(&Values)
}

// Save the settings JSON to config.File.
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
