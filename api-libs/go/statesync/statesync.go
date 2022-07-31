package statesync

import (
	"net/http"

	"github.com/gorilla/websocket"
)

type SocketEventType string

const (
	SocketEventTypeConnect    SocketEventType = "CONNECT"
	SocketEventTypeDisconnect SocketEventType = "DISCONNECT"
	SocketEventTypeReceive    SocketEventType = "RECEIVE"
	SocketEventTypeSend       SocketEventType = "SEND"
)

type MessageType string

const (
	MessageTypeSync MessageType = "SYNC"
)

var (
	REGISTERED_CALLBACKS = map[string]StateSyncCallback{}
	QUEUED_PAYLOADS      = []*SocketEvent{}
)

type SocketEvent struct {
	Type        SocketEventType `json:"payload_type"`
	MessageType MessageType     `json:"message_type"`
	Payload     interface{}     `json:"payload"`
}

type SocketClient struct {
	Core       *StateSync
	Connection *websocket.Conn
	Data       chan SocketEvent
}

type StateSync struct {
	redis         *StateSyncRedisClient
	isConnected   bool
	isInitialized bool
	Clients       map[*SocketClient]bool
	Create        chan *SocketClient
	Destroy       chan *SocketClient
}

type WSResponseWriter struct {
	Data    []byte
	Headers http.Header
}

type StateSyncCallback func(State, func(State))
