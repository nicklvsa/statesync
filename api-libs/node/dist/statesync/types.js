"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = exports.SocketEventType = void 0;
var SocketEventType;
(function (SocketEventType) {
    SocketEventType["Connect"] = "CONNECT";
    SocketEventType["Disconnect"] = "DISCONNECT";
    SocketEventType["Receive"] = "RECEIVE";
    SocketEventType["Send"] = "SEND";
})(SocketEventType = exports.SocketEventType || (exports.SocketEventType = {}));
;
var MessageType;
(function (MessageType) {
    MessageType["Sync"] = "SYNC";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
;
;
//# sourceMappingURL=types.js.map