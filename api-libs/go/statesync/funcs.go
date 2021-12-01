package statesync

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/xid"
)

func NewStateSync() *StateSync {
	sync := StateSync{
		isInitialized: true,
		Clients:       make(map[*SocketClient]bool),
		Create:        make(chan *SocketClient),
		Destroy:       make(chan *SocketClient),
	}

	go sync.Run()
	return &sync
}

func (s *StateSync) Run() {
	for {
		select {
		case client := <-s.Create:
			s.CreateClient(client)
		case client := <-s.Destroy:
			s.DestroyClient(client)
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
		ReadBufferSize: *readSize,
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
		log.Fatalf("[ERR] - %s\n", err.Error())
	}

	s.RegisterConnection(conn)
}

func (s *StateSync) CreateClient(client *SocketClient) {
	s.Clients[client] = true

	event := SocketEvent{
		Type: SocketEventTypeConnect,
		Payload: nil,
	}

	if err := s.HandleEvent(client, &event); err != nil {
		fmt.Printf("[ERR] - %s\n", err.Error())
	}
}

func (s *StateSync) RegisterRoute(endpoint, method string, handler http.HandlerFunc) (string, string, http.HandlerFunc) {
	REGISTERED_ROUTES[endpoint] = HTTPDefintion{
		Method: method,
		Handler: handler,
		Route: endpoint,
	}

	return endpoint, method, handler
}

func (s *StateSync) RegisterCallback(callback StateSyncCallback) func() {
	ident := xid.New().String()
	REGISTERED_CALLBACKS[ident] = callback

	return func() {
		delete(REGISTERED_CALLBACKS, ident)
	}
}

func (s *StateSync) BroadcastAll(current *SocketClient, payload *SocketEvent) error {
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

	client.Data <- *payload

	return nil
}

func (s *StateSync) HandleEvent(client *SocketClient, payload *SocketEvent) error {
	fmt.Printf("Handling Event: %+v\n", *payload)
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
				Type: SocketEventTypeReceive,
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
						merged := MergeStates(message, state)
	
						payload := SocketEvent{
							Type: SocketEventTypeReceive,
							MessageType: MessageTypeSync,
							Payload: &SyncMessage{
								State: &merged,
							},
						}
	
						s.Emit(client, &payload)
					})
				}
			}()

			case MessageTypeHTTP:
				endpoint := message.Get("endpoint").(string)
				method := message.Get("method").(string)

				payload := SocketEvent{
					Type: SocketEventTypeReceive,
					MessageType: MessageTypeHTTP,
				}

				if handler, ok := REGISTERED_ROUTES[endpoint]; ok {
					if strings.EqualFold(method, handler.Method) {
						handler.Handler(BuildHTTPRequest(func(data map[string]interface{}) {
							payload.Payload = &HTTPResponseMessage{}
						}))
					}
				}

				if err := s.Emit(client, &payload); err != nil {	
					return err
				}
		}
	}

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
			Core: s,
			Connection: conn,
			Data: make(chan SocketEvent),
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
				fmt.Printf("[ERR] - %s\n", err.Error())
			}

			break
		}

		var event SocketEvent
		if err := json.Unmarshal(payload, &event); err != nil {
			fmt.Printf("[ERR] - %s\n", err.Error())
		}

		if s.HandleEvent(client, &event); err != nil {
			fmt.Printf("[ERR] - %s\n", err.Error())
		}
	}
}

func (t *State) Get(name string) interface{} {
	if field, ok := (*t)[name]; ok {
		return field
	}

	return []string{}
}

func (t *State) GetCompare(name string, eqTo interface{}) bool {
	return t.Get(name) == eqTo
}