package statesync

import "encoding/json"

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