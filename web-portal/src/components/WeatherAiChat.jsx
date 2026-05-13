import React, { useState } from 'react';
import './WeatherAiChat.css';
import ReactMarkdown from 'react-markdown';

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

async function askQuestion() {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt || isStreaming) {
    return;
  }

  setError(null);
  setIsStreaming(true);
  setPrompt('');

  const updatedMessages = [
    ...messages,
    { role: 'user', content: trimmedPrompt },
    { role: 'assistant', content: '' },
  ];

  setMessages(updatedMessages);

  try {
    const response = await fetch('/analysis-api/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: updatedMessages
          .filter((message) => message.content.trim() !== '')
          .map((message) => ({
            role: message.role,
            content: message.content,
          })),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Missing response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const lines = event.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            continue;
          }

          const jsonText = line.replace('data: ', '');

          const payload = JSON.parse(jsonText);

          if (payload.done) {
            setIsStreaming(false);
            return;
          }

          if (payload.chunk) {
            appendToLastAssistantMessage(payload.chunk);
          }
        }
      }
    }

    setIsStreaming(false);

  } catch (error) {
    console.error('AI stream error:', error);

    setError('The AI response stream failed.');
    setIsStreaming(false);
  }
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
              {message.role === 'user' ? (
                message.content
              ) : (
                <ReactMarkdown>{message.content || (message.role === 'assistant' && isStreaming ? 'Thinking…' : '')}</ReactMarkdown>
              )}
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