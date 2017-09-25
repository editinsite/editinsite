// Package config provides global configuration loading and saving.
// The env parsing code is based on https://github.com/caarlos0/env
// MIT License / Copyright (c) 2015-2016 Carlos Alexandro Becker
package config

import (
	"encoding/json"
	"errors"
	"os"
	"reflect"
	"strings"
	"time"
)

// File is the relative path to the server configuration file.
const File = "editinsite.json"

// TODO: Add cli flags support as well (-p and -d)

type settings struct {
	// Port number for the server to run on.
	Port int `json:"port" env:"PORT" default:"8080"`

	// Projects is a list of development workspaces.
	Projects []string `json:"projectDirs" env:"DIRS"`
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
	return parseFieldValues(&Values, getEnv)
}

// Load the settings JSON into .FileValues if possible, overriding
// any current values.
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

	Reset()
	err := json.NewDecoder(file).Decode(&FileValues)
	if err == nil {
		err = Apply()
	}
	return err
}

// Save the .FileValues settings as JSON to config.File.
func Save() error {
	file, err := os.Create(File)
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
