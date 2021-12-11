import { Plugin } from '@hookstate/core';
import { PubSub } from './pubsub';

export const DATASYNC_API_MAGIC_KEY = `__datasync_api_response`;

export type Nullable<T> = T | null;

export type StateSyncPluginType<T> = Nullable<{
    plugin: () => Plugin,
    wrap: (data: any) => any,
    sendHTTP: (httpType: HTTPType, location: string, data: any, cb: (data: any) => void) => void,
    pubsub: PubSub<T>,
}>;

export interface ReceiveEvent {
    state: Record<string, any>;
}

export enum InternalPubSubEventType {
    INTERNAL_STATE_UPDATE = 'INTERNAL_STATE_UPDATE',
    GENERIC_UPDATE = 'GENERIC_UPDATE',
}

export interface InternalPubSubEvent {
    type: InternalPubSubEventType;
    message_type?: MessageType;
    message: string;
    data?: any;
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
    payload_type: SocketType,
    message_type: MessageType,
    payload: T;
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