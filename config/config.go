// Package config provides access to global configuration, along with
// loading and saving. Configuration can come from a file, the
// environment, or the command line (in that order).
// The env parsing code is based on https://github.com/caarlos0/env
// MIT License / Copyright (c) 2015-2016 Carlos Alexandro Becker
package config

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"time"
)

// TODO: Add cli flags support as well (-p and -d)

type settings struct {
	// File is the relative path to the server configuration file (or blank).
	File string `json:"-" env:"CONFIG_FILE" default:"editinsite.json"`

	// Port number for the server to run on.
	Port int `json:"port" env:"PORT" default:"8080"`

	// Projects is a list of development workspaces.
	Projects []string `json:"projects" env:"PROJECT_DIRS" separator:":"`
}

// FileValues are settings persisted to/from .File, which may differ
// from the current applied settings in .Value.
var FileValues settings

// Values are all applied settings for the editinsite server. This
// includes .FileValues plus any environment and cli variables.
var Values settings

func init() {
	Reset()
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
	path, err := filepath.Abs(Values.File)
	if err != nil {
		return err
	}
	Values.File = path
	return nil
}

// Load the settings JSON into .FileValues if possible, overriding
// any current values.
func Load() error {

	Reset()

	// Don't need a config file if it's all through the ENV/CLI.
	if len(Values.File) == 0 {
		return nil
	}

	var file *os.File
	var err error

	// Try multiple times to load the file. This will be useful when we
	// are reloading in response to file changes, because it could have
	// a short-term write lock.
	for attempts := 0; attempts < 15; attempts++ {
		file, err = os.Open(Values.File)
		if err == nil {
			break
		}
		if os.IsNotExist(err) {
			// File not found -- check if it is thru a symlink.
			// If the server is daemonized, the config may be a symlink to a
			// shared folder that has not mounted yet (Vagrant!), so give it
			// some time.
			if _, err2 := os.Lstat(Values.File); err2 != nil {
				return nil
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

// Save the .FileValues settings as JSON to config.File.
func Save() error {
	if len(Values.File) == 0 {
		return nil
	}
	file, err := os.Create(Values.File)
	if err != nil {
		return err
	}
	defer file.Close()
	enc := json.NewEncoder(file)
	enc.SetIndent("", "  ")
	return enc.Encode(FileValues)
}

// errNotAStructPtr is returned if you pass something that is not a pointer to a
// Struct
var errNotAStructPtr = errors.New("Expected a pointer to a Struct")

type valueToGet func(reflect.StructField) (string, bool)

// parseFieldValues takes a struct containing `env` or `default` tags and loads
// its values from environment variables or tag values.
func parseFieldValues(v interface{}, getFn valueToGet) error {
	ptrRef := reflect.ValueOf(v)
	if ptrRef.Kind() != reflect.Ptr {
		return errNotAStructPtr
	}
	ref := ptrRef.Elem()
	if ref.Kind() != reflect.Struct {
		return errNotAStructPtr
	}

	refType := ref.Type()
	var errorList []string

	for i := 0; i < refType.NumField(); i++ {
		value, ok := getFn(refType.Field(i))
		if ok {
			if err := setFieldValue(ref.Field(i), refType.Field(i), value); err != nil {
				errorList = append(errorList, err.Error())
				continue
			}
		}
	}
	if len(errorList) == 0 {
		return nil
	}
	return errors.New(strings.Join(errorList, ". "))
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
