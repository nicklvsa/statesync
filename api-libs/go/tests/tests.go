package main

import (
	"net/http"
	"statesync-go/statesync"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	sync := statesync.NewStateSync()

	route, method, handler := sync.RegisterRoute("/hello_world", "GET", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("{\"message\": \"Hello World\"}"))
	})
	r.Handle(route, method, gin.WrapF(handler))

	// r.GET("/hello_world", func (c *gin.Context) {
	// 	c.JSON(200, gin.H{
	// 		"message": "Hello World",
	// 	})
	// })

	unreg := sync.RegisterCallback(func(state statesync.State, update func(s statesync.State)) {
		if state.GetCompare("first_name", "Nick") {
			update(statesync.State{
				"first_name": "Bob",
			})
		}
	})

	// sync.Connect will work with any http handler (just pass in the writer and request)
	// optionally, we can also specify the websocket's read and write sizes as well as
	// the trusted origins <- this is recommended
	r.Any("/sync", func (c *gin.Context) {
		sync.Connect(c.Writer, c.Request, nil, nil, nil)
	})

	time.AfterFunc(time.Second*25, unreg)

	r.Run(":8080")
}