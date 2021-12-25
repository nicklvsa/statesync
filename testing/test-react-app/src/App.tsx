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

const wrap = stateSync.wrap;
globalState.attach(stateSync.plugin);

const App = () => {
	const compState = useState(globalState);

	const firstNameUpdated = (evt: ChangeEvent<HTMLInputElement>) => {
		compState.set(s => wrap({...s, first_name: evt.target.value}));
	};

	const lastNameUpdated = (evt: ChangeEvent<HTMLInputElement>) => {
		compState.set(s => wrap({...s, last_name: evt.target.value}));
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
			<input 
				value={compState.get().first_name} 
				className="text-field" type="text" 
				placeholder="First Name" 
				onChange={firstNameUpdated}
			/><br/>
			<input 
				value={compState.get().last_name} 
				className="text-field" 
				type="text" 
				placeholder="Last Name" 
				onChange={lastNameUpdated}
			/><br/><br/>
		</div>
	)
};

export default App;
