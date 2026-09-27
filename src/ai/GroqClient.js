/**
 * GroqClient — API wrapper for Groq's chat completions.
 * Handles rate limiting, error handling, and streaming responses.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class GroqClient {
  constructor(apiKey, model = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = 200; // ms between requests to avoid rate limits
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  setModel(model) {
    this.model = model;
  }

  /**
   * Send a chat completion request (non-streaming)
   */
  async chat(messages, options = {}) {
    const {
      temperature = 0.85,
      maxTokens = 600,
      topP = 0.9,
      frequencyPenalty = 0.3
    } = options;

    await this._throttle();

    const body = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      stream: false
    };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (response.status === 429) {
          // Rate limited — wait and retry
          const retryAfter = parseInt(response.headers.get('retry-after') || '2') * 1000;
          console.warn(`Rate limited. Retrying in ${retryAfter}ms...`);
          await this._delay(retryAfter);
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        this.lastRequestTime = Date.now();
        return {
          content: data.choices[0]?.message?.content || '',
          usage: data.usage,
          finishReason: data.choices[0]?.finish_reason
        };
      } catch (error) {
        if (attempt === MAX_RETRIES - 1) throw error;
        console.warn(`Request failed (attempt ${attempt + 1}), retrying...`, error.message);
        await this._delay(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  /**
   * Send a streaming chat completion request.
   * Returns an async generator that yields content chunks.
   */
  async *chatStream(messages, options = {}) {
    const {
      temperature = 0.85,
      maxTokens = 600,
      topP = 0.9,
      frequencyPenalty = 0.3
    } = options;

    await this._throttle();

    const body = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      stream: true
    };

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch (e) {
            // Skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
      this.lastRequestTime = Date.now();
    }
  }

  /**
   * Validate the API key by sending a minimal request
   */
  async validateKey() {
    try {
      const result = await this.chat([
        { role: 'system', content: 'Respond with exactly: OK' },
        { role: 'user', content: 'Test' }
      ], { maxTokens: 5, temperature: 0 });
      return { valid: true, message: 'API key is valid' };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  async _throttle() {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      await this._delay(this.minRequestInterval - elapsed);
    }
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
