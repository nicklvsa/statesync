package statesync

import (
	"encoding/json"

	"github.com/r3labs/diff/v2"
)

func GetPointerToInt(num int) *int {
	return &num
}

func GetPointerToStr(str string) *string {
	return &str
}

func UnmarshalInterface(data, intoModel interface{}) error {
	encoded, err := json.Marshal(data)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(encoded, &intoModel); err != nil {
		return err
	}

	return nil
}

func MergeStates(orig, updated State) (*State, bool) {
	changelog, err := diff.Diff(orig, updated)
	if err != nil {
		return nil, false
	}

	for _, change := range changelog {
		if change.From != change.To && change.To != nil {
			for _, path := range change.Path {
				orig[path] = change.To
			}
		}
	}

	return &orig, true
}
