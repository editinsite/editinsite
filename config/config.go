/*
	Package config provides access to global configuration, along with
	loading and saving. Configuration can come from a file, the environment,
	or the command line (in that order).
	Examples:
		* ./editinsite -port 8080 -dirs=a/myproject1:b/myproject2
		* ./editinsite --port=8080 a/myproject1:b/myprojects2

	The env parsing code is based on https://github.com/caarlos0/env
	MIT License / Copyright (c) 2015-2016 Carlos Alexandro Becker
*/
package config

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"time"
)

// Version of EditInsite server
const Version string = "0.1"

type settings struct {
	// File is the relative path to the server configuration file (or blank).
	File string `json:"-" env:"CONFIG_FILE" cli:"config" default:"editinsite.json" help:"Optional JSON server config"`

	// Port number for the server to run on.
	Port int `json:"port" env:"PORT" cli:"port,p" default:"8080" help:"Port to access site on"`

	// Projects is a list of development workspaces.
	Projects []string `json:"projects" env:"PROJECT_DIRS" cli:"dirs,d" separator:":" help:"List of projects separated by \":\""`
}

// FileValues are settings persisted to/from .File, which may differ
// from the current applied settings in .Value.
var FileValues settings

// Values are all applied settings for the editinsite server. This
// includes .FileValues plus any environment and cli variables.
var Values settings

// ErrHelp is the error returned by ParseFlags when the -help or -h flag is used.
var ErrHelp = errors.New("output help")

// ErrNoFile is the error returned by LoadFromFile/SaveToFile when no
// file is specified.
var ErrNoFile = errors.New("no file specified")

func init() {
	Reset()
}

// ParseFlags reads CLI arguments for config.Values to work with.
func ParseFlags() error {
	if err := parseFlags(reflect.TypeOf(Values)); err != nil {
		return err
	}
	if len(remainingArgs) == 1 {
		flagValues["Projects"] = remainingArgs[0]
	}
	return nil
}

// Reset all Values and FileValues properties to their defaults.
func Reset() {
	FileValues = settings{}
	parseFieldValues(&FileValues, getDefault)
	Apply()
}

// Apply combines file, environment, and cli properties (in that order)
// to the current applied Values.
func Apply() error {
	Values = FileValues
	err := parseFieldValues(&Values, getEnv)
	if err != nil {
		return err
	}
	err = parseFieldValues(&Values, getFlag)
	if err != nil {
		return err
	}
	path, err := filepath.Abs(Values.File)
	if err != nil {
		return err
	}
	Values.File = path
	return nil
}

// LoadFromFile brings the settings JSON into .FileValues if possible, overriding
// any current values.
func LoadFromFile(path string) error {

	Reset()

	// Don't need a config file if it's all through the ENV/CLI.
	if len(path) == 0 {
		return ErrNoFile
	}

	var file *os.File
	var err error

	// Try multiple times to load the file. This will be useful when we
	// are reloading in response to file changes, because it could have
	// a short-term write lock.
	for attempts := 0; attempts < 15; attempts++ {
		file, err = os.Open(path)
		if err == nil {
			break
		}
		if os.IsNotExist(err) {
			// File not found -- check if it is thru a symlink.
			// If the server is daemonized, the config may be a symlink to a
			// shared folder that has not mounted yet (Vagrant!), so give it
			// some time.
			if _, err2 := os.Lstat(path); err2 != nil {
				break
			}
		}
		time.Sleep(1 * time.Second)
	}
	if err != nil {
		return err
	}
	defer file.Close()

	err = json.NewDecoder(file).Decode(&FileValues)
	if err == nil {
		err = Apply()
	}
	return err
}

// SaveToFile writes the .FileValues settings as JSON to config.File.
func SaveToFile(path string) error {
	if len(path) == 0 {
		return ErrNoFile
	}
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()
	enc := json.NewEncoder(file)
	enc.SetIndent("", "  ")
	return enc.Encode(FileValues)
}

func getDefault(field reflect.StructField) (string, bool) {
	return field.Tag.Lookup("default")
}

func getEnv(field reflect.StructField) (string, bool) {
	key, ok := field.Tag.Lookup("env")
	if ok {
		return os.LookupEnv(key)
	}
	return "", false
}

func getFlag(field reflect.StructField) (string, bool) {
	v, ok := flagValues[field.Name]
	return v, ok
}
