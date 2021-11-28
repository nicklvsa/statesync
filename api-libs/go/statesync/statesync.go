package statesync

import "github.com/gorilla/websocket"

type SocketEventType string

const (
	SocketEventTypeConnect    SocketEventType = "connect"
	SocketEventTypeDisconnect SocketEventType = "disconnect"
	SocketEventTypeJoin       SocketEventType = "receive"
	SocketEventTypeMove       SocketEventType = "send"
)

type SocketEvent struct {
	Type SocketEventType `json:"payload_type"`
	Payload interface{} `json:"payload"`
}

type SocketClient struct {
	Core       *StateSync
	Connection *websocket.Conn
	Data chan SocketEvent
}

type StateSync struct {
	isInitialized bool
	Clients       map[*SocketClient]bool
	Create        chan *SocketClient
	Destroy       chan *SocketClient
}