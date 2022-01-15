package statesync

import (
	"fmt"
	"os"
)

type T interface{}

func Info(input T) {
	fmt.Printf("[INFO] - %+v\n", input)
}

func Warn(input T) {
	fmt.Printf("[WARNING] - %+v\n", input)
}

func Err(input T) {
	fmt.Printf("[ERROR] - %+v\n", input)
}

func Fatal(input T) {
	fmt.Printf("[FATAL] - %+v\n", input)
	os.Exit(0)
}
