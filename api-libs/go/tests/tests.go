package main

import (
	"statesync-go/statesync"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	sync := statesync.NewStateSync()

	sync.Callback(func(current statesync.State, update func(s statesync.State)) {
		current.Replacer("first_name", "hello", "bye", update)
	})

	sync.SendState(statesync.State{
		"first_name": "Nick",
	})

	// time.AfterFunc(time.Second*30, cancel)

	// sync.Connect will work with any http handler (just pass in the writer and request)
	// optionally, we can also specify the websocket's read and write sizes as well as
	// the trusted origins <- this is recommended
	r.Any("/sync", func(c *gin.Context) {
		sync.Connect(c.Writer, c.Request, nil, nil, nil)
	})

	r.Run(":8080")
}
