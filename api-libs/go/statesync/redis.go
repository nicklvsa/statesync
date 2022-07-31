package statesync

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/go-redis/redis/v8"
	"github.com/rs/xid"
)

type StateSyncRedisClient struct {
	Context context.Context
	Client  *redis.ClusterClient
	ID      string
}

type RedisClientPayload struct {
	ID   string       `json:"id"`
	Data *SocketEvent `json:"event"`
}

func NewRedisClient(ctx *context.Context, host string) *StateSyncRedisClient {
	availPorts := []int{7000, 7001, 7002, 7003, 7004, 7005}

	if ctx == nil {
		newCtx := context.Background()
		ctx = &newCtx
	}

	var hosts []string
	for _, port := range availPorts {
		hosts = append(hosts, fmt.Sprintf("%s:%d", host, port))
	}

	rdb := redis.NewClusterClient(&redis.ClusterOptions{
		Addrs:      hosts,
		MaxRetries: 5,
	})

	// ensure the ping is successful
	if _, err := rdb.Ping(*ctx).Result(); err != nil {
		Fatal(err.Error())
	}

	return &StateSyncRedisClient{
		ID:      xid.New().String(),
		Context: *ctx,
		Client:  rdb,
	}
}

func (c StateSyncRedisClient) Publish(name string, payload *RedisClientPayload) error {
	if c.Client == nil {
		return errors.New("client must be initialized before publishing")
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	if _, err := c.Client.Publish(c.Context, name, string(data)).Result(); err != nil {
		return err
	}

	return nil
}

func (c StateSyncRedisClient) Subscribe(name string) (*redis.PubSub, error) {
	if c.Client == nil {
		return nil, errors.New("client must be initialized before subscribing")
	}

	return c.Client.Subscribe(c.Context, name), nil
}
