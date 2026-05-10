import React, { useState } from 'react';
import './WeatherAiChat.css';

function WeatherAiChat() {
  const [prompt, setPrompt] = useState('What was the hottest April 10th ever?');
  const [answer, setAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  function askQuestion() {
    if (!prompt.trim() || isStreaming) {
      return;
    }

    setAnswer('');
    setError(null);
    setIsStreaming(true);

    const url = `analysis-api/llm/prompt?prompt=${encodeURIComponent(prompt)}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.done) {
        eventSource.close();
        setIsStreaming(false);
        return;
      }

      if (payload.chunk) {
        setAnswer((previous) => previous + payload.chunk);
      }
    };

    eventSource.addEventListener('error', (event) => {
      console.error('AI stream error:', event);
      eventSource.close();
      setError('The AI response stream failed.');
      setIsStreaming(false);
    });
  }

  return (
  <section className="ai-chat">
    <div className="ai-chat-header">
      <h2>Weather AI Assistant</h2>
      <p>Ask questions about historical weather records.</p>
    </div>

    {answer && (
      <div className="ai-message ai-message-assistant">
        {answer}
      </div>
    )}

    {error && (
      <div className="ai-message ai-message-error">
        {error}
      </div>
    )}

    <div className="ai-input-row">
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
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