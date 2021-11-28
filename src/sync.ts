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
    MessageType
} from './types';

class StateSyncClient {
    private endpoint!: string;
    private builder!: WebsocketBuilder;
    private socket!: ServiceSocket;

    constructor(endpoint: string) {
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
        const socket = this.builder
            .onOpen((instance: ServiceSocket, evt: Event) => {
                
            })
            .onMessage((instance: ServiceSocket, evt: MessageEvent) => {
                const message: SocketEvent<ReceiveSyncEvent> = JSON.parse(evt.data ?? {});
                if (message.message_type === MessageType.SYNC) {
                    state.set({
                        ...this.stateDataValidator(state, message.data.state),
                    });   
                }
            })
            .onError((instance: ServiceSocket, evt: Event) => {
                return null;
            })
            .onClose((instance: ServiceSocket, evt: CloseEvent) => {
                return null;
            })
            .withBuffer(new LRUBuffer(10000))
            .withBackoff(new LinearBackoff(0, 1000, 10000))
            .build();

        this.socket = socket;
    }

    public sendState(currentState: PluginCallbacksOnSetArgument) {
        if ('state' in currentState) {
            this.socket.send(this.createSocketMessage(SocketType.SEND, currentState));
        }

        return this.getServerState();
    }

    private createSocketMessage(msgType: SocketType, data: object): string {
        return JSON.stringify({
            message_type: msgType,
            data: {
                ...data,
            }
        });
    }

    private stateDataValidator(state: State<StateValueAtRoot>, serverState: object): object {
        const clientState = state.get();

        Object.keys(serverState).forEach(serverKey => {
            Object.keys(clientState).forEach(clientKey => {
                if (serverKey.toLowerCase() === 'updated_at' && clientKey.toLowerCase() === 'updated_at') {
                    const serverDate = new Date(serverState[serverKey]);
                    const clientDate = new Date(clientState[clientKey]);

                    if (serverDate.getTime() > clientDate.getTime()) {
                        return serverState;
                    }

                    return clientState;
                }
            });
        });

        return clientState;
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
        return `${schema}${this.endpoint.split('://')[1]}/sync`;
    }
}

export default StateSyncClient;