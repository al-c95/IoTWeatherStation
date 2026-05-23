import json
import pytest
from models.chat import ChatMessage
import services.streaming as streaming


def test_sse_data_formats_payload():
    # arrange/act
    result = streaming.sse_data({"chunk": "hello"})
    
    # assert
    assert result == 'data: {"chunk": "hello"}\n\n'


@pytest.mark.asyncio
async def test_stream_weather_chat_streams_words_and_done(monkeypatch):
    monkeypatch.setattr(
        streaming,
        "run_weather_chat",
        lambda messages: "Hello world",
    )

    monkeypatch.setattr(
        streaming.asyncio,
        "sleep",
        lambda seconds: _noop_async(),
    )

    messages = [ChatMessage(role="user", content="test")]

    events = []

    async for event in streaming.stream_weather_chat(messages):
        events.append(event)

    assert events == [
        'data: {"chunk": "Hello "}\n\n',
        'data: {"chunk": "world "}\n\n',
        'data: {"done": true}\n\n',
    ]


@pytest.mark.asyncio
async def test_stream_weather_chat_streams_error(monkeypatch):
    def fake_run_weather_chat(messages):
        raise RuntimeError("boom")

    monkeypatch.setattr(streaming, "run_weather_chat", fake_run_weather_chat)

    messages = [ChatMessage(role="user", content="test")]

    events = []

    async for event in streaming.stream_weather_chat(messages):
        events.append(event)

    assert len(events) == 1
    assert events[0].startswith("event: error\n")

    data_line = events[0].split("\n")[1]
    payload = json.loads(data_line.replace("data: ", ""))

    assert payload == {"error": "boom"}


async def _noop_async():
    return None