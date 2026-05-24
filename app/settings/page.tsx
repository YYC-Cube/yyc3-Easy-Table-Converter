/**
 * @file 用户设置中心页面
 * @description 提供用户配置和个性化选项的设置中心
 * @module app/settings/page
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-12
 * @updated 2026-02-23
 */
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Slider } from '../../components/ui/slider';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../../components/ui/input';
import { Header } from '@/components/Header';
import { 
  Key, 
  Bot, 
  Sparkles, 
  Globe, 
  MessageCircle, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle,
  Settings2,
  Cpu
} from 'lucide-react';
import aiService from '@/lib/services/aiService';
import { 
  AISettings, 
  AIModelProvider, 
  AIModelType, 
  MODEL_NAME_MAP 
} from '@/lib/types/ai';

// 类型定义
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
  fontSize: number;
  autoSave: boolean;
  defaultProcessor: string;
}

const PROVIDERS: { value: AIModelProvider; label: string; icon: string }[] = [
  { value: 'openai', label: 'OpenAI', icon: '🤖' },
  { value: 'anthropic', label: 'Anthropic (Claude)', icon: '🧠' },
  { value: 'google', label: 'Google (Gemini)', icon: '🔵' },
  { value: 'custom', label: '自定义/国内模型', icon: '🌏' }
];

const MODELS: { value: AIModelType; label: string; provider: AIModelProvider }[] = [
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'openai' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'anthropic' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'anthropic' },
  { value: 'gemini-pro', label: 'Gemini Pro', provider: 'google' },
  { value: 'gemini-flash', label: 'Gemini Flash', provider: 'google' },
  { value: 'glm-4', label: 'GLM-4 (智谱)', provider: 'custom' },
  { value: 'glm-4-flash', label: 'GLM-4 Flash', provider: 'custom' },
  { value: 'qwen-turbo', label: '通义千问 Turbo', provider: 'custom' },
  { value: 'qwen-plus', label: '通义千问 Plus', provider: 'custom' },
  { value: 'ERNIE-4', label: '文心一言 4.0', provider: 'custom' },
  { value: 'ERNIE-3.5', label: '文心一言 3.5', provider: 'custom' },
  { value: 'Spark', label: '讯飞星火', provider: 'custom' }
];

/**
 * @description 用户设置中心页面组件
 */
export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  // 用户偏好设置状态
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: theme,
    notifications: true,
    language: 'zh-CN',
    fontSize: 16,
    autoSave: true,
    defaultProcessor: 'batch',
  });

  // AI设置状态
  const [aiSettings, setAiSettings] = useState<AISettings>(aiService.getSettings());
  const [showApiKey, setShowApiKey] = useState<Record<AIModelProvider, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
    azure: false,
    custom: false
  });
  const [activeProvider, setActiveProvider] = useState<AIModelProvider>('openai');
  const [testingApiKey, setTestingApiKey] = useState(false);

  useEffect(() => {
    setAiSettings(aiService.getSettings());
  }, []);

  const handleSaveAiSettings = () => {
    aiService.updateSettings(aiSettings);
    toast({
      title: '设置已保存',
      description: 'AI配置已更新',
    });
  };

  const handleApiKeyChange = (provider: AIModelProvider, value: string) => {
    setAiSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [provider]: value }
    }));
  };

  const handleBaseUrlChange = (provider: AIModelProvider, value: string) => {
    setAiSettings(prev => ({
      ...prev,
      baseUrls: { ...prev.baseUrls, [provider]: value }
    }));
  };

  const testApiKey = async () => {
    setTestingApiKey(true);
    try {
      const response = await aiService.complete({
        model: aiSettings.defaultModel,
        messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: new Date() }]
      });
      toast({
        title: 'API连接成功',
        description: `模型响应正常: ${response.content.substring(0, 50)}...`,
      });
    } catch (error) {
      toast({
        title: 'API连接失败',
        description: error instanceof Error ? error.message : '请检查API Key配置',
        variant: 'destructive',
      });
    } finally {
      setTestingApiKey(false);
    }
  };

  // 保存设置
  const saveSettings = () => {
    // 保存到localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    // 应用主题设置
    setTheme(preferences.theme);
    // 这里可以添加保存成功的提示
    alert('设置已保存！');
  };

  // 重置设置
  const resetSettings = () => {
    const defaultSettings: UserPreferences = {
      theme: 'system',
      notifications: true,
      language: 'zh-CN',
      fontSize: 16,
      autoSave: true,
      defaultProcessor: 'batch',
    };
    setPreferences(defaultSettings);
    localStorage.setItem('userPreferences', JSON.stringify(defaultSettings));
    setTheme('system');
    alert('设置已重置为默认值！');
  };

  // 更新设置
  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 max-w-4xl pt-20 pb-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">用户设置中心</h1>
          <p className="text-muted-foreground">自定义您的应用体验和偏好设置</p>
        </header>

        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="appearance">外观</TabsTrigger>
            <TabsTrigger value="ai">AI配置</TabsTrigger>
            <TabsTrigger value="behavior">行为</TabsTrigger>
            <TabsTrigger value="about">关于</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>主题设置</CardTitle>
                <CardDescription>自定义应用的视觉外观</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="theme">主题模式</Label>
                    <p className="text-sm text-muted-foreground mt-1">选择应用的显示主题</p>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={preferences.theme}
                      onValueChange={(value) => updatePreference('theme', value as 'light' | 'dark' | 'system')}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="选择主题">
                          {preferences.theme === 'light' ? '浅色模式' : preferences.theme === 'dark' ? '深色模式' : '跟随系统'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">浅色模式</SelectItem>
                        <SelectItem value="dark">深色模式</SelectItem>
                        <SelectItem value="system">跟随系统</SelectItem>
                      </SelectContent>
                    </Select>
                    <ThemeToggle />
                  </div>
                </div>

                <Separator />

                <div className="py-2">
                  <Label htmlFor="fontSize">字体大小: {preferences.fontSize}px</Label>
                  <p className="text-sm text-muted-foreground mt-1">调整应用的默认字体大小</p>
                  <div className="mt-3">
                    <Slider
                      id="fontSize"
                      min={12}
                      max={24}
                      step={1}
                      value={[preferences.fontSize]}
                      onValueChange={(value) => updatePreference('fontSize', value[0])}
                      className="my-6"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>小 (12px)</span>
                      <span>中 (16px)</span>
                      <span>大 (24px)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI模型配置
                </CardTitle>
                <CardDescription>配置AI服务API Key，支持OpenAI/Claude/Gemini/国内模型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  {PROVIDERS.map((provider) => (
                    <Button
                      key={provider.value}
                      variant={activeProvider === provider.value ? 'default' : 'outline'}
                      onClick={() => setActiveProvider(provider.value)}
                      className="gap-2"
                    >
                      <span>{provider.icon}</span>
                      {provider.label}
                    </Button>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showApiKey[activeProvider] ? 'text' : 'password'}
                          placeholder={`输入 ${PROVIDERS.find(p => p.value === activeProvider)?.label} API Key`}
                          value={aiSettings.apiKeys[activeProvider]}
                          onChange={(e) => handleApiKeyChange(activeProvider, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKey(prev => ({ ...prev, [activeProvider]: !prev[activeProvider] }))}
                        >
                          {showApiKey[activeProvider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={testApiKey}
                        disabled={testingApiKey || !aiSettings.apiKeys[activeProvider]}
                      >
                        {testingApiKey ? '测试中...' : '测试'}
                      </Button>
                    </div>
                  </div>

                  {activeProvider === 'custom' && (
                    <div className="space-y-2">
                      <Label>自定义API地址</Label>
                      <Input
                        placeholder="https://api.example.com/v1"
                        value={aiSettings.baseUrls.custom}
                        onChange={(e) => handleBaseUrlChange('custom', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">用于国内模型或其他自定义API</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label>默认模型</Label>
                    <Select
                      value={aiSettings.defaultModel}
                      onValueChange={(value) => setAiSettings(prev => ({ ...prev, defaultModel: value as AIModelType }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="选择默认模型">
                          {MODEL_NAME_MAP[aiSettings.defaultModel]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS.filter(m => m.provider === activeProvider).map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Temperature (温度): {aiSettings.temperature}</Label>
                      <Slider
                        value={[aiSettings.temperature]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={(value) => setAiSettings(prev => ({ ...prev, temperature: value[0] }))}
                      />
                      <p className="text-xs text-muted-foreground">值越高越有创造性，越低越确定性</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Tokens: {aiSettings.maxTokens}</Label>
                      <Slider
                        value={[aiSettings.maxTokens]}
                        min={256}
                        max={8192}
                        step={256}
                        onValueChange={(value) => setAiSettings(prev => ({ ...prev, maxTokens: value[0] }))}
                      />
                      <p className="text-xs text-muted-foreground">单次回复最大token数</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>系统提示词</Label>
                    <Input
                      value={aiSettings.systemPrompt}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      placeholder="你是一个有用的AI助手..."
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>启用流式输出</Label>
                      <p className="text-sm text-muted-foreground">实时显示AI回复内容</p>
                    </div>
                    <Switch
                      checked={aiSettings.enableStream}
                      onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, enableStream: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        启用AI浮窗客服
                      </Label>
                      <p className="text-sm text-muted-foreground">在页面右下角显示AI客服入口</p>
                    </div>
                    <Switch
                      checked={aiSettings.enableFloatingChat}
                      onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, enableFloatingChat: checked }))}
                    />
                  </div>

                  {aiSettings.enableFloatingChat && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>浮窗位置</Label>
                        <p className="text-sm text-muted-foreground">选择浮窗显示位置</p>
                      </div>
                      <Select
                        value={aiSettings.floatingChatPosition}
                        onValueChange={(value) => setAiSettings(prev => ({ ...prev, floatingChatPosition: value as 'bottom-right' | 'bottom-left' }))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue>
                            {aiSettings.floatingChatPosition === 'bottom-right' ? '右下角' : '左下角'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom-right">右下角</SelectItem>
                          <SelectItem value="bottom-left">左下角</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveAiSettings}>
                    保存AI配置
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>行为设置</CardTitle>
                <CardDescription>自定义应用的功能行为和交互方式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="autoSave">自动保存</Label>
                    <p className="text-sm text-muted-foreground mt-1">自动保存您的输入和设置更改</p>
                  </div>
                  <Switch
                    id="autoSave"
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => updatePreference('autoSave', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="notifications">通知提醒</Label>
                    <p className="text-sm text-muted-foreground mt-1">接收操作完成和错误的通知提醒</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={preferences.notifications}
                    onCheckedChange={(checked) => updatePreference('notifications', checked)}
                  />
                </div>

                <Separator />

                <div className="py-2">
                  <Label htmlFor="language">语言设置</Label>
                  <p className="text-sm text-muted-foreground mt-1">选择应用界面语言</p>
                  <div className="mt-2">
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => updatePreference('language', value)}
                    >
                      <SelectTrigger id="language" className="w-[180px]">
                        <SelectValue placeholder="选择语言">
                          {preferences.language === 'zh-CN' ? '简体中文' : 'English'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh-CN">简体中文</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="py-2">
                  <Label htmlFor="defaultProcessor">默认处理器模式</Label>
                  <p className="text-sm text-muted-foreground mt-1">选择工具默认的处理模式</p>
                  <div className="mt-2">
                    <Select
                      value={preferences.defaultProcessor}
                      onValueChange={(value) => updatePreference('defaultProcessor', value)}
                    >
                      <SelectTrigger id="defaultProcessor" className="w-[180px]">
                        <SelectValue placeholder="选择模式">
                          {preferences.defaultProcessor === 'batch' ? '批量处理' : '单条处理'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="batch">批量处理</SelectItem>
                        <SelectItem value="single">单条处理</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>关于应用</CardTitle>
                <CardDescription>YYC³ Easy Table Converter 信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>应用名称</Label>
                  <p className="text-sm text-foreground font-medium">YYC³ Easy Table Converter</p>
                </div>
                <div className="space-y-2">
                  <Label>版本号</Label>
                  <p className="text-sm text-foreground font-medium">1.0.0</p>
                </div>
                <div className="space-y-2">
                  <Label>开发者</Label>
                  <p className="text-sm text-foreground font-medium">YYC Team</p>
                </div>
                <Separator />
                <Alert variant="default">
                  <AlertTitle>更新日志</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>新增批量处理功能</li>
                      <li>添加主题切换支持</li>
                      <li>优化用户界面体验</li>
                      <li>修复已知问题</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="secondary" onClick={resetSettings}>
            恢复默认设置
          </Button>
          <Button onClick={saveSettings}>
            保存设置
          </Button>
        </div>
      </div>
    </div>
  );
}
