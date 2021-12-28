export enum SocketEventType {
    Connect = 'CONNECT',
    Disconnect = 'DISCONNECT',
    Receive = 'RECEIVE',
    Send = 'SEND',
};

export enum MessageType {
    Sync = 'SYNC',
};

export interface SocketEvent {
    type: SocketEventType;
    message_type: MessageType;
    payload: any;
};

export interface SyncMessage {
    state: State;
}

export type State = Record<string, any>;

export type StateSyncCancelable = () => void;

export type StateSyncCallback = (s: State, update: (s: State) => void) => void;