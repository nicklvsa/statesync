import './App.css';
import { createState, useState } from '@hookstate/core';
import { ChangeEvent } from 'react';
import { StateSync } from './syncstate-src/index';

const globalState = createState({
	first_name: '',
	last_name: '',
});

const stateSync = StateSync('http://localhost:8080');
if (!stateSync) {
	throw new Error('StateSync is not defined');
}

globalState.attach(stateSync);

const App = () => {
	const compState = useState(globalState);

	const firstNameUpdated = (evt: ChangeEvent<HTMLInputElement>) => {
		compState.set(state => ({...state, first_name: evt.target.value}));
	};

	const lastNameUpdated = (evt: ChangeEvent<HTMLInputElement>) => {
		compState.set(state => ({...state, last_name: evt.target.value}));
	};

	return (
		<div className="mid-centered">
			<div>
				{
					compState.get().first_name.length > 0 || compState.get().last_name.length > 0 ? (
						<h3>Hello, {compState.get().first_name} {compState.get().last_name}</h3>
					) : (
						<h3>Hello, World</h3>
					)
				}
			</div>
			<h1>Test App</h1>
			<input className="text-field" type="text" placeholder="First Name" onChange={firstNameUpdated}/><br/>
			<input className="text-field" type="text" placeholder="Last Name" onChange={lastNameUpdated}/>
		</div>
	)
};

export default App;
