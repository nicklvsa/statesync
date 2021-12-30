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
    StateT,
    SyncMessage
} from './types';

const REGISTERED_CALLBACKS: Record<string, StateSyncCallback> = {};

const callback = (cb: StateSyncCallback): StateSyncCancelable => {
    const ident = uuid();
    REGISTERED_CALLBACKS[ident] = cb;

    return () => {
        if (REGISTERED_CALLBACKS[ident]) {
            delete REGISTERED_CALLBACKS[ident];
        }
    };
};

const connect = async (httpServer: Server, usesPath: string = '/sync'): Promise<WebSocket.Server> => {
    const server = new WebSocket.Server({
        noServer: true,
        path: usesPath,
    });

    httpServer.on('upgrade', (request: Request, socket: Socket, head: Buffer) => {
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
                        const state = new State(parsed.payload as StateT);

                        const payload: SocketEvent = {
                            payload_type: SocketEventType.Receive,
                            message_type: MessageType.Sync,
                            payload: {
                                state: state.raw(),
                            } as SyncMessage,
                        };

                        const handleCallbacks = async () => {
                            Object.entries(REGISTERED_CALLBACKS).forEach(([id, cb]) => {
                                cb(state, (s: State) => {
                                    const merged = {
                                        ...state.raw(),
                                        ...(s instanceof State ? s.raw() : s),
                                    };

                                    const cbPayload: SocketEvent = {
                                        payload_type: SocketEventType.Receive,
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
    callback,
}