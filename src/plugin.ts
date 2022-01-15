import { 
    StateValueAtRoot, 
    State, 
    PluginCallbacks, 
    PluginCallbacksOnSetArgument,
    StateValueAtPath,
} 
from '@hookstate/core';

import { 
    DATASYNC_API_MAGIC_KEY, 
    InternalPubSubEvent, 
    Nullable, 
    StateSyncConfig, 
    StateSyncPluginType 
} from './types';
import StateSyncClient from './sync';
import { PubSub } from './pubsub';

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
                            builder.sendState(data?.state);
                        }
                    },
                    onDestroy: () => {
                        socket.close();
                    },
                } as PluginCallbacks;
            }
        }),
        trigger: (data: any) => {
            builder.sendState(data);
        },
        wrap: (data: any) => {
            return {
                ...data,
                [DATASYNC_API_MAGIC_KEY]: false,
            }
        },
        pubsub: pubsub,
    }
};