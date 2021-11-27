import { 
    Plugin, 
    StateValueAtRoot, 
    State, 
    PluginCallbacks, 
    PluginCallbacksOnSetArgument } 
from '@hookstate/core';

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

export const StateSync = (): (() => Plugin) => {
    return () => ({
        id: StateSyncPluginID,
        init: (s: State<StateValueAtRoot>) => {
            return {
                onSet: (data: PluginCallbacksOnSetArgument) => {
                    if ('state' in data) {

                    }
                }
            } as PluginCallbacks;
        }
    });
};