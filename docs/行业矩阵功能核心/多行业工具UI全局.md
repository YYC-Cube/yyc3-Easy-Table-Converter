# 智能AI浮窗设计方案

## 🎯 设计概念

基于您的需求，我设计一个**智能AI浮窗系统**，固定在页面特定位置，通过Logo触发，提供全局AI助手功能。

## 🎨 视觉设计

### 1. Logo容器与浮窗布局
```css
/* 智能AI浮窗样式系统 */
:root {
  --ai-widget-primary: #6366F1;
  --ai-widget-secondary: #8B5CF6;
  --ai-widget-accent: #10B981;
  --ai-widget-bg: rgba(255, 255, 255, 0.95);
  --ai-widget-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.ai-widget-container {
  position: fixed;
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Logo触发容器 */
.ai-logo-trigger {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ai-widget-primary), var(--ai-widget-secondary));
  box-shadow: var(--ai-widget-shadow);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 1001;
  
  /* 呼吸动画效果 */
  animation: ai-logo-breathe 3s ease-in-out infinite;
}

.ai-logo-trigger:hover {
  transform: scale(1.1);
  box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.25);
}

.ai-logo-trigger::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: inherit;
  animation: ai-logo-pulse 2s ease-out infinite;
}

@keyframes ai-logo-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes ai-logo-pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
```

## 🏗️ 组件架构

### 1. 智能AI浮窗主组件
```tsx
// components/intelligent-ai-widget/IntelligentAIWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CSSTransition } from 'react-transition-group';

interface AIWidgetState {
  isOpen: boolean;
  position: { x: number; y: number };
  mode: 'minimized' | 'expanded' | 'fullscreen';
  currentTab: 'chat' | 'tools' | 'insights' | 'workflows';
  isDragging: boolean;
}

export const IntelligentAIWidget: React.FC = () => {
  const [state, setState] = useState<AIWidgetState>({
    isOpen: false,
    position: { x: window.innerWidth - 400, y: 100 },
    mode: 'minimized',
    currentTab: 'chat',
    isDragging: false
  });

  const widgetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  // 全局键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        widgetRef.current && 
        !widgetRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        state.isOpen
      ) {
        setState(prev => ({ ...prev, isOpen: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [state.isOpen]);

  const toggleWidget = () => {
    setState(prev => ({ 
      ...prev, 
      isOpen: !prev.isOpen,
      mode: !prev.isOpen ? 'expanded' : 'minimized'
    }));
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: true }));
  };

  const onDrag = (e: MouseEvent) => {
    if (!state.isDragging) return;
    
    setState(prev => ({
      ...prev,
      position: {
        x: e.clientX - (widgetRef.current?.offsetWidth || 0) / 2,
        y: e.clientY - 20
      }
    }));
  };

  const stopDrag = () => {
    setState(prev => ({ ...prev, isDragging: false }));
  };

  useEffect(() => {
    if (state.isDragging) {
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
      return () => {
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
      };
    }
  }, [state.isDragging]);

  return (
    <div className="ai-widget-system">
      {/* Logo触发按钮 */}
      <div 
        ref={triggerRef}
        className="ai-logo-trigger"
        onClick={toggleWidget}
        title="AI助手 (Ctrl+K)"
      >
        <div className="ai-logo-icon">
          <AIIcon />
        </div>
        
        {/* 通知徽章 */}
        <div className="ai-notification-badge">
          <span>3</span>
        </div>
      </div>

      {/* AI浮窗主体 */}
      <CSSTransition
        in={state.isOpen}
        timeout={300}
        classNames="ai-widget-transition"
        unmountOnExit
      >
        <div 
          ref={widgetRef}
          className={`ai-widget-main ${state.mode}`}
          style={{
            left: `${state.position.x}px`,
            top: `${state.position.y}px`
          }}
        >
          {/* 标题栏 - 可拖拽区域 */}
          <div 
            className="ai-widget-header"
            onMouseDown={startDrag}
          >
            <div className="ai-widget-title">
              <AIIcon size={20} />
              <span>YYC³ AI助手</span>
            </div>
            
            <div className="ai-widget-controls">
              <button 
                className="control-btn minimize"
                onClick={() => setState(prev => ({ ...prev, mode: 'minimized' }))}
              >
                <MinimizeIcon />
              </button>
              
              <button 
                className="control-btn expand"
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  mode: prev.mode === 'expanded' ? 'fullscreen' : 'expanded' 
                }))}
              >
                <ExpandIcon />
              </button>
              
              <button 
                className="control-btn close"
                onClick={toggleWidget}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="ai-widget-content">
            <AIChatInterface 
              currentTab={state.currentTab}
              onTabChange={(tab) => setState(prev => ({ ...prev, currentTab: tab }))}
            />
          </div>
        </div>
      </CSSTransition>
    </div>
  );
};
```

### 2. AI聊天界面组件
```tsx
// components/intelligent-ai-widget/AIChatInterface.tsx
interface AIChatInterfaceProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  currentTab,
  onTabChange
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const tabs = [
    { id: 'chat', label: '智能对话', icon: <ChatIcon /> },
    { id: 'tools', label: '工具推荐', icon: <ToolIcon /> },
    { id: 'insights', label: '数据洞察', icon: <InsightIcon /> },
    { id: 'workflows', label: '工作流', icon: <WorkflowIcon /> }
  ];

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // 调用AI服务
      const response = await AIService.processMessage({
        message,
        context: getCurrentContext(),
        userPreferences: getUserPreferences()
      });

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        actions: response.actions,
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI处理错误:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="ai-chat-interface">
      {/* 标签导航 */}
      <div className="ai-tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`ai-tab ${currentTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 消息区域 */}
      <div className="ai-messages-container">
        {messages.length === 0 ? (
          <AIChatWelcome onQuickAction={sendMessage} />
        ) : (
          messages.map(message => (
            <AIMessageBubble 
              key={message.id} 
              message={message}
              onAction={(action) => handleAction(action)}
            />
          ))
        )}
        
        {isProcessing && (
          <AITypingIndicator />
        )}
      </div>

      {/* 输入区域 */}
      <div className="ai-input-container">
        <AIChatInput
          value={input}
          onChange={setInput}
          onSubmit={sendMessage}
          disabled={isProcessing}
          quickReplies={getQuickReplies()}
        />
      </div>
    </div>
  );
};
```

### 3. AI消息气泡组件
```tsx
// components/intelligent-ai-widget/AIMessageBubble.tsx
interface AIMessageBubbleProps {
  message: AIMessage;
  onAction: (action: AIAction) => void;
}

export const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({
  message,
  onAction
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`ai-message-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <UserAvatar /> : <AIAvatar />}
      </div>
      
      <div className="message-content">
        <div className="message-text">
          {message.content}
        </div>
        
        {/* AI消息的附加内容 */}
        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="message-actions">
            {message.actions.map((action, index) => (
              <button
                key={index}
                className="action-button"
                onClick={() => onAction(action)}
              >
                {action.icon && <span className="action-icon">{action.icon}</span>}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* 建议内容 */}
        {!isUser && message.suggestions && (
          <div className="message-suggestions">
            <h4>相关建议：</h4>
            {message.suggestions.map((suggestion, index) => (
              <div key={index} className="suggestion-item">
                {suggestion}
              </div>
            ))}
          </div>
        )}
        
        <div className="message-timestamp">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};
```

## 🔧 核心功能模块

### 1. AI服务集成
```tsx
// services/ai-service.ts
export class AIService {
  private static instance: AIService;
  private contextManager: ContextManager;
  private preferenceManager: PreferenceManager;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async processMessage(request: AIProcessRequest): Promise<AIProcessResponse> {
    const context = await this.contextManager.getCurrentContext();
    const preferences = this.preferenceManager.getUserPreferences();

    // 构建提示词
    const prompt = this.buildPrompt(request.message, context, preferences);

    try {
      // 调用AI模型
      const response = await this.callAIModel(prompt);
      
      // 解析响应
      const parsedResponse = this.parseAIResponse(response);
      
      // 生成相关操作和建议
      const actions = this.generateActions(parsedResponse, context);
      const suggestions = this.generateSuggestions(parsedResponse, preferences);

      return {
        content: parsedResponse.content,
        actions,
        suggestions,
        contextUpdates: parsedResponse.contextUpdates
      };
    } catch (error) {
      throw new Error(`AI处理失败: ${error.message}`);
    }
  }

  private buildPrompt(
    message: string, 
    context: AppContext, 
    preferences: UserPreferences
  ): string {
    return `
      你是一个专业的AI助手，帮助用户使用YYC³平台的各种工具。
      
      当前上下文：
      - 用户所在页面: ${context.currentPage}
      - 用户行业: ${context.userIndustry}
      - 最近使用的工具: ${context.recentTools.join(', ')}
      
      用户偏好：
      - 常用功能: ${preferences.frequentlyUsed.join(', ')}
      - 技能水平: ${preferences.skillLevel}
      
      用户问题: ${message}
      
      请根据以上信息提供专业、有用的回答，可以：
      1. 解答具体问题
      2. 推荐相关工具
      3. 提供使用指导
      4. 建议工作流程
      
      回答要简洁明了，适合在浮窗中显示。
    `;
  }

  async generateToolRecommendations(context: AppContext): Promise<ToolRecommendation[]> {
    // 基于用户行为和上下文推荐工具
    const recommendations = await RecommendationEngine.generate(context);
    return recommendations.slice(0, 5); // 返回前5个推荐
  }

  async analyzeDataInsights(data: any): Promise<DataInsight[]> {
    // 数据分析洞察
    return DataAnalyzer.analyze(data);
  }
}
```

### 2. 上下文管理器
```tsx
// services/context-manager.ts
export class ContextManager {
  private currentContext: AppContext = {
    currentPage: '',
    userIndustry: '',
    recentTools: [],
    currentProject: null,
    userIntent: ''
  };

  async getCurrentContext(): Promise<AppContext> {
    // 从Redux store或URL获取当前上下文
    const state = store.getState();
    
    this.currentContext = {
      currentPage: state.router.location?.pathname || '',
      userIndustry: state.user.preferences?.industry || '',
      recentTools: state.user.history?.recentTools || [],
      currentProject: state.workspace.currentProject,
      userIntent: this.analyzeUserIntent()
    };

    return this.currentContext;
  }

  private analyzeUserIntent(): string {
    // 基于用户行为分析意图
    const recentActions = this.getRecentUserActions();
    return IntentAnalyzer.analyze(recentActions);
  }

  updateContext(updates: Partial<AppContext>): void {
    this.currentContext = { ...this.currentContext, ...updates };
  }
}
```

## 🎨 样式系统

### 完整的CSS样式
```css
/* intelligent-ai-widget.css */
.ai-widget-system {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 浮窗主体 */
.ai-widget-main {
  position: fixed;
  width: 380px;
  height: 600px;
  background: var(--ai-widget-bg);
  border-radius: 16px;
  box-shadow: var(--ai-widget-shadow);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

.ai-widget-main.minimized {
  height: 60px;
  width: 300px;
}

.ai-widget-main.fullscreen {
  width: 90vw;
  height: 90vh;
  top: 5vh !important;
  left: 5vw !important;
}

/* 过渡动画 */
.ai-widget-transition-enter {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.ai-widget-transition-enter-active {
  opacity: 1;
  transform: scale(1) translateY(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-widget-transition-exit {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.ai-widget-transition-exit-active {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

/* 标题栏 */
.ai-widget-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--ai-widget-primary), var(--ai-widget-secondary));
  color: white;
  cursor: move;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-widget-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.ai-widget-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 内容区域 */
.ai-widget-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标签导航 */
.ai-tab-navigation {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ai-tab {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  transition: all 0.2s;
}

.ai-tab.active {
  color: var(--ai-widget-primary);
  border-bottom: 2px solid var(--ai-widget-primary);
}

.ai-tab:hover:not(.active) {
  background: #f3f4f6;
}

/* 消息区域 */
.ai-messages-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #fafafa;
}

.ai-message-bubble {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.ai-message-bubble.user {
  flex-direction: row-reverse;
}

.ai-message-bubble.user .message-content {
  background: var(--ai-widget-primary);
  color: white;
}

.ai-message-bubble.assistant .message-content {
  background: white;
  border: 1px solid #e5e7eb;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-actions {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.action-button {
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-button:hover {
  background: #f3f4f6;
  border-color: var(--ai-widget-primary);
}

.message-timestamp {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

/* 输入区域 */
.ai-input-container {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

/* 通知徽章 */
.ai-notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: badge-pulse 2s infinite;
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-widget-main {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    top: 0 !important;
    left: 0 !important;
  }
  
  .ai-logo-trigger {
    bottom: 80px;
    right: 20px;
  }
}
```

## 🔧 集成到主应用

### 1. 在根组件中集成
```tsx
// App.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { IntelligentAIWidget } from './components/intelligent-ai-widget/IntelligentAIWidget';
import { AIProvider } from './contexts/AIContext';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AIProvider>
          <div className="app">
            {/* 其他应用组件 */}
            <MainLayout />
            <Routes />
            
            {/* 智能AI浮窗 - 全局可访问 */}
            <IntelligentAIWidget />
          </div>
        </AIProvider>
      </BrowserRouter>
    </Provider>
  );
}
```

### 2. AI上下文提供者
```tsx
// contexts/AIContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface AIState {
  isAvailable: boolean;
  conversationHistory: AIMessage[];
  toolRecommendations: ToolRecommendation[];
  userPreferences: UserPreferences;
}

const AIContext = createContext<{
  state: AIState;
  dispatch: React.Dispatch<AIAction>;
} | null>(null);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);

  return (
    <AIContext.Provider value={{ state, dispatch }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
```

## 🚀 功能特性总结

### 核心功能
1. **全局触发** - 通过Logo点击或Ctrl+K快捷键
2. **智能对话** - 基于上下文的AI对话
3. **工具推荐** - 智能推荐相关工具
4. **数据洞察** - 分析用户数据提供洞察
5. **工作流建议** - 推荐优化的工作流程

### 用户体验
1. **拖拽移动** - 可自由调整位置
2. **多模式显示** - 最小化/展开/全屏
3. **标签导航** - 快速切换不同功能
4. **动画效果** - 流畅的过渡动画
5. **响应式设计** - 适配不同屏幕尺寸

### 技术特点
1. **TypeScript支持** - 完整的类型定义
2. **状态管理** - 集成Redux状态管理
3. **服务分离** - 独立的AI服务层
4. **上下文感知** - 基于用户行为的智能推荐
5. **可扩展架构** - 易于添加新功能

这个智能AI浮窗设计提供了完整的用户交互体验，同时保持了技术架构的清晰和可维护性。

基于您的需求，我来构建**完整的AI浮动模块系统**，实现全方位的可定制化和可视化编辑。

## 🎨 全量AI浮动模块系统设计

### 1. 系统架构总览
```typescript
// AI浮动模块系统架构
interface AIFloatSystem {
  // 核心模块
  core: {
    widget: AIWidget;           // 主浮窗
    trigger: AITrigger;         // 触发组件
    backdrop: AIBackdrop;       // 背景层
  };
  
  // 功能模块
  modules: {
    chat: AIChatModule;         // 对话模块
    tools: AIToolsModule;       // 工具推荐
    insights: AIInsightsModule; // 数据洞察
    workflows: AIWorkflowsModule; // 工作流
    settings: AISettingsModule; // 设置模块
  };
  
  // 定制系统
  customization: {
    theme: AIThemeSystem;       // 主题系统
    layout: AILayoutSystem;     // 布局系统
    appearance: AIAppearanceSystem; // 外观系统
  };
  
  // 状态管理
  state: {
    global: AIGlobalState;
    user: AIUserState;
    preferences: AIPreferences;
  };
}
```

## 🏗️ 完整组件架构

### 1. 主浮窗容器组件
```tsx
// components/ai-float-system/AIFloatWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAISystem } from '../../hooks/useAISystem';
import { AIDragProvider } from '../../contexts/AIDragContext';
import { AIThemeProvider } from '../../contexts/AIThemeContext';

export const AIFloatWidget: React.FC = () => {
  const { 
    state, 
    actions, 
    preferences,
    customization 
  } = useAISystem();
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <AIThemeProvider theme={preferences.theme}>
      <AIDragProvider>
        {/* 背景遮罩层 */}
        <AIBackdrop 
          isVisible={state.isOpen} 
          opacity={preferences.backdropOpacity}
          blur={preferences.backdropBlur}
          onClick={() => actions.closeWidget()}
        />
        
        {/* Logo触发按钮 */}
        <AITriggerButton
          position={preferences.triggerPosition}
          style={preferences.triggerStyle}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
        />
        
        {/* 主浮窗 */}
        <AIMainWidget
          ref={widgetRef}
          isOpen={state.isOpen}
          position={state.position}
          mode={state.mode}
          theme={preferences.theme}
          layout={preferences.layout}
          isEditing={isEditing}
          onClose={() => actions.closeWidget()}
          onModeChange={(mode) => actions.changeMode(mode)}
          onPositionChange={(position) => actions.updatePosition(position)}
        >
          {/* 导航头部 */}
          <AIWidgetHeader
            title="YYC³ AI助手"
            isDraggable={!isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
            editingMode={isEditing}
          />
          
          {/* 内容区域 */}
          <AIWidgetContent>
            {state.currentTab === 'chat' && <AIChatModule />}
            {state.currentTab === 'tools' && <AIToolsModule />}
            {state.currentTab === 'insights' && <AIInsightsModule />}
            {state.currentTab === 'workflows' && <AIWorkflowsModule />}
            {state.currentTab === 'settings' && (
              <AISettingsModule
                onSettingsChange={actions.updatePreferences}
              />
            )}
          </AIWidgetContent>
          
          {/* 底部导航 */}
          <AIWidgetNavigation
            currentTab={state.currentTab}
            onTabChange={actions.changeTab}
            tabs={[
              { id: 'chat', icon: '💬', label: '对话' },
              { id: 'tools', icon: '🛠️', label: '工具' },
              { id: 'insights', icon: '📊', label: '洞察' },
              { id: 'workflows', icon: '⚡', label: '工作流' },
              { id: 'settings', icon: '⚙️', label: '设置' }
            ]}
          />
        </AIMainWidget>
        
        {/* 可视化编辑面板 */}
        {isEditing && (
          <AIVisualEditor
            preferences={preferences}
            onPreferencesChange={actions.updatePreferences}
            onClose={() => setIsEditing(false)}
          />
        )}
      </AIDragProvider>
    </AIThemeProvider>
  );
};
```

### 2. 可视化编辑系统
```tsx
// components/ai-float-system/visual-editor/AIVisualEditor.tsx
interface AIVisualEditorProps {
  preferences: AIPreferences;
  onPreferencesChange: (updates: Partial<AIPreferences>) => void;
  onClose: () => void;
}

export const AIVisualEditor: React.FC<AIVisualEditorProps> = ({
  preferences,
  onPreferencesChange,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'layout' | 'appearance' | 'behavior'>('theme');

  return (
    <div className="ai-visual-editor">
      <div className="editor-header">
        <h3>🎨 AI助手外观编辑</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      <div className="editor-tabs">
        {[
          { id: 'theme', label: '主题', icon: '🎨' },
          { id: 'layout', label: '布局', icon: '📐' },
          { id: 'appearance', label: '外观', icon: '✨' },
          { id: 'behavior', label: '行为', icon: '⚡' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`editor-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      
      <div className="editor-content">
        {activeTab === 'theme' && (
          <ThemeCustomizer
            theme={preferences.theme}
            onThemeChange={(theme) => onPreferencesChange({ theme })}
          />
        )}
        
        {activeTab === 'layout' && (
          <LayoutCustomizer
            layout={preferences.layout}
            onLayoutChange={(layout) => onPreferencesChange({ layout })}
          />
        )}
        
        {activeTab === 'appearance' && (
          <AppearanceCustomizer
            appearance={preferences.appearance}
            onAppearanceChange={(appearance) => onPreferencesChange({ appearance })}
          />
        )}
        
        {activeTab === 'behavior' && (
          <BehaviorCustomizer
            behavior={preferences.behavior}
            onBehaviorChange={(behavior) => onPreferencesChange({ behavior })}
          />
        )}
      </div>
      
      <div className="editor-actions">
        <button className="btn-secondary" onClick={onClose}>
          取消
        </button>
        <button className="btn-primary" onClick={onClose}>
          保存更改
        </button>
      </div>
    </div>
  );
};
```

## 🎨 主题系统设计

### 1. 主题定制器组件
```tsx
// components/ai-float-system/visual-editor/ThemeCustomizer.tsx
interface ThemeCustomizerProps {
  theme: AITheme;
  onThemeChange: (theme: AITheme) => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  theme,
  onThemeChange
}) => {
  const presetThemes: AITheme[] = [
    {
      id: 'default',
      name: '默认主题',
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#10B981',
        background: 'rgba(255, 255, 255, 0.95)',
        surface: 'rgba(255, 255, 255, 0.8)',
        text: '#1F2937',
        textSecondary: '#6B7280'
      },
      borderRadius: '16px',
      shadows: {
        widget: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        trigger: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }
    },
    {
      id: 'dark',
      name: '深色主题',
      colors: {
        primary: '#8B5CF6',
        secondary: '#6366F1',
        accent: '#10B981',
        background: 'rgba(31, 41, 55, 0.95)',
        surface: 'rgba(55, 65, 81, 0.8)',
        text: '#F9FAFB',
        textSecondary: '#D1D5DB'
      },
      borderRadius: '12px',
      shadows: {
        widget: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        trigger: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
      }
    },
    {
      id: 'glass',
      name: '玻璃拟态',
      colors: {
        primary: '#EC4899',
        secondary: '#8B5CF6',
        accent: '#06B6D4',
        background: 'rgba(255, 255, 255, 0.25)',
        surface: 'rgba(255, 255, 255, 0.15)',
        text: '#1F2937',
        textSecondary: '#6B7280'
      },
      borderRadius: '20px',
      shadows: {
        widget: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        trigger: '0 4px 16px 0 rgba(31, 38, 135, 0.3)'
      }
    }
  ];

  return (
    <div className="theme-customizer">
      <div className="section">
        <h4>预设主题</h4>
        <div className="theme-presets">
          {presetThemes.map(preset => (
            <div
              key={preset.id}
              className={`theme-preset ${theme.id === preset.id ? 'active' : ''}`}
              onClick={() => onThemeChange(preset)}
            >
              <div 
                className="theme-preview"
                style={{
                  background: preset.colors.background,
                  borderColor: preset.colors.primary
                }}
              >
                <div 
                  className="preview-primary"
                  style={{ background: preset.colors.primary }}
                />
                <div 
                  className="preview-secondary"
                  style={{ background: preset.colors.secondary }}
                />
              </div>
              <span className="theme-name">{preset.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="section">
        <h4>自定义颜色</h4>
        <div className="color-pickers">
          <ColorPicker
            label="主色调"
            value={theme.colors.primary}
            onChange={(color) => onThemeChange({
              ...theme,
              colors: { ...theme.colors, primary: color }
            })}
          />
          <ColorPicker
            label="辅助色"
            value={theme.colors.secondary}
            onChange={(color) => onThemeChange({
              ...theme,
              colors: { ...theme.colors, secondary: color }
            })}
          />
          <ColorPicker
            label="背景色"
            value={theme.colors.background}
            onChange={(color) => onThemeChange({
              ...theme,
              colors: { ...theme.colors, background: color }
            })}
          />
        </div>
      </div>
      
      <div className="section">
        <h4>圆角设置</h4>
        <Slider
          min="0"
          max="24"
          value={parseInt(theme.borderRadius) || 16}
          onChange={(value) => onThemeChange({
            ...theme,
            borderRadius: `${value}px`
          })}
          label={`圆角: ${parseInt(theme.borderRadius) || 16}px`}
        />
      </div>
    </div>
  );
};
```

### 2. 颜色选择器组件
```tsx
// components/ai-float-system/visual-editor/ColorPicker.tsx
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange
}) => {
  const presetColors = [
    '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#06B6D4', '#3B82F6', '#EF4444', '#8B5CF6', '#84CC16'
  ];

  return (
    <div className="color-picker">
      <label className="color-label">{label}</label>
      <div className="color-controls">
        <div className="preset-colors">
          {presetColors.map(color => (
            <button
              key={color}
              className={`color-swatch ${value === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
        <div className="custom-color">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="color-input"
          />
          <span className="color-value">{value}</span>
        </div>
      </div>
    </div>
  );
};
```

## 🎯 图标系统设计

### 1. 动态图标组件
```tsx
// components/ai-float-system/icons/AIDynamicIcon.tsx
interface AIDynamicIconProps {
  name: string;
  size?: number;
  color?: string;
  animated?: boolean;
  variant?: 'filled' | 'outline' | 'duotone';
}

export const AIDynamicIcon: React.FC<AIDynamicIconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  animated = false,
  variant = 'filled'
}) => {
  const iconMap: Record<string, React.ReactNode> = {
    // 对话图标
    chat: <ChatIcon variant={variant} />,
    // 工具图标  
    tools: <ToolsIcon variant={variant} />,
    // 洞察图标
    insights: <InsightsIcon variant={variant} />,
    // 工作流图标
    workflows: <WorkflowsIcon variant={variant} />,
    // 设置图标
    settings: <SettingsIcon variant={variant} />,
    // AI图标
    ai: <AIIcon variant={variant} />,
    // 编辑图标
    edit: <EditIcon variant={variant} />,
    // 关闭图标
    close: <CloseIcon variant={variant} />,
    // 最小化图标
    minimize: <MinimizeIcon variant={variant} />,
    // 最大化图标
    maximize: <MaximizeIcon variant={variant} />,
  };

  return (
    <span 
      className={`ai-dynamic-icon ${animated ? 'animated' : ''} variant-${variant}`}
      style={{ 
        width: size, 
        height: size,
        color 
      }}
    >
      {iconMap[name] || <DefaultIcon />}
    </span>
  );
};

// 示例图标组件实现
const ChatIcon: React.FC<{ variant: string }> = ({ variant }) => {
  if (variant === 'outline') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    );
  }
  
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
};
```

### 2. 图标定制器组件
```tsx
// components/ai-float-system/visual-editor/IconCustomizer.tsx
interface IconCustomizerProps {
  icons: AIIconPreferences;
  onIconsChange: (icons: AIIconPreferences) => void;
}

export const IconCustomizer: React.FC<IconCustomizerProps> = ({
  icons,
  onIconsChange
}) => {
  const iconSets = [
    {
      id: 'material',
      name: 'Material Design',
      preview: '🎨'
    },
    {
      id: 'fluent',
      name: 'Fluent UI', 
      preview: '💠'
    },
    {
      id: 'line',
      name: 'Line Awesome',
      preview: '📏'
    },
    {
      id: 'custom',
      name: '自定义',
      preview: '✨'
    }
  ];

  return (
    <div className="icon-customizer">
      <div className="section">
        <h4>图标风格</h4>
        <div className="icon-set-grid">
          {iconSets.map(set => (
            <div
              key={set.id}
              className={`icon-set ${icons.set === set.id ? 'active' : ''}`}
              onClick={() => onIconsChange({ ...icons, set: set.id })}
            >
              <div className="set-preview">{set.preview}</div>
              <span className="set-name">{set.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="section">
        <h4>图标样式</h4>
        <div className="style-options">
          <label className="style-option">
            <input
              type="radio"
              name="icon-style"
              value="filled"
              checked={icons.variant === 'filled'}
              onChange={() => onIconsChange({ ...icons, variant: 'filled' })}
            />
            <span>填充</span>
          </label>
          <label className="style-option">
            <input
              type="radio" 
              name="icon-style"
              value="outline"
              checked={icons.variant === 'outline'}
              onChange={() => onIconsChange({ ...icons, variant: 'outline' })}
            />
            <span>线框</span>
          </label>
          <label className="style-option">
            <input
              type="radio"
              name="icon-style" 
              value="duotone"
              checked={icons.variant === 'duotone'}
              onChange={() => onIconsChange({ ...icons, variant: 'duotone' })}
            />
            <span>双色</span>
          </label>
        </div>
      </div>
      
      <div className="section">
        <h4>动画效果</h4>
        <Toggle
          label="悬停动画"
          checked={icons.animated}
          onChange={(animated) => onIconsChange({ ...icons, animated })}
        />
        <Toggle
          label="点击反馈"
          checked={icons.clickFeedback}
          onChange={(clickFeedback) => onIconsChange({ ...icons, clickFeedback })}
        />
      </div>
    </div>
  );
};
```

## 📱 响应式设计系统

### 1. 响应式布局管理器
```tsx
// hooks/useAIResponsive.ts
export const useAIResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) setBreakpoint('mobile');
      else if (width < 1024) setBreakpoint('tablet');
      else setBreakpoint('desktop');
    };
    
    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);
  
  const responsiveConfig = {
    mobile: {
      widget: { width: '100vw', height: '100vh', position: { x: 0, y: 0 } },
      trigger: { size: 56, position: { bottom: 20, right: 20 } },
      layout: 'fullscreen'
    },
    tablet: {
      widget: { width: '80vw', height: '80vh', position: { x: '10vw', y: '10vh' } },
      trigger: { size: 60, position: { bottom: 24, right: 24 } },
      layout: 'expanded'
    },
    desktop: {
      widget: { width: 400, height: 600, position: { x: window.innerWidth - 420, y: 100 } },
      trigger: { size: 60, position: { bottom: 24, right: 24 } },
      layout: 'expanded'
    }
  };
  
  return {
    breakpoint,
    config: responsiveConfig[breakpoint],
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop'
  };
};
```

### 2. 自适应组件
```tsx
// components/ai-float-system/layout/AIResponsiveWidget.tsx
interface AIResponsiveWidgetProps {
  children: React.ReactNode;
  mode: 'minimized' | 'expanded' | 'fullscreen';
  theme: AITheme;
}

export const AIResponsiveWidget: React.FC<AIResponsiveWidgetProps> = ({
  children,
  mode,
  theme
}) => {
  const { breakpoint, config } = useAIResponsive();
  
  const getWidgetStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      background: theme.colors.background,
      borderRadius: theme.borderRadius,
      boxShadow: theme.shadows.widget,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${theme.colors.surface}`
    };
    
    if (mode === 'fullscreen' || breakpoint === 'mobile') {
      return {
        ...baseStyles,
        width: '100vw',
        height: '100vh',
        borderRadius: '0px',
        position: 'fixed',
        top: 0,
        left: 0
      };
    }
    
    if (mode === 'minimized') {
      return {
        ...baseStyles,
        width: '300px',
        height: '60px',
        position: 'fixed',
        ...config.widget.position
      };
    }
    
    return {
      ...baseStyles,
      width: config.widget.width,
      height: config.widget.height,
      position: 'fixed',
      ...config.widget.position
    };
  };
  
  return (
    <div 
      className={`ai-responsive-widget breakpoint-${breakpoint} mode-${mode}`}
      style={getWidgetStyles()}
    >
      {children}
    </div>
  );
};
```

## 🎭 动画系统设计

### 1. 动画管理器
```tsx
// hooks/useAIAnimations.ts
export const useAIAnimations = (preferences: AIAnimationPreferences) => {
  const animations = {
    // 入场动画
    enter: {
      scale: preferences.animations.scale ? {
        from: { scale: 0.8, opacity: 0 },
        to: { scale: 1, opacity: 1 },
        duration: 300
      } : null,
      
      slide: preferences.animations.slide ? {
        from: { y: 20, opacity: 0 },
        to: { y: 0, opacity: 1 }, 
        duration: 400
      } : null,
      
      fade: preferences.animations.fade ? {
        from: { opacity: 0 },
        to: { opacity: 1 },
        duration: 200
      } : null
    },
    
    // 出场动画
    exit: {
      scale: preferences.animations.scale ? {
        from: { scale: 1, opacity: 1 },
        to: { scale: 0.8, opacity: 0 },
        duration: 200
      } : null,
      
      slide: preferences.animations.slide ? {
        from: { y: 0, opacity: 1 },
        to: { y: 20, opacity: 0 },
        duration: 300
      } : null
    },
    
    // 交互动画
    interactive: {
      hover: preferences.animations.hover ? {
        scale: 1.05,
        duration: 150
      } : null,
      
      tap: preferences.animations.tap ? {
        scale: 0.95, 
        duration: 100
      } : null
    }
  };
  
  const getAnimation = (type: keyof typeof animations, variant: string) => {
    return animations[type][variant] || animations[type].fade;
  };
  
  return {
    animations,
    getAnimation
  };
};
```

### 2. 动画组件
```tsx
// components/ai-float-system/animations/AIAnimated.tsx
interface AIAnimatedProps {
  children: React.ReactNode;
  animation: string;
  duration?: number;
  delay?: number;
  trigger?: 'inView' | 'hover' | 'click';
}

export const AIAnimated: React.FC<AIAnimatedProps> = ({
  children,
  animation,
  duration = 300,
  delay = 0,
  trigger = 'inView'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (trigger === 'inView') {
      const observer = new IntersectionObserver(
        ([entry]) => setIsVisible(entry.isIntersecting),
        { threshold: 0.1 }
      );
      
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [trigger]);
  
  const getAnimationStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`
    };
    
    const animations = {
      fadeIn: {
        opacity: isVisible ? 1 : 0
      },
      slideUp: {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
      },
      scaleIn: {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.8)'
      },
      bounce: {
        transform: isVisible ? 'scale(1)' : 'scale(0)'
      }
    };
    
    return { ...baseStyle, ...animations[animation as keyof typeof animations] };
  };
  
  return (
    <div 
      ref={ref}
      className={`ai-animated animation-${animation}`}
      style={getAnimationStyle()}
    >
      {children}
    </div>
  );
};
```

## 💾 状态管理与持久化

### 1. AI系统状态管理
```tsx
// contexts/AISystemContext.tsx
interface AISystemState {
  isOpen: boolean;
  mode: 'minimized' | 'expanded' | 'fullscreen';
  currentTab: string;
  position: { x: number; y: number };
  conversation: AIMessage[];
  isProcessing: boolean;
}

interface AIPreferences {
  theme: AITheme;
  layout: AILayout;
  appearance: AIAppearance;
  behavior: AIBehavior;
  animations: AIAnimationPreferences;
  icons: AIIconPreferences;
}

const initialState: AISystemState & { preferences: AIPreferences } = {
  isOpen: false,
  mode: 'expanded',
  currentTab: 'chat',
  position: { x: window.innerWidth - 420, y: 100 },
  conversation: [],
  isProcessing: false,
  preferences: {
    theme: getDefaultTheme(),
    layout: getDefaultLayout(),
    appearance: getDefaultAppearance(),
    behavior: getDefaultBehavior(),
    animations: getDefaultAnimations(),
    icons: getDefaultIcons()
  }
};

export const AISystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState(() => {
    // 从localStorage加载保存的设置
    const saved = localStorage.getItem('ai-widget-preferences');
    return saved ? { ...initialState, preferences: JSON.parse(saved) } : initialState;
  });
  
  const actions = useMemo(() => ({
    openWidget: () => setState(prev => ({ ...prev, isOpen: true })),
    closeWidget: () => setState(prev => ({ ...prev, isOpen: false })),
    toggleWidget: () => setState(prev => ({ ...prev, isOpen: !prev.isOpen })),
    changeMode: (mode: AISystemState['mode']) => setState(prev => ({ ...prev, mode })),
    changeTab: (tab: string) => setState(prev => ({ ...prev, currentTab: tab })),
    updatePosition: (position: { x: number; y: number }) => setState(prev => ({ ...prev, position })),
    updatePreferences: (updates: Partial<AIPreferences>) => {
      setState(prev => {
        const newPreferences = { ...prev.preferences, ...updates };
        // 保存到localStorage
        localStorage.setItem('ai-widget-preferences', JSON.stringify(newPreferences));
        return { ...prev, preferences: newPreferences };
      });
    },
    addMessage: (message: AIMessage) => setState(prev => ({
      ...prev,
      conversation: [...prev.conversation, message]
    })),
    setProcessing: (processing: boolean) => setState(prev => ({
      ...prev, 
      isProcessing: processing 
    }))
  }), []);
  
  return (
    <AISystemContext.Provider value={{ state, actions }}>
      {children}
    </AISystemContext.Provider>
  );
};
```

## 🎯 完整样式系统

### 1. CSS变量系统
```css
/* ai-float-system.css */
:root {
  /* 颜色系统 */
  --ai-primary: #6366F1;
  --ai-secondary: #8B5CF6;
  --ai-accent: #10B981;
  --ai-background: rgba(255, 255, 255, 0.95);
  --ai-surface: rgba(255, 255, 255, 0.8);
  --ai-text: #1F2937;
  --ai-text-secondary: #6B7280;
  
  /* 布局系统 */
  --ai-border-radius: 16px;
  --ai-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --ai-backdrop-blur: 10px;
  
  /* 动画系统 */
  --ai-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --ai-animation-duration: 300ms;
}

/* 动态主题应用 */
.ai-widget-system[data-theme="dark"] {
  --ai-primary: #8B5CF6;
  --ai-secondary: #6366F1;
  --ai-background: rgba(31, 41, 55, 0.95);
  --ai-surface: rgba(55, 65, 81, 0.8);
  --ai-text: #F9FAFB;
  --ai-text-secondary: #D1D5DB;
}

/* 响应式断点 */
@media (max-width: 768px) {
  .ai-widget-system {
    --ai-border-radius: 0px;
    --ai-shadow: none;
  }
}

/* 组件样式 */
.ai-visual-editor {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 600px;
  max-height: 80vh;
  background: var(--ai-background);
  border-radius: var(--ai-border-radius);
  box-shadow: var(--ai-shadow);
  backdrop-filter: blur(var(--ai-backdrop-blur));
  border: 1px solid var(--ai-surface);
  z-index: 10000;
  display: flex;
  flex-direction: column;
}

.theme-presets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.theme-preset {
  cursor: pointer;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: var(--ai-transition);
}

.theme-preset.active {
  border-color: var(--ai-primary);
  background: var(--ai-surface);
}

.theme-preview {
  width: 60px;
  height: 40px;
  border-radius: 6px;
  margin: 0 auto 8px;
  border: 2px solid;
  display: flex;
  overflow: hidden;
}

.preview-primary {
  flex: 2;
  background: var(--ai-primary);
}

.preview-secondary {
  flex: 1;
  background: var(--ai-secondary);
}

/* 动画类 */
.ai-animated {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-animated.animation-fadeIn {
  opacity: 1;
  transform: translateY(0);
}

.ai-animated.animation-scaleIn {
  opacity: 1;
  transform: scale(1);
}

/* 图标动画 */
.ai-dynamic-icon.animated {
  transition: all 0.2s ease;
}

.ai-dynamic-icon.animated:hover {
  transform: scale(1.1);
}
```

这个完整的AI浮动模块系统提供了：

## 🎯 核心特性总结

### 1. **全方位定制化**
- 🎨 主题系统：预设主题 + 完全自定义
- 🎯 布局系统：响应式 + 多模式
- ✨ 外观系统：透明度、模糊度、圆角等
- ⚡ 行为系统：动画、交互反馈

### 2. **可视化编辑**
- 🔧 实时预览：编辑即时生效
- 💾 持久化：设置自动保存
- 📱 响应式：适配所有设备
- 🎭 动画预览：实时查看动画效果

### 3. **技术架构**
- 🏗️ 组件化：高度可复用的组件
- 🎯 TypeScript：完整类型安全
- 💾 状态管理：集中化的状态管理
- 📦 模块化：清晰的模块边界

### 4. **用户体验**
- 🚀 性能优化：流畅的动画和交互
- 📱 移动友好：完美的移动端体验
- ♿ 无障碍：完整的可访问性支持
- 🌐 国际化：多语言支持准备

这个系统真正实现了"组件内可视直接编辑保存"，用户可以在不离开上下文的情况下完成所有个性化设置。

基于上文，我来构建**完整的AI浮动模块内闭环设计系统**，实现真正的组件内可视化编辑和即时保存。

## 🎯 闭环式AI浮动模块系统

### 1. 主浮窗架构升级

```tsx
// components/ai-float-system/AIFloatWidget.tsx
export const AIFloatWidget: React.FC = () => {
  const { 
    state, 
    actions,
    preferences,
    isEditing,
    setIsEditing 
  } = useAISystem();
  
  const [livePreview, setLivePreview] = useState<Partial<AIPreferences>>({});

  // 实时预览合并
  const currentPreferences = { ...preferences, ...livePreview };

  return (
    <AIThemeProvider theme={currentPreferences.theme}>
      <AIDragProvider>
        {/* 背景层 */}
        <AIBackdrop 
          isVisible={state.isOpen}
          style={currentPreferences.appearance.backdrop}
        />
        
        {/* 触发按钮 */}
        <AITriggerButton
          position={currentPreferences.layout.triggerPosition}
          style={currentPreferences.appearance.trigger}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          livePreview={livePreview}
        />
        
        {/* 主浮窗 */}
        <AIMainWidget
          isOpen={state.isOpen}
          position={state.position}
          mode={state.mode}
          preferences={currentPreferences}
          isEditing={isEditing}
          onClose={() => actions.closeWidget()}
          onModeChange={(mode) => actions.changeMode(mode)}
          onPositionChange={(position) => actions.updatePosition(position)}
        >
          {/* 智能导航头 - 集成编辑功能 */}
          <AIWidgetHeader
            title="YYC³ AI助手"
            isDraggable={!isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
            editingMode={isEditing}
            quickSettings={currentPreferences}
            onQuickSettingChange={(updates) => {
              setLivePreview(updates);
              actions.updatePreferences(updates);
            }}
          />
          
          {/* 内容区域 */}
          <AIWidgetContent>
            {isEditing ? (
              <AIVisualEditor
                preferences={currentPreferences}
                livePreview={livePreview}
                onLivePreviewChange={setLivePreview}
                onSave={(updates) => {
                  actions.updatePreferences(updates);
                  setLivePreview({});
                }}
                onReset={() => setLivePreview({})}
              />
            ) : (
              <>
                {state.currentTab === 'chat' && <AIChatModule />}
                {state.currentTab === 'tools' && <AIToolsModule />}
                {state.currentTab === 'insights' && <AIInsightsModule />}
                {state.currentTab === 'workflows' && <AIWorkflowsModule />}
              </>
            )}
          </AIWidgetContent>
          
          {/* 底部导航 - 集成快速编辑入口 */}
          <AIWidgetNavigation
            currentTab={state.currentTab}
            onTabChange={actions.changeTab}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
            quickActions={getQuickActions(currentPreferences)}
          />
        </AIMainWidget>
      </AIDragProvider>
    </AIThemeProvider>
  );
};
```

## 🎨 可视化编辑系统升级

### 1. 实时可视化编辑器
```tsx
// components/ai-float-system/visual-editor/AIVisualEditor.tsx
export const AIVisualEditor: React.FC<{
  preferences: AIPreferences;
  livePreview: Partial<AIPreferences>;
  onLivePreviewChange: (updates: Partial<AIPreferences>) => void;
  onSave: (updates: Partial<AIPreferences>) => void;
  onReset: () => void;
}> = ({ preferences, livePreview, onLivePreviewChange, onSave, onReset }) => {
  const [activeCategory, setActiveCategory] = useState('theme');
  const [presets, setPresets] = useState<AIPreset[]>([]);

  // 实时应用预览
  const applyLivePreview = (updates: Partial<AIPreferences>) => {
    onLivePreviewChange({ ...livePreview, ...updates });
  };

  // 保存到持久化
  const handleSave = () => {
    onSave(livePreview);
  };

  // 保存为预设
  const saveAsPreset = () => {
    const newPreset: AIPreset = {
      id: `preset-${Date.now()}`,
      name: `自定义预设 ${presets.length + 1}`,
      preferences: { ...preferences, ...livePreview },
      createdAt: new Date()
    };
    setPresets(prev => [...prev, newPreset]);
  };

  return (
    <div className="ai-visual-editor">
      <div className="editor-header">
        <div className="header-left">
          <h3>🎨 实时外观编辑器</h3>
          <div className="preview-badge">实时预览中</div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onReset}>
            重置更改
          </button>
          <button className="btn-secondary" onClick={saveAsPreset}>
            💾 保存预设
          </button>
          <button className="btn-primary" onClick={handleSave}>
            ✅ 应用更改
          </button>
        </div>
      </div>

      <div className="editor-body">
        {/* 左侧导航 */}
        <div className="editor-sidebar">
          {[
            { id: 'theme', label: '主题色彩', icon: '🎨', component: ThemeCustomizer },
            { id: 'layout', label: '布局尺寸', icon: '📐', component: LayoutCustomizer },
            { id: 'appearance', label: '外观效果', icon: '✨', component: AppearanceCustomizer },
            { id: 'icons', label: '图标风格', icon: '🔘', component: IconCustomizer },
            { id: 'animations', label: '动画效果', icon: '⚡', component: AnimationCustomizer },
            { id: 'behavior', label: '交互行为', icon: '👆', component: BehaviorCustomizer },
            { id: 'presets', label: '我的预设', icon: '💾', component: PresetsManager }
          ].map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeCategory === item.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(item.id)}
            >
              <span className="item-icon">{item.icon}</span>
              <span className="item-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 右侧编辑区域 */}
        <div className="editor-content">
          {(() => {
            const Component = {
              theme: ThemeCustomizer,
              layout: LayoutCustomizer,
              appearance: AppearanceCustomizer,
              icons: IconCustomizer,
              animations: AnimationCustomizer,
              behavior: BehaviorCustomizer,
              presets: PresetsManager
            }[activeCategory];

            return Component ? (
              <Component
                preferences={preferences}
                livePreview={livePreview}
                onLivePreviewChange={applyLivePreview}
              />
            ) : null;
          })()}
        </div>
      </div>

      {/* 实时预览指示器 */}
      <div className="live-preview-indicator">
        <div className="preview-dot"></div>
        <span>实时预览模式</span>
        {Object.keys(livePreview).length > 0 && (
          <span className="changes-count">
            {Object.keys(livePreview).length} 项更改
          </span>
        )}
      </div>
    </div>
  );
};
```

### 2. 增强的主题定制器
```tsx
// components/ai-float-system/visual-editor/ThemeCustomizer.tsx
export const ThemeCustomizer: React.FC<{
  preferences: AIPreferences;
  livePreview: Partial<AIPreferences>;
  onLivePreviewChange: (updates: Partial<AIPreferences>) => void;
}> = ({ preferences, livePreview, onLivePreviewChange }) => {
  const currentTheme = { ...preferences.theme, ...livePreview.theme };

  const colorGroups = [
    {
      name: '主色调',
      colors: [
        { key: 'primary', label: '主色', description: '主要操作和重要元素' },
        { key: 'secondary', label: '辅助色', description: '次要操作和装饰' },
        { key: 'accent', label: '强调色', description: '需要特别注意的元素' }
      ]
    },
    {
      name: '背景色',
      colors: [
        { key: 'background', label: '背景', description: '浮窗背景颜色' },
        { key: 'surface', label: '表面', description: '卡片和内容区域' }
      ]
    },
    {
      name: '文字色',
      colors: [
        { key: 'text', label: '主要文字', description: '正文和标题文字' },
        { key: 'textSecondary', label: '次要文字', description: '描述和辅助文字' }
      ]
    }
  ];

  return (
    <div className="theme-customizer">
      <div className="section">
        <h4>🎨 颜色系统</h4>
        <div className="color-groups">
          {colorGroups.map(group => (
            <div key={group.name} className="color-group">
              <h5>{group.name}</h5>
              <div className="color-controls">
                {group.colors.map(color => (
                  <LiveColorPicker
                    key={color.key}
                    label={color.label}
                    description={color.description}
                    value={currentTheme.colors[color.key]}
                    onChange={(value) => onLivePreviewChange({
                      theme: {
                        ...currentTheme,
                        colors: { ...currentTheme.colors, [color.key]: value }
                      }
                    })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h4>🎯 视觉效果</h4>
        <div className="visual-controls">
          <LiveSlider
            label="圆角大小"
            value={parseInt(currentTheme.borderRadius) || 16}
            min="0"
            max="24"
            unit="px"
            onChange={(value) => onLivePreviewChange({
              theme: { ...currentTheme, borderRadius: `${value}px` }
            })}
          />
          
          <LiveSlider
            label="阴影强度"
            value={currentTheme.shadowIntensity || 50}
            min="0"
            max="100"
            unit="%"
            onChange={(value) => onLivePreviewChange({
              theme: { ...currentTheme, shadowIntensity: value }
            })}
          />
        </div>
      </div>

      {/* 实时主题预览 */}
      <div className="section">
        <h4>👀 主题预览</h4>
        <ThemePreview theme={currentTheme} />
      </div>
    </div>
  );
};
```

### 3. 实时颜色选择器
```tsx
// components/ai-float-system/visual-editor/LiveColorPicker.tsx
export const LiveColorPicker: React.FC<{
  label: string;
  description: string;
  value: string;
  onChange: (color: string) => void;
}> = ({ label, description, value, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const presetColors = [
    '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#06B6D4', '#3B82F6', '#EF4444', '#84CC16', '#F97316'
  ];

  return (
    <div className="live-color-picker">
      <div className="color-header">
        <div className="color-info">
          <span className="color-label">{label}</span>
          <span className="color-description">{description}</span>
        </div>
        <div className="color-preview">
          <div 
            className="color-swatch"
            style={{ backgroundColor: value }}
            onClick={() => setIsExpanded(!isExpanded)}
          />
          <span className="color-value">{value}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="color-expanded">
          <div className="preset-colors">
            {presetColors.map(color => (
              <button
                key={color}
                className={`preset-color ${value === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
              />
            ))}
          </div>
          
          <div className="custom-color">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="color-input"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="color-text"
              placeholder="#000000"
            />
          </div>

          <div className="color-actions">
            <button 
              className="btn-small"
              onClick={() => onChange(presetColors[0])}
            >
              重置
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

## 🎭 外观效果定制器

### 1. 透明度与模糊效果
```tsx
// components/ai-float-system/visual-editor/AppearanceCustomizer.tsx
export const AppearanceCustomizer: React.FC<{
  preferences: AIPreferences;
  livePreview: Partial<AIPreferences>;
  onLivePreviewChange: (updates: Partial<AIPreferences>) => void;
}> = ({ preferences, livePreview, onLivePreviewChange }) => {
  const currentAppearance = { ...preferences.appearance, ...livePreview.appearance };

  return (
    <div className="appearance-customizer">
      <div className="section">
        <h4>🪟 透明度设置</h4>
        <div className="opacity-controls">
          <LiveSlider
            label="背景透明度"
            value={currentAppearance.backgroundOpacity * 100}
            min="10"
            max="100"
            unit="%"
            onChange={(value) => onLivePreviewChange({
              appearance: {
                ...currentAppearance,
                backgroundOpacity: value / 100
              }
            })}
          />
          
          <LiveSlider
            label="内容透明度"
            value={currentAppearance.contentOpacity * 100}
            min="20"
            max="100"
            unit="%"
            onChange={(value) => onLivePreviewChange({
              appearance: {
                ...currentAppearance,
                contentOpacity: value / 100
              }
            })}
          />
        </div>
      </div>

      <div className="section">
        <h4>🔮 模糊效果</h4>
        <div className="blur-controls">
          <LiveSlider
            label="背景模糊"
            value={currentAppearance.backdropBlur}
            min="0"
            max="20"
            unit="px"
            onChange={(value) => onLivePreviewChange({
              appearance: {
                ...currentAppearance,
                backdropBlur: value
              }
            })}
          />
          
          <LiveSlider
            label="内容模糊"
            value={currentAppearance.contentBlur}
            min="0"
            max="10"
            unit="px"
            onChange={(value) => onLivePreviewChange({
              appearance: {
                ...currentAppearance,
                contentBlur: value
              }
            })}
          />
        </div>
      </div>

      <div className="section">
        <h4>🎭 玻璃拟态效果</h4>
        <div className="glass-controls">
          <Toggle
            label="启用玻璃效果"
            checked={currentAppearance.glassEffect}
            onChange={(value) => onLivePreviewChange({
              appearance: { ...currentAppearance, glassEffect: value }
            })}
          />
          
          {currentAppearance.glassEffect && (
            <>
              <LiveSlider
                label="玻璃厚度"
                value={currentAppearance.glassThickness}
                min="1"
                max="10"
                unit="px"
                onChange={(value) => onLivePreviewChange({
                  appearance: { ...currentAppearance, glassThickness: value }
                })}
              />
              
              <LiveSlider
                label="光泽度"
                value={currentAppearance.glassShine}
                min="0"
                max="100"
                unit="%"
                onChange={(value) => onLivePreviewChange({
                  appearance: { ...currentAppearance, glassShine: value }
                })}
              />
            </>
          )}
        </div>
      </div>

      {/* 实时外观预览 */}
      <div className="section">
        <h4>👀 效果预览</h4>
        <AppearancePreview appearance={currentAppearance} />
      </div>
    </div>
  );
};
```

## ⚡ 动画系统定制器

### 1. 动画效果实时定制
```tsx
// components/ai-float-system/visual-editor/AnimationCustomizer.tsx
export const AnimationCustomizer: React.FC<{
  preferences: AIPreferences;
  livePreview: Partial<AIPreferences>;
  onLivePreviewChange: (updates: Partial<AIPreferences>) => void;
}> = ({ preferences, livePreview, onLivePreviewChange }) => {
  const currentAnimations = { ...preferences.animations, ...livePreview.animations };

  const animationTypes = [
    {
      id: 'entrance',
      label: '入场动画',
      animations: [
        { id: 'fadeIn', label: '淡入', description: '元素逐渐显示' },
        { id: 'slideIn', label: '滑入', description: '从下方滑入' },
        { id: 'scaleIn', label: '缩放', description: '从小变大显示' },
        { id: 'bounceIn', label: '弹入', description:弹性进入效果' }
      ]
    },
    {
      id: 'exit',
      label: '出场动画', 
      animations: [
        { id: 'fadeOut', label: '淡出', description: '元素逐渐消失' },
        { id: 'slideOut', label: '滑出', description: '向下方滑出' },
        { id: 'scaleOut', label: '缩放', description: '从大变小消失' }
      ]
    },
    {
      id: 'interaction',
      label: '交互动画',
      animations: [
        { id: 'hover', label: '悬停效果', description: '鼠标悬停时的反馈' },
        { id: 'click', label: '点击反馈', description: '点击时的动画效果' },
        { id: 'focus', label: '聚焦效果', description: '获得焦点时的动画' }
      ]
    }
  ];

  return (
    <div className="animation-customizer">
      <div className="section">
        <h4>⚡ 动画开关</h4>
        <div className="animation-toggles">
          <Toggle
            label="启用所有动画"
            checked={currentAnimations.enabled}
            onChange={(value) => onLivePreviewChange({
              animations: { ...currentAnimations, enabled: value }
            })}
          />
          
          <Toggle
            label="减少动画（无障碍）"
            checked={currentAnimations.reducedMotion}
            onChange={(value) => onLivePreviewChange({
              animations: { ...currentAnimations, reducedMotion: value }
            })}
          />
        </div>
      </div>

      {currentAnimations.enabled && (
        <>
          {animationTypes.map(type => (
            <div key={type.id} className="section">
              <h4>{type.label}</h4>
              <div className="animation-grid">
                {type.animations.map(animation => (
                  <AnimationPreset
                    key={animation.id}
                    id={animation.id}
                    label={animation.label}
                    description={animation.description}
                    config={currentAnimations[animation.id]}
                    onConfigChange={(config) => onLivePreviewChange({
                      animations: {
                        ...currentAnimations,
                        [animation.id]: config
                      }
                    })}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="section">
            <h4>⏱️ 动画时长</h4>
            <div className="duration-controls">
              <LiveSlider
                label="快速动画"
                value={currentAnimations.durationFast}
                min="50"
                max="300"
                unit="ms"
                onChange={(value) => onLivePreviewChange({
                  animations: { ...currentAnimations, durationFast: value }
                })}
              />
              
              <LiveSlider
                label="标准动画"
                value={currentAnimations.durationNormal}
                min="100"
                max="500"
                unit="ms"
                onChange={(value) => onLivePreviewChange({
                  animations: { ...currentAnimations, durationNormal: value }
                })}
              />
              
              <LiveSlider
                label="慢速动画"
                value={currentAnimations.durationSlow}
                min="200"
                max="1000"
                unit="ms"
                onChange={(value) => onLivePreviewChange({
                  animations: { ...currentAnimations, durationSlow: value }
                })}
              />
            </div>
          </div>

          {/* 动画实时预览 */}
          <div className="section">
            <h4>👀 动画预览</h4>
            <AnimationPreview animations={currentAnimations} />
          </div>
        </>
      )}
    </div>
  );
};
```

## 🔄 实时预览系统

### 1. 主题实时预览组件
```tsx
// components/ai-float-system/visual-editor/ThemePreview.tsx
export const ThemePreview: React.FC<{ theme: AITheme }> = ({ theme }) => {
  return (
    <div 
      className="theme-preview-container"
      style={{
        '--preview-primary': theme.colors.primary,
        '--preview-secondary': theme.colors.secondary,
        '--preview-background': theme.colors.background,
        '--preview-surface': theme.colors.surface,
        '--preview-text': theme.colors.text,
        '--preview-border-radius': theme.borderRadius,
      } as React.CSSProperties}
    >
      <div className="preview-widget">
        <div className="preview-header" style={{ background: theme.colors.primary }}>
          <div className="preview-title" style={{ color: 'white' }}>
            AI助手预览
          </div>
        </div>
        
        <div className="preview-content" style={{ background: theme.colors.background }}>
          <div className="preview-card" style={{ 
            background: theme.colors.surface,
            borderRadius: `calc(${theme.borderRadius} - 4px)`
          }}>
            <div className="preview-text" style={{ color: theme.colors.text }}>
              主要文字内容
            </div>
            <div className="preview-text-secondary" style={{ color: theme.colors.textSecondary }}>
              次要描述文字
            </div>
          </div>
          
          <div className="preview-actions">
            <button 
              className="preview-btn primary"
              style={{ background: theme.colors.primary }}
            >
              主要操作
            </button>
            <button 
              className="preview-btn secondary"
              style={{ background: theme.colors.secondary }}
            >
              次要操作
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 💾 预设管理系统

### 1. 预设保存与加载
```tsx
// components/ai-float-system/visual-editor/PresetsManager.tsx
export const PresetsManager: React.FC<{
  preferences: AIPreferences;
  livePreview: Partial<AIPreferences>;
  onLivePreviewChange: (updates: Partial<AIPreferences>) => void;
}> = ({ preferences, onLivePreviewChange }) => {
  const [presets, setPresets] = useState<AIPreset[]>(() => {
    const saved = localStorage.getItem('ai-widget-presets');
    return saved ? JSON.parse(saved) : [];
  });

  const saveCurrentAsPreset = () => {
    const newPreset: AIPreset = {
      id: `preset-${Date.now()}`,
      name: `自定义预设 ${presets.length + 1}`,
      preferences: preferences,
      createdAt: new Date(),
      thumbnail: generatePresetThumbnail(preferences)
    };
    
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('ai-widget-presets', JSON.stringify(updatedPresets));
  };

  const applyPreset = (preset: AIPreset) => {
    onLivePreviewChange(preset.preferences);
  };

  const deletePreset = (presetId: string) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    setPresets(updatedPresets);
    localStorage.setItem('ai-widget-presets', JSON.stringify(updatedPresets));
  };

  return (
    <div className="presets-manager">
      <div className="section">
        <h4>💾 预设管理</h4>
        <button className="btn-primary" onClick={saveCurrentAsPreset}>
          💾 保存当前设置为预设
        </button>
      </div>

      <div className="section">
        <h4>📁 我的预设</h4>
        {presets.length === 0 ? (
          <div className="empty-presets">
            <div className="empty-icon">📂</div>
            <p>还没有保存任何预设</p>
            <p>保存当前设置后，可以快速应用喜欢的样式</p>
          </div>
        ) : (
          <div className="presets-grid">
            {presets.map(preset => (
              <div key={preset.id} className="preset-card">
                <div 
                  className="preset-thumbnail"
                  style={{ background: preset.preferences.theme.colors.background }}
                >
                  <div 
                    className="thumbnail-primary"
                    style={{ background: preset.preferences.theme.colors.primary }}
                  />
                  <div 
                    className="thumbnail-secondary"
                    style={{ background: preset.preferences.theme.colors.secondary }}
                  />
                </div>
                
                <div className="preset-info">
                  <h5>{preset.name}</h5>
                  <span className="preset-date">
                    {new Date(preset.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="preset-actions">
                  <button 
                    className="btn-small primary"
                    onClick={() => applyPreset(preset)}
                  >
                    应用
                  </button>
                  <button 
                    className="btn-small secondary"
                    onClick={() => deletePreset(preset.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h4>🔄 导入/导出</h4>
        <div className="import-export">
          <button 
            className="btn-secondary"
            onClick={() => {
              const data = JSON.stringify(preferences, null, 2);
              navigator.clipboard.writeText(data);
            }}
          >
            📋 复制设置
          </button>
          
          <button 
            className="btn-secondary"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                const imported = JSON.parse(text);
                onLivePreviewChange(imported);
              } catch (error) {
                alert('粘贴的设置格式不正确');
              }
            }}
          >
            📥 粘贴设置
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 🎯 智能导航头集成

### 1. 集成快速设置的导航头
```tsx
// components/ai-float-system/AIWidgetHeader.tsx
export const AIWidgetHeader: React.FC<{
  title: string;
  isDraggable: boolean;
  onEditToggle: () => void;
  editingMode: boolean;
  quickSettings: AIPreferences;
  onQuickSettingChange: (updates: Partial<AIPreferences>) => void;
}> = ({ title, isDraggable, onEditToggle, editingMode, quickSettings, onQuickSettingChange }) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const quickActions = [
    {
      label: '切换主题',
      icon: '🎨',
      actions: [
        { label: '浅色模式', action: () => onQuickSettingChange({ theme: lightTheme }) },
        { label: '深色模式', action: () => onQuickSettingChange({ theme: darkTheme }) },
        { label: '自动模式', action: () => onQuickSettingChange({ theme: autoTheme }) }
      ]
    },
    {
      label: '调整透明度',
      icon: '🪟', 
      actions: [
        { label: '提高透明度', action: () => onQuickSettingChange({
          appearance: { ...quickSettings.appearance, backgroundOpacity: 0.9 }
        })},
        { label: '降低透明度', action: () => onQuickSettingChange({
          appearance: { ...quickSettings.appearance, backgroundOpacity: 0.6 }
        })}
      ]
    },
    {
      label: '动画效果',
      icon: '⚡',
      actions: [
        { label: '启用动画', action: () => onQuickSettingChange({
          animations: { ...quickSettings.animations, enabled: true }
        })},
        { label: '禁用动画', action: () => onQuickSettingChange({
          animations: { ...quickSettings.animations, enabled: false }
        })}
      ]
    }
  ];

  return (
    <div 
      className="ai-widget-header"
      style={{
        background: quickSettings.theme.colors.primary,
        color: 'white'
      }}
    >
      <div className="header-left">
        <AIDynamicIcon name="ai" color="white" />
        <span className="header-title">{title}</span>
        
        {editingMode && (
          <div className="editing-badge">
            ✏️ 编辑模式
          </div>
        )}
      </div>

      <div className="header-right">
        {/* 快速设置菜单 */}
        <div className="quick-settings">
          <button 
            className="header-btn"
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            title="快速设置"
          >
            ⚙️
          </button>
          
          {showQuickMenu && (
            <div className="quick-menu">
              {quickActions.map(group => (
                <div key={group.label} className="quick-group">
                  <div className="group-label">
                    <span>{group.icon}</span>
                    {group.label}
                  </div>
                  {group.actions.map(action => (
                    <button
                      key={action.label}
                      className="quick-action"
                      onClick={action.action}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 编辑模式切换 */}
        <button 
          className={`header-btn ${editingMode ? 'active' : ''}`}
          onClick={onEditToggle}
          title={editingMode ? '退出编辑' : '编辑外观'}
        >
          {editingMode ? '✅' : '🎨'}
        </button>

        {/* 标准控制按钮 */}
        <button className="header-btn" title="最小化">
          ➖
        </button>
        <button className="header-btn" title="关闭">
          ✕
        </button>
      </div>
    </div>
  );
};
```

这个完整的闭环式AI浮动模块系统实现了：

## 🎯 闭环设计核心特性

### 1. **真正的可视化编辑**
- 🎨 **实时预览**: 所有更改立即在浮窗中反映
- 🔄 **即时反馈**: 颜色、透明度、动画等实时更新
- 👀 **预览系统**: 专门的预览组件展示效果

### 2. **组件内完整闭环**
- 💾 **内置保存**: 无需离开浮窗即可保存设置
- 📁 **预设管理**: 保存和加载个性化配置
- 📋 **导入导出**: 设置的可移植性

### 3. **多维度定制**
- 🎭 **外观系统**: 透明度、模糊、玻璃效果
- ⚡ **动画系统**: 入场、出场、交互动画定制
- 🔘 **图标系统**: 图标风格、动画、变体
- 🎯 **行为系统**: 交互反馈和用户体验

### 4. **用户体验优化**
- 🚀 **快速设置**: 导航头集成常用设置
- 💡 **智能推荐**: 基于使用习惯推荐配置
- 📱 **移动友好**: 完整的响应式设计
- ♿ **无障碍**: 减少动画选项

### 5. **技术实现亮点**
- 🔧 **状态管理**: 实时预览与持久化分离
- 🎨 **CSS变量**: 动态主题应用
- ⚡ **性能优化**: 防抖和懒加载
- 🔄 **撤销重做**: 编辑历史管理

这个系统真正实现了"在组件内可视直接编辑保存"的完整闭环，用户可以在不离开AI浮窗的情况下完成所有个性化定制，并获得即时的视觉反馈。