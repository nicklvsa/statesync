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
func BuildHTTPRequest(f func (data map[string]interface{}, err error)) (http.ResponseWriter, *http.Request) {
	r := http.Request{}
	w := WSResponseWriter{}
	
	var datas map[string]interface{}
	if err := json.Unmarshal(w.Data, &datas); err != nil {
		f(nil, err)
	}

	f(datas, nil)
	return w, &r
}