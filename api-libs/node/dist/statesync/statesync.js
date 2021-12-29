"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replacer = exports.callback = exports.connect = void 0;
const ws_1 = __importDefault(require("ws"));
const uuid_1 = require("uuid");
const types_1 = require("./types");
const REGISTERD_CALLBACKS = {};
const callback = (cb) => {
    const ident = (0, uuid_1.v4)();
    REGISTERD_CALLBACKS[ident] = cb;
    return () => {
        if (REGISTERD_CALLBACKS[ident]) {
            delete REGISTERD_CALLBACKS[ident];
        }
    };
};
exports.callback = callback;
const replacer = (current, name, search, replace, update) => {
    const value = current[name];
    update({
        name: value.split(search).join(replace),
    });
};
exports.replacer = replacer;
const connect = (express, usesPath = '/sync') => __awaiter(void 0, void 0, void 0, function* () {
    const server = new ws_1.default.Server({
        noServer: true,
        path: usesPath,
    });
    express.on('upgrade', (request, socket, head) => {
        server.handleUpgrade(request, socket, head, (ws) => {
            server.emit('connection', ws, request);
        });
    });
    server.on('connection', (ws, request) => {
        ws.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`HANDLING PAYLOAD: ${message}`);
            try {
                const parsed = JSON.parse(message);
                switch (parsed.payload_type) {
                    case types_1.SocketEventType.Send:
                        const state = parsed.payload;
                        const payload = {
                            payload_type: types_1.SocketEventType.Receive,
                            message_type: types_1.MessageType.Sync,
                            payload: { state },
                        };
                        const handleCallbacks = () => __awaiter(void 0, void 0, void 0, function* () {
                            Object.entries(REGISTERD_CALLBACKS).forEach(([id, cb]) => {
                                cb(state, (s) => {
                                    const merged = Object.assign(Object.assign({}, state), s);
                                    const cbPayload = {
                                        payload_type: types_1.SocketEventType.Receive,
                                        message_type: types_1.MessageType.Sync,
                                        payload: { state: merged },
                                    };
                                    console.log(`SENDING MERGED PAYLOADD: ${JSON.stringify(cbPayload)}`);
                                    ws.send(JSON.stringify(cbPayload));
                                });
                            });
                        });
                        ws.send(JSON.stringify(payload));
                        yield handleCallbacks();
                    case types_1.SocketEventType.Receive:
                        break;
                }
            }
            catch (err) {
                console.error(err);
            }
        }));
    });
    return server;
});
exports.connect = connect;
//# sourceMappingURL=statesync.js.map