import { WebsocketBuilder, Websocket as ServiceSocket, LRUBuffer, LinearBackoff } from 'websocket-ts';
import { 
    State,
    StateValueAtRoot,
    PluginCallbacksOnSetArgument 
} 
from '@hookstate/core';

import { 
    SocketType, 
    SocketEvent, 
    ReceiveSyncEvent, 
    HTTPType, 
    MessageType,
    Nullable,
    StateSyncClientConfig,
    DATASYNC_API_MAGIC_KEY,
    InternalPubSubEvent,
    InternalPubSubEventType
} from './types';
import { PubSub } from './pubsub';

class StateSyncClient {
    private pubsub: PubSub<InternalPubSubEvent>;
    private endpoint: string;
    private builder: WebsocketBuilder;
    private socket!: ServiceSocket;
    private config!: StateSyncClientConfig;

    constructor(endpoint: string, pubsub: PubSub<InternalPubSubEvent>, config?: Nullable<StateSyncClientConfig>) {
        if (config) {
            this.config = config;
        }

        this.pubsub = pubsub;
        this.endpoint = endpoint;
        this.builder = new WebsocketBuilder(this.buildWSURL());
    }

    public getSocket(state: State<StateValueAtRoot>): ServiceSocket {
        if (!this.socket) {
            this.setupSync(state);
        }

        return this.socket;
    }

    public setupSync(state: State<StateValueAtRoot>) {
        let socket!: ServiceSocket;
        const handlers = this.builder
            .onOpen(() => {
                this.pubsub.pub({
                    type: InternalPubSubEventType.GENERIC_UPDATE,
                    message: 'connection opened',
                });
            })
            .onMessage((instance: ServiceSocket, evt: MessageEvent) => {
                const message: SocketEvent<ReceiveSyncEvent> = JSON.parse(evt.data ?? {});
                switch (message.message_type) {
                    case MessageType.SYNC:
                        this.pubsub.pub({
                            type: InternalPubSubEventType.GENERIC_UPDATE,
                            message: 'sync response',
                            data: message.payload,
                        });
                        
                        this.handleStateChange(state, message.payload.state);

                        break;
                    case MessageType.HTTP:
                        this.pubsub.pub({
                            type: InternalPubSubEventType.GENERIC_UPDATE,
                            message: 'http response',
                            data: message.payload,
                        });
                        break;
                    default:
                        break;
                }
            })
            .onError((instance: ServiceSocket, evt: Event) => {
                return null;
            })
            .onClose((instance: ServiceSocket, evt: CloseEvent) => {
                return null;
            });
            
        if (this.config) {
            const {initial, increment, max} = this.config.backoff_factor;
            const backoff = new LinearBackoff(initial ?? 0, increment ?? 1000, max ?? 10000);
            socket = handlers
                .withBuffer(new LRUBuffer(this.config.buffer_size ?? 10000))
                .withBackoff(backoff)
                .build();
        } else {
            socket = handlers.build();
        }

        this.socket = socket;
    }

    public sendState(currentState: PluginCallbacksOnSetArgument) {
        if ('state' in currentState) {
            this.socket.send(this.createSocketMessage(SocketType.SEND, currentState.state));
        }

        return this.getServerState();
    }

    public handleStateChange(currentState: State<StateValueAtRoot>, serverState: Record<string, any>) {
        if (currentState && serverState) {
            const updatedState: Record<string, any> = {
                ...serverState,
                [DATASYNC_API_MAGIC_KEY]: true,
            };

            currentState.merge(updatedState);
        }
    }

    private createSocketMessage(socketType: SocketType, data: object): string {
        return JSON.stringify({
            payload_type: socketType,
            message_type: MessageType.SYNC,
            payload: {
                ...data,
            }
        });
    }

    public sendHTTP(httpType: HTTPType, data: object) {
        const headers = {
            'Content-Type': 'application/json',
        };

        const payload = this.createSocketMessage(SocketType.SEND, {
            http_over_websocket: true,
            method: httpType,
            headers: headers,
            body: data,
        });

        // TODO: figure out way to receive response from websocket stream directly after calling send
        this.socket.send(payload);
    }

    public getServerState(): object {
       return JSON.parse('{}');
    }
 
    private buildWSURL(): string {
        const schema = this.endpoint.startsWith('https://') ? 'wss://' : 'ws://';
        let url = `${schema}${this.endpoint.split('://')[1]}`;

        if (this.config?.custom_socket_endpoint) {
            const endpoint = this.config?.custom_socket_endpoint.startsWith('/') 
                ? this.config?.custom_socket_endpoint.slice(1) 
                : this.config?.custom_socket_endpoint;

            url = `${url}/${endpoint}`;
        } else {
            url = `${url}/sync`;
        }

        return url;
    }
}

export default StateSyncClient;