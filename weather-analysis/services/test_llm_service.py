from types import SimpleNamespace
import pytest
from models.chat import ChatMessage
import services.llm_service as llm_service


def test_extract_text_from_response_returns_output_text():
    # arrange
    response = SimpleNamespace(output_text="Hello")

    # act/assert
    assert llm_service.extract_text_from_response(response) == "Hello"


def test_extract_text_from_response_returns_fallback():
    # arrange
    response = SimpleNamespace()

    # act/assert
    assert llm_service.extract_text_from_response(response) == "No answer returned."


def test_round_temperatures_rounds_floats():
    # arrange
    result = llm_service.round_temperatures("The max was 28.24 and min was 9.96.")

    # act/assert
    assert result == "The max was 28.2 and min was 10.0."


def test_run_weather_chat_without_tool_calls(monkeypatch):
    # arrange
    fake_response = SimpleNamespace(
        output=[],
        output_text="The hottest day was 28.24°C.",
    )
    def fake_create(**kwargs):
        return fake_response
    monkeypatch.setattr(llm_service.llm_client.responses, "create", fake_create)
    monkeypatch.setattr(llm_service, "build_system_prompt", lambda: "system prompt")
    messages = [
        ChatMessage(role="user", content="What was the hottest April 10th?")
    ]

    # act
    result = llm_service.run_weather_chat(messages)

    # assert
    assert result == "The hottest day was 28.2°C."


def test_run_weather_chat_executes_tool_call(monkeypatch):
    first_response = SimpleNamespace(
        id="response-1",
        output=[
            SimpleNamespace(
                type="function_call",
                name="get_schema",
                arguments="{}",
                call_id="call-1",
            )
        ],
    )

    second_response = SimpleNamespace(
        id="response-2",
        output=[],
        output_text="Schema inspected.",
    )

    calls = []

    def fake_create(**kwargs):
        calls.append(kwargs)

        if len(calls) == 1:
            return first_response

        return second_response
    
    def fake_call_tool(name, args):
        assert name == "get_schema"
        assert args == {}

        return {
            "tables": [
                {
                    "name": "daily_weather",
                    "sql": "CREATE TABLE daily_weather (...)",
                }
            ]
        }

    monkeypatch.setattr(llm_service.llm_client.responses, "create", fake_create)
    monkeypatch.setattr(llm_service, "build_system_prompt", lambda: "system prompt")
    monkeypatch.setattr(llm_service, "call_tool", fake_call_tool)

    messages = [
        ChatMessage(role="user", content="What tables exist?")
    ]

    result = llm_service.run_weather_chat(messages)

    assert result == "Schema inspected."
    assert len(calls) == 2

    second_call = calls[1]

    assert second_call["previous_response_id"] == "response-1"
    assert second_call["input"][0]["type"] == "function_call_output"
    assert second_call["input"][0]["call_id"] == "call-1"


def test_run_weather_chat_returns_tool_error_to_model(monkeypatch):
    first_response = SimpleNamespace(
        id="response-1",
        output=[
            SimpleNamespace(
                type="function_call",
                name="bad_tool",
                arguments="{}",
                call_id="call-1",
            )
        ],
    )

    second_response = SimpleNamespace(
        id="response-2",
        output=[],
        output_text="Handled tool error.",
    )

    calls = []

    def fake_create(**kwargs):
        calls.append(kwargs)

        if len(calls) == 1:
            return first_response

        return second_response

    def fake_call_tool(name, args):
        raise ValueError("Unknown tool")

    monkeypatch.setattr(llm_service.llm_client.responses, "create", fake_create)
    monkeypatch.setattr(llm_service, "build_system_prompt", lambda: "system prompt")
    monkeypatch.setattr(llm_service, "call_tool", fake_call_tool)

    result = llm_service.run_weather_chat([
        ChatMessage(role="user", content="Use a bad tool")
    ])

    assert result == "Handled tool error."

    tool_output = calls[1]["input"][0]["output"]

    assert "Unknown tool" in tool_output


def test_run_weather_chat_raises_after_too_many_tool_loops(monkeypatch):
    tool_call_response = SimpleNamespace(
        id="response-loop",
        output=[
            SimpleNamespace(
                type="function_call",
                name="get_schema",
                arguments="{}",
                call_id="call-loop",
            )
        ],
    )

    monkeypatch.setattr(
        llm_service.llm_client.responses,
        "create",
        lambda **kwargs: tool_call_response,
    )
    monkeypatch.setattr(llm_service, "build_system_prompt", lambda: "system prompt")
    monkeypatch.setattr(llm_service, "call_tool", lambda name, args: {})

    with pytest.raises(RuntimeError, match="Too many tool-call loops"):
        llm_service.run_weather_chat([
            ChatMessage(role="user", content="Keep calling tools")
        ])