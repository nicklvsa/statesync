package statesync

import "github.com/gorilla/websocket"

type SocketEventType string

const (
	SocketEventTypeConnect    SocketEventType = "CONNECT"
	SocketEventTypeDisconnect SocketEventType = "DISCONNECT"
	SocketEventTypeReceive      SocketEventType = "RECEIVE"
	SocketEventTypeSend      SocketEventType = "SEND"
)

type MessageType string

const (
	MessageTypeSync MessageType = "SYNC"
	MessageTypeHTTP MessageType = "HTTP"
)

type SocketEvent struct {
	Type SocketEventType `json:"payload_type"`
	MessageType MessageType `json:"message_type"`
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