package statesync

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/xid"
)

func NewStateSync() *StateSync {
	redisClient := NewRedisClient(nil, "redis")

	sync := StateSync{
		redis:         redisClient,
		isConnected:   false,
		isInitialized: true,
		Clients:       make(map[*SocketClient]bool),
		Create:        make(chan *SocketClient),
		Destroy:       make(chan *SocketClient),
	}

	go sync.Run()
	return &sync
}

func (s *StateSync) Run() {
	pubsub, err := s.redis.Subscribe("task_message")
	if err != nil {
		Fatal("Unable to make redis subscription")
	}

	for {
		select {
		case client := <-s.Create:
			s.CreateClient(client)
		case client := <-s.Destroy:
			s.DestroyClient(client)
		case client := <-pubsub.Channel():
			var redisPayload RedisClientPayload

			if err := json.Unmarshal([]byte(client.Payload), &redisPayload); err != nil {
				Err("Unable to decode redis payload")
			}

			if redisPayload.ID != s.redis.ID {
				if err := s.BroadcastAll(redisPayload.Data); err != nil {
					Err("Unable to broadcast redis payload")
				}
			}
		}
	}
}

func (s *StateSync) Connect(writer http.ResponseWriter, request *http.Request, readSize, writeSize *int, origins []string) {
	if readSize == nil {
		readSize = GetPointerToInt(1024)
	}

	if writeSize == nil {
		writeSize = GetPointerToInt(1024)
	}

	upgrader := websocket.Upgrader{
		ReadBufferSize:  *readSize,
		WriteBufferSize: *writeSize,
	}

	upgrader.CheckOrigin = func(r *http.Request) bool {
		if len(origins) == 0 {
			return true
		}

		for _, origin := range origins {
			if origin == r.Header.Get("Origin") {
				return true
			}
		}

		return false
	}

	conn, err := upgrader.Upgrade(writer, request, nil)
	if err != nil {
		Fatal(err)
	}

	s.RegisterConnection(conn)
	s.isConnected = true
}

func (s *StateSync) CreateClient(client *SocketClient) {
	s.Clients[client] = true

	event := SocketEvent{
		Type:    SocketEventTypeConnect,
		Payload: nil,
	}

	if err := s.HandleEvent(client, &event); err != nil {
		Info(err)
	}
}

func (s *StateSync) Callback(callback StateSyncCallback) func() {
	ident := xid.New().String()
	REGISTERED_CALLBACKS[ident] = callback

	return func() {
		delete(REGISTERED_CALLBACKS, ident)
	}
}

func (s *StateSync) SendState(state State) error {
	payload := SocketEvent{
		Type:        SocketEventTypeReceive,
		MessageType: MessageTypeSync,
		Payload: &SyncMessage{
			State: &state,
		},
	}

	if !s.isInitialized || !s.isConnected {
		QUEUED_PAYLOADS = append(QUEUED_PAYLOADS, &payload)
		return nil
	}

	return s.BroadcastAll(&payload)
}

func (s *StateSync) BroadcastAll(payload *SocketEvent) error {
	if payload == nil || payload.Payload == nil {
		return fmt.Errorf("[ERR] - payload is nil")
	}

	for client, active := range s.Clients {
		if active {
			client.Data <- *payload
		}
	}

	return nil
}

func (s *StateSync) Emit(client *SocketClient, payload *SocketEvent) error {
	if payload == nil || payload.Payload == nil {
		return fmt.Errorf("[ERR] - payload is nil")
	}

	s.redis.Publish("task_message", &RedisClientPayload{
		ID:   s.redis.ID,
		Data: payload,
	})

	client.Data <- *payload

	return nil
}

func (s *StateSync) HandleEvent(client *SocketClient, payload *SocketEvent) error {
	Info(*payload)
	switch payload.Type {
	case SocketEventTypeSend:
		// do stuff with state
		var message State
		if err := UnmarshalInterface(payload.Payload, &message); err != nil {
			return err
		}

		switch payload.MessageType {
		case MessageTypeSync:
			payload := SocketEvent{
				Type:        SocketEventTypeReceive,
				MessageType: MessageTypeSync,
				Payload: &SyncMessage{
					State: &message,
				},
			}

			if err := s.Emit(client, &payload); err != nil {
				return err
			}

			go func() {
				for _, callback := range REGISTERED_CALLBACKS {
					callback(message, func(state State) {
						if merged, ok := MergeStates(message, state); ok {
							payload := SocketEvent{
								Type:        SocketEventTypeReceive,
								MessageType: MessageTypeSync,
								Payload: &SyncMessage{
									State: merged,
								},
							}

							s.Emit(client, &payload)
						}
					})
				}
			}()
		}
	}

	go func() {
		for _, payload := range QUEUED_PAYLOADS {
			s.Emit(client, payload)
		}
	}()

	return nil
}

func (s *StateSync) DestroyClient(client *SocketClient) error {
	if client.Data != nil {
		close(client.Data)
	}

	if err := client.Connection.Close(); err != nil {
		return err
	}

	delete(s.Clients, client)

	return nil
}

func (s *StateSync) RegisterConnection(conn *websocket.Conn) {
	if s.isInitialized {
		client := SocketClient{
			Core:       s,
			Connection: conn,
			Data:       make(chan SocketEvent),
		}

		go s.RegisterWriter(&client)
		go s.RegisterReader(&client)

		client.Core.Create <- &client
	}
}

func (s *StateSync) RegisterWriter(client *SocketClient) {
	ticker := time.NewTicker(SocketPingPeriod)

	defer func() {
		ticker.Stop()
		client.Connection.Close()
	}()

	for {
		select {
		case payload, ok := <-client.Data:
			client.Connection.SetWriteDeadline(time.Now().Add(SocketWriteTimeout))

			encoded, err := json.Marshal(payload)
			if err != nil || !ok {
				client.Connection.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			writer, err := client.Connection.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			writer.Write(encoded)

			for i := 0; i < len(client.Data); i++ {
				data, err := json.Marshal(<-client.Data)
				if err != nil {
					return
				}

				writer.Write(data)
			}

			if err := writer.Close(); err != nil {
				return
			}
		case <-ticker.C:
			client.Connection.SetWriteDeadline(time.Now().Add(SocketWriteTimeout))
			if err := client.Connection.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (s *StateSync) RegisterReader(client *SocketClient) {
	defer func() {
		client.Core.Destroy <- client
		client.Connection.Close()
	}()

	client.Connection.SetReadLimit(SocketMaxMessageSize)
	client.Connection.SetReadDeadline(time.Now().Add(SocketPingAckTimeout))
	client.Connection.SetPongHandler(func(data string) error {
		client.Connection.SetReadDeadline(time.Now().Add(SocketPingAckTimeout))
		return nil
	})

	for {
		_, payload, err := client.Connection.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				Err(err)
			}

			break
		}

		var event SocketEvent
		if err := json.Unmarshal(payload, &event); err != nil {
			Err(err)
		}

		if s.HandleEvent(client, &event); err != nil {
			Err(err)
		}
	}
}

func (t *State) Get(name string) interface{} {
	if field, ok := (*t)[name]; ok {
		return field
	}

	return nil
}

func (t *State) GetStr(name string) string {
	if value, ok := t.Get(name).(string); ok {
		return value
	}

	return ""
}

func (t *State) Replacer(name, search, replace string, update func(State)) {
	value := t.GetStr(name)
	update(State{
		name: strings.ReplaceAll(value, search, replace),
	})
}

func (t *State) GetCompare(name string, eqTo interface{}) bool {
	return t.Get(name) == eqTo
}

func (t *State) GetContains(name string, substr string) bool {
	if value, ok := t.Get(name).(string); ok {
		return strings.Contains(value, substr)
	}

	return false
}
