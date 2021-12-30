from typing import Any, Dict, NoReturn
import uuid

from statesynclib.types import StateSyncCallback, StateSyncCancelable


REGISTERED_CALLBACKS: Dict[str, Any] = dict()

def callback(cb: StateSyncCallback) -> StateSyncCancelable:
    ident = str(uuid.uuid4())
    REGISTERED_CALLBACKS[ident] = cb

    def cancel() -> NoReturn:
        if ident in REGISTERED_CALLBACKS:
            del REGISTERED_CALLBACKS[ident]

    return cancel


def connect(): pass