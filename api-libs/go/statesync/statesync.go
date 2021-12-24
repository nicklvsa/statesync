package statesync

import (
	"net/http"

	"github.com/gorilla/websocket"
)

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

var (
	REGISTERED_CALLBACKS = map[string]StateSyncCallback{}
	REGISTERED_ROUTES = map[string]HTTPDefintion{}
)

func makeRoute[T any](def HTTPDefintion) {
	REGISTERED_ROUTES[def.Route] = def
}

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

type WSResponseWriter struct {
	Data []byte
	Headers http.Header
}

type StateSyncCallback func(State, func(State))
