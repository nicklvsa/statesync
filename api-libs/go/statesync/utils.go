package statesync

import (
	"encoding/json"
	"net/http"
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

func MergeStates(states ...State) (s State) {
	s = make(State)

	for _, m := range states {
		for k, v := range m {
			s[k] = v
		}
	}

	return s
}

// TODO: build out http request -> ws response converter
func BuildHTTPRequest(func (data map[string]interface{})) (http.ResponseWriter, *http.Request) {
	r := http.Request{}
	var w http.ResponseWriter

	return w, &r
}