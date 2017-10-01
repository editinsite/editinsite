package config

// Adapted from https://github.com/caarlos0/env
// MIT License / Copyright (c) 2015-2016 Carlos Alexandro Becker

// TODO: Show user-friendly errors when value type does not match the field.

import (
	"errors"
	"reflect"
	"strconv"
	"strings"
	"time"
)

var (
	// errNotAStructPtr if you don't pass a pointer to a Struct
	errNotAStructPtr = errors.New("Expected a pointer to a Struct")
	// errUnsupportedType if the struct field type is not supported
	errUnsupportedType = errors.New("Type is not supported")
	// errUnsupportedSliceType if the slice element type is not supported
	errUnsupportedSliceType = errors.New("Unsupported slice type")

	// Friendly names for reflect types
	sliceOfInts     = reflect.TypeOf([]int(nil))
	sliceOfInt64s   = reflect.TypeOf([]int64(nil))
	sliceOfStrings  = reflect.TypeOf([]string(nil))
	sliceOfBools    = reflect.TypeOf([]bool(nil))
	sliceOfFloat32s = reflect.TypeOf([]float32(nil))
	sliceOfFloat64s = reflect.TypeOf([]float64(nil))
)

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
				errorList = append(errorList, "cannot set "+refType.Field(i).Name+": "+err.Error())
				continue
			}
		}
	}
	if len(errorList) == 0 {
		return nil
	}
	return errors.New(strings.Join(errorList, ". "))
}

func setFieldValue(field reflect.Value, refType reflect.StructField, value string) error {
	switch field.Kind() {
	case reflect.Slice:
		separator := refType.Tag.Get("separator")
		return handleSlice(field, value, separator)
	case reflect.String:
		field.SetString(value)
	case reflect.Bool:
		bvalue, err := strconv.ParseBool(value)
		if err != nil {
			return err
		}
		field.SetBool(bvalue)
	case reflect.Int:
		intValue, err := strconv.ParseInt(value, 10, 32)
		if err != nil {
			return err
		}
		field.SetInt(intValue)
	case reflect.Uint:
		uintValue, err := strconv.ParseUint(value, 10, 32)
		if err != nil {
			return err
		}
		field.SetUint(uintValue)
	case reflect.Float32:
		v, err := strconv.ParseFloat(value, 32)
		if err != nil {
			return err
		}
		field.SetFloat(v)
	case reflect.Float64:
		v, err := strconv.ParseFloat(value, 64)
		if err != nil {
			return err
		}
		field.Set(reflect.ValueOf(v))
	case reflect.Int64:
		if refType.Type.String() == "time.Duration" {
			dValue, err := time.ParseDuration(value)
			if err != nil {
				return err
			}
			field.Set(reflect.ValueOf(dValue))
		} else {
			intValue, err := strconv.ParseInt(value, 10, 64)
			if err != nil {
				return err
			}
			field.SetInt(intValue)
		}
	default:
		return errUnsupportedType
	}
	return nil
}

func handleSlice(field reflect.Value, value, separator string) error {
	if separator == "" {
		separator = ","
	}

	splitData := strings.Split(value, separator)

	switch field.Type() {
	case sliceOfStrings:
		field.Set(reflect.ValueOf(splitData))
	case sliceOfInts:
		intData, err := parseInts(splitData)
		if err != nil {
			return err
		}
		field.Set(reflect.ValueOf(intData))
	case sliceOfInt64s:
		int64Data, err := parseInt64s(splitData)
		if err != nil {
			return err
		}
		field.Set(reflect.ValueOf(int64Data))

	case sliceOfFloat32s:
		data, err := parseFloat32s(splitData)
		if err != nil {
			return err
		}
		field.Set(reflect.ValueOf(data))
	case sliceOfFloat64s:
		data, err := parseFloat64s(splitData)
		if err != nil {
			return err
		}
		field.Set(reflect.ValueOf(data))
	case sliceOfBools:
		boolData, err := parseBools(splitData)
		if err != nil {
			return err
		}
		field.Set(reflect.ValueOf(boolData))
	default:
		return errUnsupportedSliceType
	}
	return nil
}

func parseInts(data []string) ([]int, error) {
	var intSlice []int

	for _, v := range data {
		intValue, err := strconv.ParseInt(v, 10, 32)
		if err != nil {
			return nil, err
		}
		intSlice = append(intSlice, int(intValue))
	}
	return intSlice, nil
}

func parseInt64s(data []string) ([]int64, error) {
	var intSlice []int64

	for _, v := range data {
		intValue, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return nil, err
		}
		intSlice = append(intSlice, int64(intValue))
	}
	return intSlice, nil
}

func parseFloat32s(data []string) ([]float32, error) {
	var float32Slice []float32

	for _, v := range data {
		data, err := strconv.ParseFloat(v, 32)
		if err != nil {
			return nil, err
		}
		float32Slice = append(float32Slice, float32(data))
	}
	return float32Slice, nil
}

func parseFloat64s(data []string) ([]float64, error) {
	var float64Slice []float64

	for _, v := range data {
		data, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return nil, err
		}
		float64Slice = append(float64Slice, float64(data))
	}
	return float64Slice, nil
}

func parseBools(data []string) ([]bool, error) {
	var boolSlice []bool

	for _, v := range data {
		bvalue, err := strconv.ParseBool(v)
		if err != nil {
			return nil, err
		}

		boolSlice = append(boolSlice, bvalue)
	}
	return boolSlice, nil
}
