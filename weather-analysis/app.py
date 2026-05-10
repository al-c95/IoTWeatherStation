import json
from fastapi import FastAPI
from openai import OpenAI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from fastapi.responses import StreamingResponse
from tools import call_tool
import tools


app = FastAPI()
origins = [
    "http://localhost:5173" # add ngrok origin here
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # allow these origins
    allow_credentials=True,
    allow_methods=["*"],        # allow all methods (GET, POST, etc)
    allow_headers=["*"],        # allow all headers
)

llm_client = OpenAI()

DB_PATH = "../weather.db"
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

def extract_text_from_response(response: str) -> str:
    if hasattr(response, "output_text") and response.output_text:
        return response.output_text
    
    return "No answer returned."


def round_temperatures(text: str) -> str:
    """Round all floating point numbers in the text to 1 decimal place."""
    import re
    
    def round_match(match):
        num = float(match.group(0))
        
        return f"{round(num, 1)}"
    
    # Find all floating point numbers and round them
    return re.sub(r'-?\d+\.\d+', round_match, text)


def run_weather_question(question: str) -> str:
    response = llm_client.responses.create(
        model=MODEL,
        instructions=SYSTEM_PROMPT,
        input=question,
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

            tool_outputs.append({
                "type": "function_call_output",
                "call_id": fc.call_id,
                "output": json.dumps(result),
            })

        response = llm_client.responses.create(
            model=MODEL,
            previous_response_id=response.id,
            input=tool_outputs,
            tools=tools.TOOLS,
        )

    raise RuntimeError("Too many tool-call loops")


def sse_data(text: str) -> str:
    return f"data: {json.dumps({'chunk': text})}\n\n"


async def stream_weather_question(question: str):
    try:
        # For now: run existing blocking function, then stream words.
        # Later we can replace this with true OpenAI token streaming.
        answer = await asyncio.to_thread(run_weather_question, question)

        for word in answer.split(" "):
            yield sse_data(word + " ")
            await asyncio.sleep(0.02)

        yield f"data: {json.dumps({'done': True})}\n\n"

    except Exception as e:
        yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"


@app.get("/llm/prompt")
async def stream_weather(prompt: str):
    return StreamingResponse(
        stream_weather_question(prompt),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


if __name__ == "__main__":
    # question = "What was the hottest April 10th ever?"
    # question = "Has there ever been a minimum below 0 degrees?"
    # question = "What was the latest date of a 40 degree day?"
   # question = "In a typical year, what is the average lowest minimum, highest minimum, lowest maximum, and highest maximum?"
    # question = "How would you classify this climate?"
    # question = "We can define a heatwave as when the daily maximum temperature exceeds the average maximum for that time of year by 5 degrees for at least 5 consecutive days. Let's identify all heatwaves"
    question = "For May 10, what is the average minimum and maximum temperature across all years? what is the lowest temperature and highest temperature ever recorded on that date?"
    #question = "Which calendar month (month and year) had the most unusual temperature spread?"

    print(f"\nQUESTION: {question}")
    answer = run_weather_question(question)
    print("\nFINAL ANSWER:")
    print(answer)