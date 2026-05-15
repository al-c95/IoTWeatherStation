import json
import re

from openai import OpenAI

import tools
from models.chat import ChatMessage
from services.prompt_service import build_system_prompt
from tools import call_tool


MODEL = "gpt-5.4-mini"

llm_client = OpenAI()


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
        instructions=build_system_prompt(),
        input=input_messages,
        tools=tools.TOOLS,
    )

    max_loops = 8

    for _ in range(max_loops):
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