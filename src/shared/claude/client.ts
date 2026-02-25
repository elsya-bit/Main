import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export async function callClaude(
  prompt: string,
  options: {
    maxTokens?: number;
    model?: string;
    systemPrompt?: string;
  } = {}
): Promise<string> {
  const client = getClaudeClient();
  const {
    maxTokens = 4096,
    model = 'claude-sonnet-4-6',
    systemPrompt,
  } = options;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: prompt },
  ];

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content');
  }
  return textBlock.text;
}

export async function callClaudeJSON<T>(
  prompt: string,
  options: Parameters<typeof callClaude>[1] = {}
): Promise<T> {
  const text = await callClaude(prompt, options);
  // Strip any accidental markdown code fences
  const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
  return JSON.parse(cleaned) as T;
}
