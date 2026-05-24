/**
 * @file AI浮窗客服组件
 * @description 可拖拽的AI客服浮窗，支持对话和快捷指令
 * @module components/ai/FloatingChat
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-23
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Trash2,
  Bot,
  Sparkles,
  Loader2
} from 'lucide-react';
import aiService from '@/lib/services/aiService';
import { AIModelType, MODEL_NAME_MAP, AIChatMessage } from '@/lib/types/ai';

interface FloatingChatProps {
  position?: 'bottom-right' | 'bottom-left';
}

const QUICK_ACTIONS = [
  { label: '帮助', prompt: '请给我一些帮助' },
  { label: '翻译', prompt: '翻译这段文字：' },
  { label: '代码', prompt: '帮我写一段代码：' },
  { label: '解释', prompt: '请解释这个概念：' }
];

export const FloatingChat: React.FC<FloatingChatProps> = ({ 
  position = 'bottom-right' 
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是YYC³ AI助手，有什么可以帮助你的吗？',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const settings = aiService.getSettings();

  useEffect(() => {
    if (settings.enableFloatingChat === false) {
      setIsOpen(false);
    }
  }, [settings.enableFloatingChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const hasApiKey = aiService.hasApiKey();
      if (!hasApiKey) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '请先在设置页面配置AI API Key，以便使用AI助手功能。',
          timestamp: new Date()
        }]);
        return;
      }

      const allMessages = [
        { id: '0', role: 'system' as const, content: settings.systemPrompt, timestamp: new Date() },
        ...messages,
        userMessage
      ];

      const response = await aiService.complete({
        model: settings.defaultModel,
        messages: allMessages,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens
      });

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        model: settings.defaultModel
      }]);
    } catch (error) {
      toast({
        title: 'AI响应失败',
        description: error instanceof Error ? error.message : '请检查API配置',
        variant: 'destructive'
      });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我现在无法响应。请检查API配置后重试。',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleClear = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: '你好！我是YYC³ AI助手，有什么可以帮助你的吗？',
      timestamp: new Date()
    }]);
  };

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-6 right-6' 
    : 'bottom-6 left-6';

  if (!settings.enableFloatingChat) {
    return null;
  }

  return (
    <div className={`fixed ${positionClasses} z-50 flex flex-col items-end gap-2`}>
      {isOpen && !isMinimized && (
        <Card className="w-[380px] h-[500px] flex flex-col shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">YYC³ AI助手</p>
                <p className="text-xs text-muted-foreground">
                  {MODEL_NAME_MAP[settings.defaultModel]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleClear}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1">
            <CardContent className="space-y-4 pt-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI正在思考...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
          </ScrollArea>

          <CardFooter className="border-t pt-3">
            <div className="space-y-2 w-full">
              <div className="flex gap-1 flex-wrap">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleQuickAction(action.prompt)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="输入消息..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}

      {isMinimized && (
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsMinimized(false)}
        >
          <Maximize2 className="w-5 h-5" />
        </Button>
      )}

      {!isOpen && (
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg gap-2"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
};

export default FloatingChat;
