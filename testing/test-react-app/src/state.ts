import { createState } from '@hookstate/core';
import { StateSync } from './syncstate-src/index';

const globalState = createState({
	first_name: '',
	last_name: '',
});

const stateSync = StateSync('http://localhost:8080');
if (!stateSync) {
	throw new Error('StateSync is not defined');
}

globalState.attach(stateSync.plugin);

export {
    stateSync,
    globalState
}
