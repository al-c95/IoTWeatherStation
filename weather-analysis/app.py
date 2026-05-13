import asyncio
import json
import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel

import tools
from tools import call_tool


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_client = OpenAI()

MODEL = "gpt-5.4-mini"

SYSTEM_PROMPT = """
You are a weather archive assistant for a personal weather station.

You MUST use the provided tools to answer any question that requires data.
You MUST NOT write SQL as part of your final answer.
You MUST execute queries using the run_sql_readonly tool instead of describing them.

Before giving a final answer, sanity-check whether the result is physically plausible.
If a result is clearly implausible or indicates broken grouping/aggregation logic, revise the query and try again.
Never ask the user to run the query for you.
All temperatures are in degrees Celsius, and all dates are in the format YYYY-MM-DD.
Temperature values should be rounded to nearest 0.1, and dates should be formatted as YYYY-MM-DD in your final answer.

If a question requires data:
1. Inspect schema if needed
2. Call run_sql_readonly with the SQL
3. Use the returned results to answer

Never ask the user to run a query.
Never provide SQL as the final answer unless explicitly asked for SQL.

Be concise and directly answer the question using the tool results.
"""


def extract_text_from_response(response) -> str:
    if hasattr(response, "output_text") and response.output_text:
        return response.output_text

    return "No answer returned."


def round_temperatures(text: str) -> str:
    def round_match(match):
        num = float(match.group(0))
        return f"{round(num, 1)}"

    return re.sub(r"-?\d+\.\d+", round_match, text)


def run_weather_chat(messages: list[ChatMessage]) -> str:
    input_messages = [
        {
            "role": message.role,
            "content": message.content,
        }
        for message in messages
    ]

    response = llm_client.responses.create(
        model=MODEL,
        instructions=SYSTEM_PROMPT,
        input=input_messages,
        tools=tools.TOOLS,
    )

    max_loops = 8
    loop_count = 0

    while loop_count < max_loops:
        loop_count += 1

        function_calls = [
            item for item in response.output
            if getattr(item, "type", None) == "function_call"
        ]

        if not function_calls:
            answer = extract_text_from_response(response)
            return round_temperatures(answer)

        tool_outputs = []

        for fc in function_calls:
            try:
                args = json.loads(fc.arguments) if fc.arguments else {}
                result = call_tool(fc.name, args)
            except Exception as e:
                result = {"error": str(e)}

            tool_outputs.append(
                {
                    "type": "function_call_output",
                    "call_id": fc.call_id,
                    "output": json.dumps(result),
                }
            )

        response = llm_client.responses.create(
            model=MODEL,
            previous_response_id=response.id,
            input=tool_outputs,
            tools=tools.TOOLS,
        )

    raise RuntimeError("Too many tool-call loops")


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


@app.post("/llm/chat")
async def stream_weather_chat_endpoint(payload: ChatRequest):
    return StreamingResponse(
        stream_weather_chat(payload.messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@app.get("/llm/prompt")
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