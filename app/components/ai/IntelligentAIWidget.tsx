/**
 * @file 智能AI浮窗主组件
 * @description 实现可拖拽、可折叠的AI助手浮窗系统
 * @module components/ai/IntelligentAIWidget
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronUp, Settings, MessageSquare, Brain, Send, FileText, Code, Minus } from '../ui/icons';

// 定义缺失的AIMessage接口
interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  error?: boolean;
}

interface IntelligentAIWidgetProps {
  onSendMessage: (message: string) => Promise<string>;
  onToggleWidget: (isOpen: boolean) => void;
  initialPosition?: {
    x: number;
    y: number;
  };
}

/**
 * 智能AI浮窗主组件
 */
export const IntelligentAIWidget: React.FC<IntelligentAIWidgetProps> = ({
  onSendMessage,
  onToggleWidget,
  initialPosition = { x: 80, y: 50 }
}) => {
  // 状态管理
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'assist' | 'settings'>('chat');
  const [showQuickActions, setShowQuickActions] = useState(false);

  // 引用
  const widgetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 监听键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+I 切换浮窗显示
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        toggleWidget();
      }
      // Escape 关闭浮窗
      if (e.key === 'Escape' && isOpen && !isMinimized) {
        closeWidget();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized]);

  // 监听点击外部关闭浮窗
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        if (showQuickActions) {
          setShowQuickActions(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, showQuickActions]);

  // 拖拽相关函数
  const startDragging = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.currentTarget as HTMLElement).classList.contains('widget-header')) {
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const drag = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // 限制在可视区域内
      const widgetWidth = widgetRef.current?.offsetWidth || 360;
      const widgetHeight = isMinimized ? 40 : (widgetRef.current?.offsetHeight || 500);
      
      setPosition({
        x: Math.max(0, Math.min(newX, window.innerWidth - widgetWidth)),
        y: Math.max(0, Math.min(newY, window.innerHeight - widgetHeight))
      });
    }
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDragging);
    }
    
    // 添加清理函数移除事件监听器
    return () => {
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDragging);
    };
  }, [isDragging, drag, stopDragging]);

  // 浮窗操作函数
  const toggleWidget = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      onToggleWidget(true);
    } else if (isMinimized) {
      setIsMinimized(false);
    } else {
      closeWidget();
    }
  };

  const closeWidget = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setShowQuickActions(false);
    onToggleWidget(false);
  };

  const minimizeWidget = () => {
    setIsMinimized(true);
  };

  // 消息处理函数
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await onSendMessage(userMessage);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now() + 2}`,
        role: 'assistant',
        content: `抱歉，我无法处理您的请求：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Shift+Enter 换行
      const textarea = e.currentTarget as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = inputMessage.substring(0, start) + '\n' + inputMessage.substring(end);
      setInputMessage(newValue);
      // 移动光标到新行
      setTimeout(() => {
        if (inputRef.current) {
          const textarea = inputRef.current;
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
      }, 0);
    }
  };

  // 快速操作模板
  const quickActionTemplates = [
    { title: '分析表格数据', content: '请帮我分析这个表格数据，找出主要趋势和异常值。' },
    { title: '生成报告', content: '请基于这些数据生成一份简洁的分析报告。' },
    { title: '转换格式', content: '请将这份数据转换为JSON格式。' },
    { title: '数据清洗', content: '请帮我清理这份数据，处理缺失值和重复项。' }
  ];

  const applyTemplate = (content: string) => {
    setInputMessage(content);
    setShowQuickActions(false);
    inputRef.current?.focus();
  };

  // 渲染消息项
  const renderMessage = (message: AIMessage) => {
    return (
      <div
        key={message.id}
        className={`flex gap-3 p-3 rounded-lg my-1 transition-all duration-200
          ${message.role === 'user' ? 'flex-row-reverse' : ''}
          ${message.error ? 'opacity-80' : ''}
        `}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0
          ${message.role === 'user' ? 'bg-primary' : 'bg-secondary'}
        `}>
          {message.role === 'user' ? '👤' : '🤖'}
        </div>
        <div className={`flex-1 max-w-[85%]
          ${message.role === 'user' ? 'text-right' : ''}
        `}>
          <div className={`p-3 rounded-2xl inline-block
            ${message.role === 'user'
              ? 'bg-primary text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}
            ${message.error ? 'border border-red-300 dark:border-red-700' : ''}
          `}>
            {message.content}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  };

  // 如果浮窗未打开且未最小化，不渲染
  if (!isOpen && !isMinimized) return null;

  return (
    <div
      ref={widgetRef}
      className={`fixed z-50 transition-all duration-300 ease-in-out shadow-2xl rounded-lg overflow-hidden
        ${isMinimized ? 'w-64 h-10' : 'w-[360px] md:w-[420px] h-[500px] md:h-[600px]'}
        ${isOpen ? 'opacity-100' : 'opacity-0'}
        ${isDragging ? 'cursor-grabbing' : 'cursor-default'}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isMinimized ? 'translateY(0)' : 'translateY(0)',
        background: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* 浮窗头部 */}
      <div
        className="h-10 flex items-center justify-between px-3 bg-gradient-to-r from-primary/90 to-primary cursor-move"
        onMouseDown={startDragging}
      >
        <div className="flex items-center gap-2 text-white">
          <Brain className="h-4.5 w-4.5" />
          <span className="font-medium text-sm">YYC³ AI 助手</span>
        </div>
        <div className="flex gap-1">
          {!isMinimized && (
            <button
              className="p-1.5 rounded hover:bg-white/20 transition-colors"
              onClick={minimizeWidget}
              aria-label="最小化"
            >
              <Minus className="h-3.5 w-3.5 text-white" />
            </button>
          )}
          <button
            className="p-1.5 rounded hover:bg-white/20 transition-colors"
            onClick={closeWidget}
            aria-label="关闭"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* 最小化状态下的内容 */}
      {isMinimized && (
        <button
          className="w-full h-full flex items-center justify-between px-3 bg-white hover:bg-gray-50 transition-colors"
          onClick={toggleWidget}
        >
          <div className="flex items-center gap-2 text-gray-700">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">YYC³ AI 助手</span>
          </div>
          <ChevronUp className="h-4 w-4 text-gray-500" />
        </button>
      )}

      {/* 展开状态下的内容 */}
      {!isMinimized && (
        <div className="flex flex-col h-[calc(100%-40px)]">
          {/* 标签页导航 */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'chat' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare className="h-3.5 w-3.5 inline mr-1" />
              聊天
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'assist' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'}`}
              onClick={() => setActiveTab('assist')}
            >
              <Brain className="h-3.5 w-3.5 inline mr-1" />
              助手
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'settings' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="h-3.5 w-3.5 inline mr-1" />
              设置
            </button>
          </div>

          {/* 聊天内容区域 */}
          {activeTab === 'chat' && (
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-2">
              {/* 欢迎消息 */}
              {messages.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-primary/60" />
                  <h3 className="text-lg font-medium mb-2">欢迎使用 YYC³ AI 助手</h3>
                  <p className="text-sm mb-4">我可以帮您分析数据、生成报告、转换格式等</p>
                  <button
                    className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    onClick={() => {
                      setShowQuickActions(!showQuickActions);
                    }}
                  >
                    快速开始
                  </button>
                </div>
              )}

              {/* 快速操作模板 */}
              {showQuickActions && (
                <div className="absolute bottom-16 left-2 right-2 bg-white rounded-xl shadow-lg p-3 border border-gray-200">
                  <h4 className="text-sm font-medium mb-2 text-gray-700">常用模板</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActionTemplates.map((template, index) => (
                      <button
                        key={index}
                        className="text-xs p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-left transition-colors"
                        onClick={() => applyTemplate(template.content)}
                      >
                        {template.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 消息列表 */}
              <div className="space-y-2">
                {messages.map(renderMessage)}
                {isLoading && (
                  <div className="flex gap-3 p-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 bg-secondary">
                      🤖
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* 助手模式 */}
          {activeTab === 'assist' && (
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-950">
              <div className="text-center p-4">
                <h3 className="text-lg font-medium mb-2">AI 智能助手</h3>
                <p className="text-sm text-gray-600 mb-4">为您提供智能化的数据处理和分析服务</p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <FileText className="mx-auto mb-2 text-primary h-6 w-6" />
                    <div className="text-sm font-medium">数据分析</div>
                  </button>
                  <button className="p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <Code className="mx-auto mb-2 text-primary h-6 w-6" />
                    <div className="text-sm font-medium">代码生成</div>
                  </button>
                  <button className="p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <Brain className="mx-auto mb-2 text-primary h-6 w-6" />
                    <div className="text-sm font-medium">图像分析</div>
                  </button>
                  <button className="p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <MessageSquare className="mx-auto mb-2 text-primary h-6 w-6" />
                    <div className="text-sm font-medium">智能问答</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 设置页面 */}
          {activeTab === 'settings' && (
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-950">
              <h3 className="text-lg font-medium mb-4">设置</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">AI 模型</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                    <option>默认模型</option>
                    <option>GPT-4o</option>
                    <option>Claude 3</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">响应语言</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                    <option>跟随系统</option>
                    <option>简体中文</option>
                    <option>English</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-primary" />
                    <span className="text-sm">启用智能感应</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-primary" defaultChecked />
                    <span className="text-sm">启用快捷键 (Ctrl+Shift+I)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 输入区域 */}
          {activeTab === 'chat' && (
            <div className="p-3 border-t border-gray-200">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入您的问题... (Shift+Enter 换行，Enter 发送)"
                  className="w-full p-3 border border-gray-300 rounded-xl resize-none max-h-32 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  rows={2}
                />
                <button
                  className="absolute right-3 bottom-3 p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  aria-label="发送"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Shift+Enter 换行</span>
                <span>Ctrl+Shift+I 切换浮窗</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
