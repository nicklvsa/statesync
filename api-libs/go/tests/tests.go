package main

import (
	"statesync-go/statesync"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	sync := statesync.NewStateSync()

	unreg0 := sync.Callback(func(state statesync.State, update func(s statesync.State)) {
		if state.GetCompare("first_name", "Nick") {
			update(statesync.State{
				"first_name": "Bob",
			})
		}
	})

	sync.Callback(func(state statesync.State, update func(s statesync.State)) {
		state.Replacer("first_name", "hello", "bye", update)
	})

	// sync.Connect will work with any http handler (just pass in the writer and request)
	// optionally, we can also specify the websocket's read and write sizes as well as
	// the trusted origins <- this is recommended
	r.Any("/sync", func(c *gin.Context) {
		sync.Connect(c.Writer, c.Request, nil, nil, nil)
	})

	time.AfterFunc(time.Second*30, unreg0)

	r.Run(":8080")
}
