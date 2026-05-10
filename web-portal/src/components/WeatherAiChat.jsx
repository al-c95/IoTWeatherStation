import React, { useState } from 'react';

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
    <div style={{ marginTop: '2rem' }}>
      <h2>Weather AI Assistant</h2>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={3}
        style={{ width: '100%', maxWidth: '700px' }}
        disabled={isStreaming}
      />

      <div style={{ marginTop: '0.5rem' }}>
        <button onClick={askQuestion} disabled={isStreaming || !prompt.trim()}>
          {isStreaming ? 'Thinking...' : 'Ask'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#c00', marginTop: '1rem' }}>
          {error}
        </div>
      )}

      {answer && (
        <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
          {answer}
        </div>
      )}
    </div>
  );
}

export default WeatherAiChat;