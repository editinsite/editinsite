package config

// Adapted in part from https://golang.org/src/flag/flag.go
// Copyright (c) 2009 The Go Authors. All rights reserved.
// BSD license: https://golang.org/LICENSE

import (
	"fmt"
	"os"
	"reflect"
	"strings"
)

var (
	flagFields    []*reflect.StructField
	flagNames     map[string]*reflect.StructField
	flagValues    map[string]string
	remainingArgs []string
)

func parseFlags(fieldStruct reflect.Type) error {

	setFlagFields(fieldStruct)

	remainingArgs = os.Args[1:]
	for {
		seen, err := parseNext(&remainingArgs)
		if seen {
			continue
		}
		if err == nil {
			break
		}
		return err
	}
	return nil
}

func setFlagFields(fieldStruct reflect.Type) {
	nbrFields := fieldStruct.NumField()
	flagFields = make([]*reflect.StructField, 0, nbrFields)
	flagNames = make(map[string]*reflect.StructField)
	flagValues = make(map[string]string)
	f := 0
	for i := 0; i < nbrFields; i++ {
		field := fieldStruct.Field(i)
		key, ok := field.Tag.Lookup("cli")
		if ok {
			names := strings.Split(key, ",")
			for n := 0; n < len(names); n++ {
				flagNames[names[n]] = &field
			}
			flagFields = flagFields[0 : len(flagFields)+1]
			flagFields[f] = &field
			f++
		}
	}
}

func parseNext(arguments *[]string) (bool, error) {
	args := *arguments
	if len(args) == 0 {
		return false, nil
	}
	s := args[0]
	if len(s) == 0 || s[0] != '-' || len(s) == 1 {
		return false, nil
	}
	numMinuses := 1
	if s[1] == '-' {
		numMinuses++
		if len(s) == 2 { // "--" terminates the flags
			*arguments = args[1:]
			return false, nil
		}
	}
	name := s[numMinuses:]
	if len(name) == 0 || name[0] == '-' || name[0] == '=' {
		return false, failf("bad flag syntax: %s", s)
	}

	// it's a flag. does it have an argument?
	args = args[1:]
	*arguments = args
	hasValue := false
	value := ""
	for i := 1; i < len(name); i++ { // equals cannot be first
		if name[i] == '=' {
			value = name[i+1:]
			hasValue = true
			name = name[0:i]
			break
		}
	}
	flag, isField := flagNames[name]
	if !isField {
		if name == "help" || name == "h" { // special case for nice help message.
			showHelp()
			return false, ErrHelp
		}
		return false, failf("unrecognized flag -%s", name)
	}

	if !hasValue {
		// value is the next arg
		if len(args) > 0 {
			value = args[0]
			args = args[1:]
			*arguments = args
		} else {
			return false, failf("flag needs an argument: -%s", name)
		}
	}
	flagValues[flag.Name] = value
	return true, nil
}

func showHelp() {
	fmt.Fprintf(os.Stderr, "EditInsite (v%s) is a web development server.\n", Version)
	fmt.Fprintf(os.Stderr, "\nAvailable parameters:\n")
	for i := 0; i < len(flagFields); i++ {
		field := flagFields[i]
		flags := strings.Split(field.Tag.Get("cli"), ",")
		usage := field.Tag.Get("help")
		defValue := field.Tag.Get("default")

		s := fmt.Sprintf("    --%-15s", strings.Join(flags, ", --"))
		if len(usage) != 0 {
			s += usage
		}
		if len(defValue) != 0 {
			s += fmt.Sprintf(" (%q)", defValue)
		}
		fmt.Fprint(os.Stderr, s, "\n")
	}
	fmt.Fprint(os.Stderr, "\n")
}

// failf prints to standard error a formatted error and usage message and
// returns the error.
func failf(format string, a ...interface{}) error {
	err := fmt.Errorf(format, a...)
	fmt.Fprintln(os.Stderr, err)
	showHelp()
	return err
}
