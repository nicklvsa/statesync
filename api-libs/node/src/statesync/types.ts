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
    payload_type: SocketEventType;
    message_type: MessageType;
    payload: any;
};

export interface SyncMessage {
    state: State;
}

export type Nullable<T> = T | null;

export type StateT = Record<string, any>;

export type StateSyncCancelable = () => void;

export type StateSyncCallback = (s: State, update: (s: State) => void) => void;

export class State implements StateT {
    constructor(public state: StateT) {
        this.state = state;
    }

    raw(): StateT {
        return this.state;
    }

    get(name: string): Nullable<any> {
        if (this.state[name]) {
            return this.state[name];
        }

        return null;
    }

    getStr(name: string): string {
        if (this.get(name)) return this.get(name) as string;
        return '';
    }

    replacer(name: string, search: string, replace: string, update: (s: StateT) => void): void {
        const value = this.getStr(name);
        update({
            [name]: value.split(search).join(replace),
        });
    }
}