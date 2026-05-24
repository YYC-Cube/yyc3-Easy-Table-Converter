/**
 * @file AI浮窗系统提供者组件
 * @description 管理AI浮窗的状态和与AI服务的通信
 * @module components/ai/AIWidgetProvider
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */

import React, { useState, useCallback, useContext, createContext, useEffect, useRef } from 'react';
import { IntelligentAIWidget } from './IntelligentAIWidget';
import { AIProvider } from '../../types/ai';

// 定义缺失的AIChatRequest接口，与实际使用的结构匹配
interface AIChatRequest {
  messages: { role: string; content: string }[];
  provider: AIProvider;
  context: Record<string, any>;
}

// AI上下文接口
interface AIWidgetContextType {
  toggleWidget: () => void;
  isWidgetOpen: boolean;
  sendMessageToAI: (message: string) => Promise<string>;
  registerCurrentContext: (context: any) => void;
  unregisterCurrentContext: () => void;
}

// 创建上下文
const AIWidgetContext = createContext<AIWidgetContextType | undefined>(undefined);

// 提供者组件Props
interface AIWidgetProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  defaultAIProvider?: AIProvider;
}

// 智能提示模板
const SMART_SUGGESTIONS = {
  TABLE_ANALYSIS: '我看到您正在查看表格数据，需要我帮您分析这些数据吗？',
  CHART_CREATION: '需要我帮您基于这些数据创建可视化图表吗？',
  FORMAT_CONVERSION: '您想要将当前数据转换为其他格式吗？例如JSON、CSV或Excel？',
  DATA_CLEANING: '发现您的数据集可能存在一些异常值，需要我帮您清理和预处理吗？',
  REPORT_GENERATION: '需要我帮您基于这些数据生成一份分析报告吗？'
};

/**
 * AI浮窗系统提供者组件
 * 管理AI浮窗的状态和与AI服务的通信
 */
export const AIWidgetProvider: React.FC<AIWidgetProviderProps> = ({
  children,
  defaultOpen = false,
  defaultAIProvider = AIProvider.OPENAI
}) => {
  // 状态管理
  const [isWidgetOpen, setIsWidgetOpen] = useState(defaultOpen);
  const [currentAIProvider] = useState<AIProvider>(defaultAIProvider);
  const [activeContext, setActiveContext] = useState<Record<string, any> | null>(null);
  const [suggestionTimer] = useState<NodeJS.Timeout | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<string>('');

  // 引用
  const messageQueueRef = useRef<Array<{ message: string; resolve: (value: string) => void; reject: (error: Error) => void }>>([]);
  const isProcessingRef = useRef(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 处理浮窗显示状态
  const toggleWidget = useCallback(() => {
    setIsWidgetOpen(prev => !prev);
    // 清除提示
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
      suggestionTimeoutRef.current = null;
    }
    setShowSuggestion(false);
  }, []);

  // 处理浮窗显示状态变化
  const handleWidgetToggle = useCallback((isOpen: boolean) => {
    setIsWidgetOpen(isOpen);
  }, []);

  // 注册当前上下文
  const registerCurrentContext = useCallback((context: any) => {
    setActiveContext(context);
    // 当有新上下文时，考虑显示智能提示
    showSmartSuggestion(context);
  }, []);

  // 取消注册当前上下文
  const unregisterCurrentContext = useCallback(() => {
    setActiveContext(null);
    // 清除提示计时器
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
      suggestionTimeoutRef.current = null;
    }
    setShowSuggestion(false);
  }, []);

  // 显示智能提示
  const showSmartSuggestion = useCallback((context: any) => {
    // 如果浮窗已经打开，不显示提示
    if (isWidgetOpen || !context) return;

    // 根据上下文类型确定提示内容
    let suggestion = '';
    
    if (context.type === 'table' || context.type === 'data_grid') {
      suggestion = SMART_SUGGESTIONS.TABLE_ANALYSIS;
    } else if (context.type === 'chart' || context.type === 'visualization') {
      suggestion = SMART_SUGGESTIONS.CHART_CREATION;
    } else if (context.type === 'file_operation') {
      suggestion = SMART_SUGGESTIONS.FORMAT_CONVERSION;
    } else if (context.type === 'data_cleaning' || context.hasIssues) {
      suggestion = SMART_SUGGESTIONS.DATA_CLEANING;
    } else if (context.type === 'report' || context.type === 'dashboard') {
      suggestion = SMART_SUGGESTIONS.REPORT_GENERATION;
    }

    // 如果有合适的提示，设置延迟显示
    if (suggestion) {
      // 清除之前的计时器
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }

      // 设置新的计时器，3秒后显示提示
      suggestionTimeoutRef.current = setTimeout(() => {
        setCurrentSuggestion(suggestion);
        setShowSuggestion(true);
        
        // 5秒后自动隐藏提示
        suggestionTimeoutRef.current = setTimeout(() => {
          setShowSuggestion(false);
        }, 5000);
      }, 3000);
    }
  }, [isWidgetOpen]);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      if (suggestionTimer) {
        clearTimeout(suggestionTimer);
      }
    };
  }, [suggestionTimer]);

  // 向AI发送消息
  const sendMessageToAI = useCallback(async (message: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 将请求加入队列
      messageQueueRef.current.push({ message, resolve, reject });
      
      // 如果当前没有处理中的请求，则处理队列
      if (!isProcessingRef.current) {
        processMessageQueue();
      }
    });
  }, []);

  // 处理消息队列
  const processMessageQueue = useCallback(async () => {
    if (messageQueueRef.current.length === 0) {
      isProcessingRef.current = false;
      return;
    }

    isProcessingRef.current = true;
    const { message, resolve, reject } = messageQueueRef.current.shift()!;

    try {
      // 构建AI请求
      const aiRequest: AIChatRequest = {
        messages: [
          {
            role: 'system',
            content: '你是YYC³ AI助手，一个专业的数据处理和分析助手。请根据用户的请求提供精准、实用的帮助。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        provider: currentAIProvider,
        context: activeContext || {}
      };

      // 模拟AI调用（实际项目中应替换为真实的API调用）
      const response = await mockAICall(aiRequest);
      resolve(response);
    } catch (error) {
      console.error('AI调用失败:', error);
      reject(new Error('AI服务暂时不可用，请稍后再试。'));
    } finally {
      // 继续处理队列中的下一个请求
      processMessageQueue();
    }
  }, [currentAIProvider, activeContext]);

  // 模拟AI调用（开发环境用）
  const mockAICall = async (request: AIChatRequest): Promise<string> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 根据用户消息内容生成响应
    const userMessage = request.messages.find(m => m.role === 'user')?.content || '';
    
    // 预定义的响应模板
    if (userMessage.toLowerCase().includes('分析') || userMessage.toLowerCase().includes('趋势')) {
      return "根据您的数据，我发现了以下几个关键趋势：\n1. 数据呈现出明显的季节性波动\n2. 最近三个月的数据增长速度加快\n3. 存在几个需要关注的异常值\n\n您是否需要我对这些趋势进行更深入的分析？";
    } else if (userMessage.toLowerCase().includes('转换') || userMessage.toLowerCase().includes('格式')) {
      return "我可以帮您将数据转换为多种格式，包括JSON、CSV、Excel、XML等。请告诉我您想要的目标格式，我将为您处理转换过程。";
    } else if (userMessage.toLowerCase().includes('图表') || userMessage.toLowerCase().includes('可视化')) {
      return "基于您的数据，我建议创建以下可视化：\n1. 折线图 - 展示时间趋势\n2. 柱状图 - 比较不同类别的数据\n3. 散点图 - 分析两个变量之间的关系\n\n您更倾向于哪种可视化方式？";
    } else if (userMessage.toLowerCase().includes('帮助') || userMessage.toLowerCase().includes('guide')) {
      return "我是YYC³ AI助手，我可以帮助您：\n• 分析表格数据和发现趋势\n• 将数据转换为不同格式\n• 创建数据可视化图表\n• 清理和预处理数据\n• 生成分析报告\n• 回答关于数据处理的问题\n\n请告诉我您需要什么帮助。";
    } else {
      return "感谢您的提问。我正在处理您的请求，稍等片刻...\n\n根据您的需求，我认为可以从以下几个方面入手：\n1. 分析数据的基本特征和统计信息\n2. 识别数据中的模式和异常\n3. 提供数据处理和转换的建议\n\n您能提供更多关于您具体需求的信息吗？这样我可以更好地帮助您。";
    }
  };

  // 上下文值
  const contextValue: AIWidgetContextType = {
    toggleWidget,
    isWidgetOpen,
    sendMessageToAI,
    registerCurrentContext,
    unregisterCurrentContext
  };

  return (
    <AIWidgetContext.Provider value={contextValue}>
      {children}
      
      {/* 智能AI浮窗 */}
      <IntelligentAIWidget
        onToggleWidget={handleWidgetToggle}
        onSendMessage={sendMessageToAI}
      />
      
      {/* 智能提示 */}
      {showSuggestion && !isWidgetOpen && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 border border-gray-200 dark:border-gray-700 max-w-xs z-40 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
              💡
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                {currentSuggestion}
              </p>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  onClick={() => {
                    toggleWidget();
                    setShowSuggestion(false);
                  }}
                >
                  好的
                </button>
                <button
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    setShowSuggestion(false);
                    // 30分钟内不再显示提示
                    if (suggestionTimeoutRef.current) {
                      clearTimeout(suggestionTimeoutRef.current);
                    }
                    suggestionTimeoutRef.current = setTimeout(() => {
                      setShowSuggestion(false);
                    }, 30 * 60 * 1000);
                  }}
                >
                  暂不需要
                </button>
              </div>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full p-1"
              onClick={() => setShowSuggestion(false)}
              aria-label="关闭提示"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </AIWidgetContext.Provider>
  );
};

// 自定义Hook，方便组件使用AI浮窗上下文
export const useAIWidget = (): AIWidgetContextType => {
  const context = useContext(AIWidgetContext);
  if (context === undefined) {
    throw new Error('useAIWidget必须在AIWidgetProvider内部使用');
  }
  return context;
};

// 高阶组件，用于为组件提供AI功能
export const withAIWidget = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const aiWidgetContext = useAIWidget();
    return (
      <Component
        {...props}
        aiWidget={aiWidgetContext}
      />
    );
  };
};

// 装饰器Hook，用于自动为组件提供AI上下文
export const useAIAwareComponent = (componentType: string, componentData?: any) => {
  const { registerCurrentContext, unregisterCurrentContext } = useAIWidget();

  useEffect(() => {
    const context = {
      type: componentType,
      data: componentData || {},
      timestamp: Date.now()
    };
    
    registerCurrentContext(context);
    
    return () => {
      unregisterCurrentContext();
    };
  }, [componentType, componentData, registerCurrentContext, unregisterCurrentContext]);
};
