import React, { useState } from 'react';
import './WeatherAiChat.css';

function WeatherAiChat() {
  const [prompt, setPrompt] = useState('What was the hottest April 10th ever?');
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  function appendToLastAssistantMessage(chunk) {
    setMessages((previous) => {
      const updated = [...previous];
      const lastIndex = updated.length - 1;
      const lastMessage = updated[lastIndex];

      updated[lastIndex] = {
        ...lastMessage,
        content: lastMessage.content + chunk,
      };

      return updated;
    });
  }

  function askQuestion() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isStreaming) {
      return;
    }

    setError(null);
    setIsStreaming(true);
    setPrompt('');

    setMessages((previous) => [
      ...previous,
      { role: 'user', content: trimmedPrompt },
      { role: 'assistant', content: '' },
    ]);

    const url = `/analysis-api/llm/prompt?prompt=${encodeURIComponent(trimmedPrompt)}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.done) {
        eventSource.close();
        setIsStreaming(false);
        return;
      }

      if (payload.chunk) {
        appendToLastAssistantMessage(payload.chunk);
      }
    };

    eventSource.addEventListener('error', (event) => {
      console.error('AI stream error:', event);
      eventSource.close();
      setError('The AI response stream failed.');
      setIsStreaming(false);
    });
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      askQuestion();
    }
  }

  return (
    <section className="ai-chat">
      <div className="ai-chat-header">
        <h2>Weather AI Assistant</h2>
        <p>Ask questions about historical weather records.</p>
      </div>

      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <div className="ai-empty-state">
            Try asking: “What was the hottest April 10th ever?”
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`ai-chat-row ${message.role}`}>
            <div className="ai-chat-bubble">
              {message.content || (message.role === 'assistant' && isStreaming ? 'Thinking…' : '')}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="ai-message ai-message-error">
          {error}
        </div>
      )}

      <div className="ai-input-row">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={isStreaming}
          placeholder="Ask about your weather data..."
        />

        <button onClick={askQuestion} disabled={isStreaming || !prompt.trim()}>
          {isStreaming ? 'Thinking…' : 'Ask'}
        </button>
      </div>
    </section>
  );
}

export default WeatherAiChat;