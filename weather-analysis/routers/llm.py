from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from models.chat import ChatMessage, ChatRequest
from services.streaming import stream_weather_chat


router = APIRouter(prefix="/llm", tags=["llm"])


@router.post("/chat")
async def stream_weather_chat_endpoint(payload: ChatRequest):
    return StreamingResponse(
        stream_weather_chat(payload.messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get("/prompt")
async def stream_weather_prompt(prompt: str):
    messages = [
        ChatMessage(role="user", content=prompt),
    ]

    return StreamingResponse(
        stream_weather_chat(messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )