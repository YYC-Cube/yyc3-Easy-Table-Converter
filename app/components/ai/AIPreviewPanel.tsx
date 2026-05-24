/**
 * @file AI预览面板组件
 * @description 提供AI功能实时预览和测试
 * @component AIPreviewPanel
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
// Avatar组件未使用，已移除
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Tooltip组件未使用，已移除
import { AIModelConfig, AIProvider } from '../../../services/ai-service/src/types';
import { useToast } from '@/components/ui/use-toast';

interface AIPreviewPanelProps {
  availableModels: AIModelConfig[];
  selectedModel: string;
  onPreviewSubmit: (type: 'text' | 'image' | 'data', input: string, modelId: string) => Promise<string>;
  isLoading: boolean;
}

const AIPreviewPanel: React.FC<AIPreviewPanelProps> = ({
  availableModels,
  selectedModel,
  onPreviewSubmit,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'text'>('text');
  const [textInput, setTextInput] = useState<string>('请输入需要分析或转换的文本内容...');
  const [previewModel, setPreviewModel] = useState<string>(selectedModel);
  const [previewResult, setPreviewResult] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const { toast } = useToast();

  const getProviderBadgeColor = (provider: AIProvider) => {
    switch (provider) {
      case AIProvider.OPENAI:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case AIProvider.HUGGINGFACE:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case AIProvider.LOCAL:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '📝';
      case 'image':
        return '🖼️';
      case 'data':
        return '📊';
      case 'multi':
        return '🔄';
      default:
        return '🤖';
    }
  };

  // 根据输入类型过滤可用模型
  const getAvailableModelsByType = (): AIModelConfig[] => {
    return availableModels.filter(model => model.type === 'text');
  };

  const handlePreview = async () => {
    try {
      setProcessing(true);
      let input = '';
      
      switch (activeTab) {
        case 'text':
          input = textInput;
          break;
      }

      if (!input.trim()) {
        toast({ title: '提示', description: '请输入内容后再预览', variant: 'destructive' });
        return;
      }

      const result = await onPreviewSubmit(activeTab, input, previewModel);
      setPreviewResult(result);
    } catch (error) {
      toast({ title: '处理失败', description: (error as Error).message, variant: 'destructive' });
      setPreviewResult(`错误：${(error as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleTabChange = () => {
    setActiveTab('text'); // 始终保持为text选项卡
    // 切换标签时，更新可用的模型列表并选择第一个可用模型
    const models = getAvailableModelsByType();
    if (models.length > 0) {
      setPreviewModel(models[0].id);
    }
    setPreviewResult('');
  };

  // 获取示例提示词
  const getExamplePrompts = (): string[] => {
    return [
      '请总结这篇文章的主要观点',
      '将这段文本翻译成英文',
      '帮我润色这段文字',
      '提取关键信息',
      '生成一个简短的故事',
    ];
  };

  const availableModelsForType = getAvailableModelsByType();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">功能预览</CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">
          测试和预览AI功能的实时效果
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <span>📝</span>
                  <span className="hidden sm:inline">文本处理</span>
                </TabsTrigger>
              </TabsList>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Label htmlFor="preview-model" className="text-sm font-medium">
                  选择模型
                </Label>
                <Select 
                  value={previewModel} 
                  onValueChange={setPreviewModel}
                  disabled={isLoading || processing || availableModelsForType.length === 0}
                >
                  <SelectTrigger id="preview-model" className="w-64">
                    <SelectValue placeholder="选择AI模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModelsForType.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <span className="mr-2">{getModelTypeIcon(model.type)}</span>
                            <span className="font-medium">{model.name}</span>
                          </div>
                          <Badge className={getProviderBadgeColor(model.provider)}>
                            {model.provider}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handlePreview}
                disabled={isLoading || processing || availableModelsForType.length === 0}
                className="whitespace-nowrap"
              >
                {processing ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 2v6h-6"></path>
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M3 22v-6h6"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  </svg>
                )}
                开始预览
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">输入内容</Label>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="请输入需要分析或处理的文本内容..."
                  className="min-h-[150px]"
                  disabled={isLoading || processing}
                />


            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">示例提示：</p>
              <div className="flex flex-wrap gap-2">
                {getExamplePrompts().map((prompt, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setTextInput(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">预览结果</Label>
                {previewResult && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(previewResult);
                      toast({ title: '复制成功', description: '结果已复制到剪贴板', variant: 'default' });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                      <path d="M4 16V4a2 2 0 0 1 2-2h10"></path>
                    </svg>
                    复制
                  </Button>
                )}
              </div>
              <div className="min-h-[200px] p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                {processing ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="animate-spin h-8 w-8 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500">AI 正在处理中，请稍候...</p>
                  </div>
                ) : previewResult ? (
                  <div className="whitespace-pre-wrap text-sm">
                    {previewResult}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-30">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" x2="12.01" y1="17" y2="17"></line>
                    </svg>
                    <p>预览结果将显示在这里</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIPreviewPanel;