import { 
    StateValueAtRoot, 
    State, 
    PluginCallbacks, 
    PluginCallbacksOnSetArgument,
    PluginCallbacksOnDestroyArgument
} 
from '@hookstate/core';

import { DATASYNC_API_MAGIC_KEY, 
    HTTPType, 
    InternalPubSubEvent, 
    MessageType, 
    Nullable, 
    StateSyncConfig, 
    StateSyncPluginType 
} from './types';
import StateSyncClient from './sync';
import { PubSub } from './pubsub';
import { v4 as uuidv4 } from 'uuid';

/**
 * State Sync Plugin
 * 
 * The state sync plugin that automatically managage the state within the browser
 * and your api. Using a websocket connection, the state will, in real time, sync
 * with the server. Making api calls is is a little different. This plugin will
 * be able to send a restful api call over the same websocket connection, which
 * can then be transformed on the server side and processed as a resful call.
 */

const StateSyncPluginID = Symbol('StateSyncPlugin');
const pubsub = new PubSub<InternalPubSubEvent>();

export const StateSync = (endpoint: string, config?: Nullable<StateSyncConfig>): 
    StateSyncPluginType<InternalPubSubEvent> => {
    const builder = new StateSyncClient(endpoint, pubsub);

    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
        return null;
    }

    if (config) {
        // do some configuration stuff
    }

    return {
        plugin:  () => ({
            id: StateSyncPluginID,
            init: (s: State<StateValueAtRoot>) => {
                const socket = builder.getSocket(s);

                return {
                    onSet: (data: PluginCallbacksOnSetArgument) => {
                        if (!data.state[DATASYNC_API_MAGIC_KEY]) {
                            data.state[DATASYNC_API_MAGIC_KEY] = false;
                            data.value[DATASYNC_API_MAGIC_KEY] = false;
                            builder.sendState(data);
                        }
                    },
                    onDestroy: (data: PluginCallbacksOnDestroyArgument) => {
                        socket.close();
                    },
                } as PluginCallbacks;
            }
        }),
        pubsub: pubsub,
        wrap: (data: any) => {
            return {
                ...data,
                [DATASYNC_API_MAGIC_KEY]: false,
            }
        },
        sendHTTP: (httpType: HTTPType, location: string, data?: any, cb?: (data: any) => void) => {
            const reqID = uuidv4();

            const subscription = pubsub.sub(event => {   
                if (event.message_type === MessageType.HTTP) {
                    if (cb && event.data?.request_id === reqID) {
                        cb(event.data);
                    }
                }

                subscription.unsub();
            });

            builder.sendHTTP(httpType, location, data, reqID);
        },
    }
};