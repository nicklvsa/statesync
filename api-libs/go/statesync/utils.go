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