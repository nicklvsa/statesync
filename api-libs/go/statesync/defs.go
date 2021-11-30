package statesync

import "time"

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