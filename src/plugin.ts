import { 
    StateValueAtRoot, 
    State, 
    PluginCallbacks, 
    PluginCallbacksOnSetArgument,
    PluginCallbacksOnDestroyArgument
} 
from '@hookstate/core';

import { StateSyncPluginType } from './types';
import StateSyncClient from './sync';

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

export const StateSync = (endpoint: string): StateSyncPluginType => {
    if (!endpoint.startsWith('http://') || !endpoint.startsWith('https://')) {
        return null;
    }

    return () => ({
        id: StateSyncPluginID,
        init: (s: State<StateValueAtRoot>) => {
            const builder = new StateSyncClient(endpoint);
            const socket = builder.getSocket(s);

            return {
                onSet: (data: PluginCallbacksOnSetArgument) => {
                    builder.sendState(data);
                },
                onDestroy: (data: PluginCallbacksOnDestroyArgument) => {
                    socket.close();
                    return null;
                }
            } as PluginCallbacks;
        }
    });
};