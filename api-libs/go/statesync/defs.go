package statesync

import (
	"net/http"
	"time"
)

const (
	SocketMaxMessageSize = 1024
	SocketPingAckTimeout = 30 * time.Second
	SocketWriteTimeout   = 10 * time.Second
	SocketPingPeriod     = (SocketPingAckTimeout * 9) / 10
)

type State map[string]interface{}

type SyncMessage struct {
	State *State `json:"state"`
}

type HTTPResponseMessage struct {
	RequestID string `json:"request_id"`
	Data *State `json:"data"`
}

type HTTPHandler func() http.HandlerFunc

type HTTPDefintion struct {
	Route string 
	Method string
	Handler func(http.ResponseWriter, *http.Request)
}
