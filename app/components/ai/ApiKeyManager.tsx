/**
 * @file API密钥管理组件
 * @description 管理不同AI提供商的API密钥配置
 * @component ApiKeyManager
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AIProvider } from '../../../services/ai-service/src/types';
import { useToast } from '@/components/ui/use-toast';

interface ApiKeyConfig {
  [key: string]: string;
}

interface ApiKeyManagerProps {
  apiKeys: ApiKeyConfig;
  onSaveApiKey: (provider: AIProvider, key: string) => Promise<void>;
  onTestApiKey: (provider: AIProvider, key: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  apiKeys,
  onSaveApiKey,
  onTestApiKey,
  isLoading
}) => {
  const { toast } = useToast();
  const [currentKeys, setCurrentKeys] = useState<ApiKeyConfig>(apiKeys);
  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } }>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);

  const handleKeyChange = (provider: AIProvider, value: string) => {
    setCurrentKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const handleSaveKey = async (provider: AIProvider) => {
    try {
      setSavingKey(provider);
      await onSaveApiKey(provider, currentKeys[provider] || '');
      toast({ title: `${provider} API 密钥保存成功`, variant: 'default' });
    } catch (error) {
      toast({ title: `${provider} API 密钥保存失败`, description: `${(error as Error).message}`, variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleTestKey = async (provider: AIProvider) => {
    try {
      setTestingKey(provider);
      const result = await onTestApiKey(provider, currentKeys[provider] || '');
      setTestResults(prev => ({
        ...prev,
        [provider]: result
      }));
      
      if (result.success) {
        toast({ title: `${provider} API 密钥测试通过`, variant: 'default' });
      } else {
        toast({ title: `${provider} API 密钥测试失败`, description: `${result.message}`, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: `${provider} API 密钥测试失败`, description: `${(error as Error).message}`, variant: 'destructive' });
    } finally {
      setTestingKey(null);
    }
  };

  const getProviderInfo = (provider: AIProvider) => {
    switch (provider) {
      case AIProvider.OPENAI:
        return {
          name: 'OpenAI',
          url: 'https://platform.openai.com/account/api-keys',
          helpText: '前往 OpenAI 平台获取 API 密钥。使用密钥前请确保你有足够的计费额度。',
          icon: '🤖',
          color: 'green'
        };
      case AIProvider.HUGGINGFACE:
        return {
          name: 'Hugging Face',
          url: 'https://huggingface.co/settings/tokens',
          helpText: '前往 Hugging Face 平台获取 API 密钥。一些模型可能需要特殊访问权限。',
          icon: '🤗',
          color: 'purple'
        };
      case AIProvider.LOCAL:
        return {
          name: '本地模型',
          url: '',
          helpText: '本地模型不需要 API 密钥，但需要确保模型已正确安装并可访问。',
          icon: '🏠',
          color: 'blue'
        };
      default:
        return {
          name: provider,
          url: '',
          helpText: '',
          icon: '🔑',
          color: 'gray'
        };
    }
  };

  // 移除未使用的getKeyDisplay函数

  const providers = [AIProvider.OPENAI, AIProvider.HUGGINGFACE, AIProvider.LOCAL];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">API 密钥管理</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            配置不同 AI 提供商的 API 密钥以启用相应功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200 dark:border-amber-800">
            <AlertTitle className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              安全提示
            </AlertTitle>
            <AlertDescription>
              API 密钥包含敏感信息，请妥善保管。密钥将以加密方式存储，仅用于 AI 服务调用。
            </AlertDescription>
          </Alert>

          <Tabs defaultValue={AIProvider.OPENAI} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              {providers.map(provider => {
                const info = getProviderInfo(provider);
                return (
                  <TabsTrigger
                    key={provider}
                    value={provider}
                    className="flex items-center gap-2"
                  >
                    <span>{info.icon}</span>
                    <span className="hidden sm:inline">{info.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {providers.map(provider => {
              const info = getProviderInfo(provider);
              const hasKey = !!apiKeys[provider];
              const testResult = testResults[provider];
              const isLocalModel = provider === AIProvider.LOCAL;

              return (
                <TabsContent key={provider} value={provider}>
                  <div className="space-y-4">
                    {info.url && (
                      <a
                        href={info.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="m10 13-2 2-5-5 5-5 2 2-3 3z"></path>
                          <path d="M17 13l2 2 5-5-5-5-2 2 3 3z"></path>
                          <path d="M17 11v6"></path>
                          <path d="M7 5v6"></path>
                        </svg>
                        前往 {info.name} 获取 API 密钥
                      </a>
                    )}

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {info.helpText}
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor={`api-key-${provider}`} className="text-sm font-medium">
                        {info.name} API 密钥
                      </Label>
                      <div className="relative">
                        {isLocalModel ? (
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                            本地模型不需要 API 密钥
                          </div>
                        ) : (
                          <div className="flex">
                            <Input
                              id={`api-key-${provider}`}
                              type={showKeys ? "text" : "password"}
                              value={currentKeys[provider] || ''}
                              onChange={(e) => handleKeyChange(provider, e.target.value)}
                              placeholder={`请输入 ${info.name} API 密钥`}
                              className="flex-1"
                              disabled={isLoading || savingKey === provider}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setShowKeys(!showKeys)}
                              className="ml-2 whitespace-nowrap"
                              disabled={isLoading}
                            >
                              {showKeys ? '隐藏' : '显示'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isLocalModel && (
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          className="flex-1"
                          onClick={() => handleSaveKey(provider)}
                          disabled={isLoading || !currentKeys[provider] || savingKey === provider}
                        >
                          {savingKey === provider ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                              <polyline points="16 6 12 2 8 6"></polyline>
                              <line x1="12" y1="2" x2="12" y2="15"></line>
                            </svg>
                          )}
                          保存密钥
                        </Button>
                        
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleTestKey(provider)}
                          disabled={isLoading || !currentKeys[provider] || testingKey === provider || savingKey === provider}
                        >
                          {testingKey === provider ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          )}
                          测试密钥
                        </Button>
                      </div>
                    )}

                    {testResult && (
                      <div className={`mt-3 p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
                        <div className="flex items-start">
                          {testResult.success ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                          )}
                          <p className="text-sm">{testResult.message}</p>
                        </div>
                      </div>
                    )}

                    {hasKey && !isLocalModel && !testResult && (
                      <div className="mt-3 text-sm text-green-600 dark:text-green-400">
                        API 密钥已设置，请点击测试按钮验证密钥有效性
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyManager;