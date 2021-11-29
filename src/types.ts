import { Plugin } from '@hookstate/core';
import { PubSub } from './pubsub';

export type Nullable<T> = T | null;

export type StateSyncPluginType<T> = Nullable<{
    plugin: (() => Plugin),
    pubsub: PubSub<T>,
}>;

export interface ReceiveSyncEvent {
    state: object;
}

export interface StateSyncClientConfig {
    buffer_size?: number;
    backoff_factor: {
        initial?: number;
        increment?: number;
        max?: number;
    };
    custom_socket_endpoint?: string;
}

export interface StateSyncConfig {}

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
    SYNC = 'SYNC',
    HTTP = 'HTTP'
}

export enum HTTPType {
    POST = 'POST',
    PUT = 'PUT',
    GET = 'GET',
    DELETE = 'DELETE',
}