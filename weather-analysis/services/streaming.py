import asyncio
import json

from models.chat import ChatMessage
from services.llm_service import run_weather_chat


def sse_data(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def stream_weather_chat(messages: list[ChatMessage]):
    try:
        answer = await asyncio.to_thread(run_weather_chat, messages)

        for word in answer.split(" "):
            yield sse_data({"chunk": word + " "})
            await asyncio.sleep(0.02)

        yield sse_data({"done": True})

    except Exception as e:
        yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"