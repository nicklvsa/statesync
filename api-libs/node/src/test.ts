import express from 'express';
import {
    connect,
    callback,
} from './statesync/statesync';
import { State } from './statesync/types';

const port = process.env.PORT || 9090;
const app = express();

const server = app.listen(port, () => {
    console.log(`Test server is running on port ${port}.`);
});

callback((current: State, update: (s: State) => void) => {
    current.replacer('first_name', 'hello', 'bye', update);
});

callback((current: State, update: (s: State) => void) => {
    current.replacer('first_name', 'hello', 'bye', update);
});

connect(server);