import { Plugin } from '@hookstate/core';

export type StateSyncPluginType = (() => Plugin) | null;
export type Nullable<T> = T | null;

export interface ReceiveSyncEvent {
    state: object;
}

export interface SocketEvent<T> {
    transfer_type: SocketType,
    message_type: MessageType,
    data: T;
}

export enum SocketType {
    SEND = 'SEND',
    RECEIVE = 'RECEIVE',
}

export enum MessageType {
    SYNC = 'SYNC'
}

export enum HTTPType {
    POST = 'POST',
    PUT = 'PUT',
    GET = 'GET',
    DELETE = 'DELETE',
}