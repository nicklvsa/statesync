from typing import Any, Callable, Dict, NoReturn, Optional
import enum

StateT = Dict[str, Any]

StateSyncCallback = Callable[[StateT, Callable[[StateT], NoReturn]], NoReturn]

StateSyncCancelable = Callable[[None], NoReturn]

class SocketEventType(enum.Enum):
    Connect = 'CONNECT',
    Disconnect = 'DISCONNECT',
    Receive = 'RECEIVE',
    Send = 'SEND',


class MessageType(enum.Enum):
    Sync = 'SYNC'


class State(StateT):
    def __init__(self, state: StateT): 
        self.state = state

    @classmethod
    def raw(self) -> StateT:
        return self.state

    @classmethod
    def get(self, name: str) -> Optional[Any]:
        if name in self.state:
            return self.state[name]

        return None

    @classmethod
    def get_str(self, name: str) -> Optional[str]:
        if value := self.get(name):
            return str(value)

        return None


    @classmethod
    def replacer(self, name: str, search: str, replace: str, update: Callable[[StateT], NoReturn]) -> NoReturn:
        if value := self.get_str(name):
            update({
                name: value.replace(search, replace)
            })