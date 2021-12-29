import WebSocket from 'ws';
import { Socket, Server } from 'net';
import { Request } from 'express';
import { v4 as uuid } from 'uuid';
import {
    MessageType,
    SocketEvent,
    SocketEventType,
    State,
    StateSyncCallback,
    StateSyncCancelable,
    SyncMessage
} from './types';

const REGISTERD_CALLBACKS: Record<string, StateSyncCallback> = {};

const callback = (cb: StateSyncCallback): StateSyncCancelable => {
    const ident = uuid();
    REGISTERD_CALLBACKS[ident] = cb;

    return () => {
        if (REGISTERD_CALLBACKS[ident]) {
            delete REGISTERD_CALLBACKS[ident];
        }
    };
};

const replacer = (current: State, name: string, search: string, replace: string, update: (s: State) => void) => {
    const value = current[name] as string;
    update({
        name: value.split(search).join(replace),
    });
};

const connect = async (express: Server, usesPath: string = '/sync'): Promise<WebSocket.Server> => {
    const server = new WebSocket.Server({
        noServer: true,
        path: usesPath,
    });

    express.on('upgrade', (request: Request, socket: Socket, head: Buffer) => {
        server.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            server.emit('connection', ws, request);
        });
    });

    server.on('connection', (ws: WebSocket, request: Request) => {
        ws.on('message', async (message: any) => {
            console.log(`HANDLING PAYLOAD: ${message}`);
            try {
                const parsed = JSON.parse(message) as SocketEvent;
                switch (parsed.payload_type) {
                    case SocketEventType.Send:
                        const state = parsed.payload as State;
                        const payload: SocketEvent = {
                            payload_type: SocketEventType.Receive,
                            message_type: MessageType.Sync,
                            payload: {state} as SyncMessage,
                        };

                        const handleCallbacks = async () => {
                            Object.entries(REGISTERD_CALLBACKS).forEach(([id, cb]) => {
                                cb(state, (s: State) => {
                                    const merged = {
                                        ...state,
                                        ...s,
                                    };

                                    const cbPayload: SocketEvent = {
                                        payload_type: SocketEventType.Receive,
                                        message_type: MessageType.Sync,
                                        payload: {state: merged} as SyncMessage,
                                    };

                                    console.log(`SENDING MERGED PAYLOADD: ${JSON.stringify(cbPayload)}`);
                                    ws.send(JSON.stringify(cbPayload));
                                });
                            });
                        };

                        ws.send(JSON.stringify(payload));
                        await handleCallbacks();
                    case SocketEventType.Receive:
                        break;
                }
            } catch (err) {
                console.error(err);
            }
        });
    });

    return server;
};

export {
    connect,
    callback,
    replacer
}