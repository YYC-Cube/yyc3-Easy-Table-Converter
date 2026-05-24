/**
 * @file AI服务模块
 * @description 提供多模型AI服务支持，支持OpenAI/Claude/Gemini/国内模型
 * @module lib/services/aiService
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-23
 */

import {
  AISettings,
  DEFAULT_AI_SETTINGS,
  MODEL_PROVIDER_MAP,
  AICompletionRequest,
  AICompletionResponse,
  AIModelType,
  AIModelProvider,
  AIChatMessage,
  AIStreamChunk
} from '../types/ai';

const SETTINGS_KEY = 'yyc3_ai_settings';

class AIService {
  private settings: AISettings;
  private static instance: AIService;

  private constructor() {
    this.settings = this.loadSettings();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private loadSettings(): AISettings {
    if (typeof window === 'undefined') {
      return DEFAULT_AI_SETTINGS;
    }
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_AI_SETTINGS;
      }
    }
    return DEFAULT_AI_SETTINGS;
  }

  getSettings(): AISettings {
    return this.settings;
  }

  updateSettings(newSettings: Partial<AISettings>): AISettings {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    }
    return this.settings;
  }

  setApiKey(provider: AIModelProvider, apiKey: string): void {
    this.settings.apiKeys[provider] = apiKey;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    }
  }

  getApiKey(provider: AIModelProvider): string {
    return this.settings.apiKeys[provider] || '';
  }

  hasApiKey(provider?: AIModelProvider): boolean {
    if (provider) {
      return !!this.getApiKey(provider);
    }
    return Object.values(this.settings.apiKeys).some(key => !!key);
  }

  getProviderForModel(model: AIModelType): AIModelProvider {
    return MODEL_PROVIDER_MAP[model];
  }

  isModelEnabled(model: AIModelType): boolean {
    const provider = this.getProviderForModel(model);
    return this.hasApiKey(provider);
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const provider = this.getProviderForModel(request.model);
    const apiKey = this.getApiKey(provider);

    if (!apiKey) {
      throw new Error(`请先配置 ${provider} 的 API Key`);
    }

    switch (provider) {
      case 'openai':
        return this.callOpenAI(request, apiKey);
      case 'anthropic':
        return this.callAnthropic(request, apiKey);
      case 'google':
        return this.callGoogle(request, apiKey);
      default:
        return this.callCustomProvider(request, apiKey, provider);
    }
  }

  async *streamComplete(request: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    const provider = this.getProviderForModel(request.model);
    const apiKey = this.getApiKey(provider);

    if (!apiKey) {
      throw new Error(`请先配置 ${provider} 的 API Key`);
    }

    switch (provider) {
      case 'openai':
        yield* this.streamOpenAI(request, apiKey);
        break;
      case 'anthropic':
        yield* this.streamAnthropic(request, apiKey);
        break;
      default:
        const response = await this.complete(request);
        yield {
          id: response.id,
          delta: response.content,
          finishReason: response.finishReason
        };
    }
  }

  private async callOpenAI(request: AICompletionRequest, apiKey: string): Promise<AICompletionResponse> {
    const baseUrl = this.settings.baseUrls.openai;
    const model = this.getOpenAIModelName(request.model);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        temperature: request.temperature ?? this.settings.temperature,
        max_tokens: request.maxTokens ?? this.settings.maxTokens,
        top_p: request.topP
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API 调用失败');
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      id: data.id,
      model: request.model,
      content: choice.message.content,
      usage: data.usage,
      finishReason: choice.finish_reason
    };
  }

  private async *streamOpenAI(request: AICompletionRequest, apiKey: string): AsyncGenerator<AIStreamChunk> {
    const baseUrl = this.settings.baseUrls.openai;
    const model = this.getOpenAIModelName(request.model);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        temperature: request.temperature ?? this.settings.temperature,
        max_tokens: request.maxTokens ?? this.settings.maxTokens,
        top_p: request.topP,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API 调用失败');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取响应流');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        
        if (trimmed === 'data: [DONE]') return;

        try {
          const data = JSON.parse(trimmed.slice(6));
          const delta = data.choices[0]?.delta?.content;
          if (delta) {
            yield {
              id: data.id,
              delta,
              finishReason: data.choices[0]?.finish_reason || null
            };
          }
        } catch {
          continue;
        }
      }
    }
  }

  private async callAnthropic(request: AICompletionRequest, apiKey: string): Promise<AICompletionResponse> {
    const baseUrl = this.settings.baseUrls.anthropic;
    const model = this.getAnthropicModelName(request.model);

    const systemMessage = request.messages.find(m => m.role === 'system');
    const filteredMessages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens ?? this.settings.maxTokens,
        temperature: request.temperature ?? this.settings.temperature,
        system: systemMessage?.content || this.settings.systemPrompt,
        messages: filteredMessages.map(m => ({ role: m.role, content: m.content }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API 调用失败');
    }

    const data = await response.json();

    return {
      id: data.id,
      model: request.model,
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      },
      finishReason: data.stop_reason
    };
  }

  private async *streamAnthropic(request: AICompletionRequest, apiKey: string): AsyncGenerator<AIStreamChunk> {
    const baseUrl = this.settings.baseUrls.anthropic;
    const model = this.getAnthropicModelName(request.model);

    const systemMessage = request.messages.find(m => m.role === 'system');
    const filteredMessages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        temperature: request.temperature ?? this.settings.temperature,
        system: systemMessage?.content || this.settings.systemPrompt,
        messages: filteredMessages.map(m => ({ role: m.role, content: m.content })),
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API 调用失败');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取响应流');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(trimmed.slice(6));
          if (data.type === 'content_block_delta') {
            yield {
              id: data.id,
              delta: data.delta.text,
              finishReason: null
            };
          } else if (data.type === 'message_delta') {
            yield {
              id: data.id,
              delta: '',
              finishReason: data.delta.stop_reason
            };
          }
        } catch {
          continue;
        }
      }
    }
  }

  private async callGoogle(request: AICompletionRequest, apiKey: string): Promise<AICompletionResponse> {
    const baseUrl = this.settings.baseUrls.google;
    const model = this.getGoogleModelName(request.model);

    const systemMessage = request.messages.find(m => m.role === 'system')?.content;
    const filteredMessages = request.messages.filter(m => m.role !== 'system');

    const contents = filteredMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemMessage || this.settings.systemPrompt }] },
        generationConfig: {
          temperature: request.temperature ?? this.settings.temperature,
          maxOutputTokens: request.maxTokens ?? this.settings.maxTokens,
          topP: request.topP
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Google API 调用失败');
    }

    const data = await response.json();

    return {
      id: data.promptFeedback?.safetyRatings ? 'google-' + Date.now() : 'google-' + Date.now(),
      model: request.model,
      content: data.candidates[0].content.parts[0].text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      },
      finishReason: data.candidates[0].finishReason || null
    };
  }

  private async callCustomProvider(request: AICompletionRequest, apiKey: string, provider: AIModelProvider): Promise<AICompletionResponse> {
    const baseUrl = this.settings.baseUrls[provider] || this.settings.baseUrls.custom;

    if (!baseUrl) {
      throw new Error('请配置自定义模型的 API 地址');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        temperature: request.temperature ?? this.settings.temperature,
        max_tokens: request.maxTokens ?? this.settings.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `${provider} API 调用失败`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      id: data.id,
      model: request.model,
      content: choice.message.content,
      usage: data.usage,
      finishReason: choice.finish_reason
    };
  }

  private getOpenAIModelName(model: AIModelType): string {
    const map: Record<string, string> = {
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini',
      'gpt-4-turbo': 'gpt-4-turbo',
      'gpt-3.5-turbo': 'gpt-3.5-turbo'
    };
    return map[model] || model;
  }

  private getAnthropicModelName(model: AIModelType): string {
    const map: Record<string, string> = {
      'claude-3-5-sonnet': 'claude-sonnet-3-5-20241022',
      'claude-3-opus': 'claude-3-opus-20240229',
      'claude-3-haiku': 'claude-3-haiku-20240307'
    };
    return map[model] || model;
  }

  private getGoogleModelName(model: AIModelType): string {
    const map: Record<string, string> = {
      'gemini-pro': 'gemini-1.5-pro',
      'gemini-flash': 'gemini-1.5-flash'
    };
    return map[model] || model;
  }
}

export const aiService = AIService.getInstance();
export default aiService;
