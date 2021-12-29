"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const statesync_1 = require("./statesync/statesync");
const app = (0, express_1.default)();
const port = process.env.PORT || 9090;
const server = app.listen(port, () => {
    console.log(`Test server is running on port ${port}.`);
});
(0, statesync_1.callback)((current, update) => {
    (0, statesync_1.replacer)(current, 'first_name', 'hello', 'bye', update);
});
(0, statesync_1.connect)(server);
//# sourceMappingURL=test.js.map