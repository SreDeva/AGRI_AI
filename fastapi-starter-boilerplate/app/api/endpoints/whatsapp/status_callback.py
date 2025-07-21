from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse

# Create the router
starus_module = APIRouter()

# POST endpoint to receive incoming messages
@starus_module.post("/status_callback")
async def message_status(request: Request):
    form = await request.form()
    print("Status callback received:", dict(form))
    # You could log to DB or process the status here
    return PlainTextResponse("OK")
