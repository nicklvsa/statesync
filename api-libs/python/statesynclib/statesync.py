from typing import Any, Dict, NoReturn
from starlette.types import Receive, Scope, Send
from starlette.websockets import WebSocket
import websockets
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


def handle_events(data: Any):
    print(data)


async def connect(scope: Scope, receive: Receive, send: Send):
    socket = WebSocket(scope, receive, send)
    await socket.accept()
    
    handle_events(await socket.receive_json())