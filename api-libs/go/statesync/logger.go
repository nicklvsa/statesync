package statesync

import (
	"fmt"
	"os"
)

func Info[T any](input T) {
	fmt.Printf("[INFO] - %+v\n", input)
}

func Warn[T any](input T) {
	fmt.Printf("[WARNING] - %+v\n", input)
}

func Err[T any](input T) {
	fmt.Printf("[ERROR] - %+v\n", input)
}

func Fatal[T any](input T) {
	fmt.Printf("[FATAL] - %+v\n", input)
	os.Exit(0)
}
