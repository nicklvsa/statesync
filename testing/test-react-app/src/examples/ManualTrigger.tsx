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
            <button onClick={triggerState}>Trigger state</button>
        </div>
    )
};

export default ManualTriggerComp;