from statesynclib.statesync import connect
from sanic import Sanic, Request, response

app = Sanic("test_server")

try:
    connect(app)
except Exception as e:
    raise e

@app.get("/")
async def root(request: Request):
    return response.json({
        "message": "Hello World!"
    })
