import { Plugin } from '@hookstate/core';

export type StateSyncPluginType = (() => Plugin) | null;

export interface ReceiveSyncEvent {
    previous_value: string;
    updated_value: string;
}

export interface SocketEvent<T> {
    message_type: SocketType,
    data: T;
}

export enum SocketType {
    SEND = 'SEND',
    RECEIVE = 'RECEIVE',
}

export enum HTTPType {
    POST = 'POST',
    PUT = 'PUT',
    GET = 'GET',
    DELETE = 'DELETE',
}