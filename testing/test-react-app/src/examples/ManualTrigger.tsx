import { useState } from '@hookstate/core';

import { 
	globalState, 
	stateSync as sync
} from '../state';


const ManualTriggerComp = () => {
    const localState = useState(globalState);

    const triggerState = () => {
		sync?.trigger(localState.get());
	};

    return (
        <div>
            <h4>Status: {localState.get().status}</h4><br/>
            <button onClick={triggerState}>Trigger state</button>
        </div>
    )
};

export default ManualTriggerComp;