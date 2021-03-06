package main

import (
	"fmt"
	"statesync-go/statesync"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	sync := statesync.NewStateSync()

	sync.Callback(func(current statesync.State, update func(s statesync.State)) {
		current.Replacer("first_name", "hello", "bye", update)
	})

	go func() {
		for x := range time.Tick(5 * time.Second) {
			sync.SendState(statesync.State{
				"status": fmt.Sprintf("new status %d", x.Second()),
			})
		}
	}()

	// time.AfterFunc(time.Second*30, cancel)

	// sync.Connect will work with any http handler (just pass in the writer and request)
	// optionally, we can also specify the websocket's read and write sizes as well as
	// the trusted origins <- this is recommended
	r.Any("/sync", func(c *gin.Context) {
		sync.Connect(c.Writer, c.Request, nil, nil, nil)
	})

	r.Run(":8080")
}
