import express from 'express';
import { exit } from 'process';
import {
    connect,
    callback,
    replacer
} from './statesync/statesync';
import { State } from './statesync/types';

const app = express();
const port = process.env.PORT || 9090;

const server = app.listen(port, () => {
    console.log(`Test server is running on port ${port}.`);
});

callback((current: State, update: (s: State) => void) => {
    replacer(current, 'first_name', 'hello', 'bye', update);
});

connect(server);