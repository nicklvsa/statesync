import WebSocket from 'ws';
import { Socket } from 'net';
import { Express, Request } from 'express';
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

const connect = async (express: Express, usesPath: string = '/sync'): Promise<WebSocket.Server> => {
    const server = new WebSocket.Server({
        noServer: true,
        path: usesPath,
    });

    // TODO: fix this
    express.on('upgrade', (request: Request, socket: Socket, head: Buffer) => {
        server.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            server.emit('connection', ws, request);
        });
    });

    server.on('connection', (ws: WebSocket, request: Request) => {
        server.on('message', async (message: any) => {
            try {
                const parsed = JSON.parse(message) as SocketEvent;
                switch (parsed.type) {
                    case SocketEventType.Send:
                        const state = parsed.payload as State;
                        const payload: SocketEvent = {
                            type: SocketEventType.Receive,
                            message_type: MessageType.Sync,
                            payload: {state} as SyncMessage,
                        };

                        const handleCallbacks = async () => {
                            Object.entries(REGISTERD_CALLBACKS).forEach(([_, cb]) => {
                                cb(state, (s: State) => {
                                    const merged = {
                                        ...state,
                                        ...s,
                                    };

                                    const cbPayload: SocketEvent = {
                                        type: SocketEventType.Receive,
                                        message_type: MessageType.Sync,
                                        payload: {state: merged} as SyncMessage,
                                    };

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

}