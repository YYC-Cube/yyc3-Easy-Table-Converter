/**
 * @file 模型选择组件
 * @description 提供AI模型选择和参数配置功能
 * @component ModelSelection
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AIModelConfig, AIProvider } from '../../../services/ai-service/src/types';

interface ModelParameters {
  temperature: number;
  maxTokens: number;
}

interface ModelSelectionProps {
  availableModels: AIModelConfig[];
  selectedModel: string;
  modelParameters: ModelParameters;
  onModelChange: (modelId: string) => void;
  onParametersChange: (params: ModelParameters) => void;
  isLoading: boolean;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({
  availableModels,
  selectedModel,
  modelParameters,
  onModelChange,
  onParametersChange,
  isLoading
}) => {
  const selectedModelConfig = availableModels.find(model => model.id === selectedModel);

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

  const getModelTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'text': '文本',
      'image': '图像',
      'data': '数据',
      'multi': '多模态'
    };
    return typeMap[type] || type;
  };

  const getModelCapabilities = (capabilities: string[]) => {
    const capMap: { [key: string]: string } = {
      'text': '文本处理',
      'image': '图像处理',
      'data': '数据分析',
      'classify': '分类',
      'detect': '检测',
      'summarize': '总结',
      'translate': '翻译'
    };
    return capabilities.map(cap => capMap[cap] || cap).join(', ');
  };

  const formatCost = (costPerToken?: number) => {
    if (!costPerToken || costPerToken === 0) return '免费';
    return `$${(costPerToken * 1000).toFixed(4)} / 1K tokens`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">默认模型选择</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            选择将用于所有AI功能的默认模型
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedModel} onValueChange={onModelChange} disabled={isLoading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择AI模型" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {availableModels.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <span className="font-medium">{model.name}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getProviderBadgeColor(model.provider)}`}>
                        {model.provider.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedModelConfig && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">类型：</span>
                  <span className="font-medium">{getModelTypeLabel(selectedModelConfig.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">提供商：</span>
                  <span>{selectedModelConfig.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">最大输入：</span>
                  <span>{selectedModelConfig.maxInputSize} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">价格：</span>
                  <span>{formatCost(selectedModelConfig.costPerToken)}</span>
                </div>
                <div className="md:col-span-2 mt-2">
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">功能：</span>
                  <span>{getModelCapabilities(selectedModelConfig.capabilities)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">模型参数设置</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            调整AI模型的行为和性能参数
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature" className="text-sm font-medium">
                创造性 (Temperature)
              </Label>
              <span className="text-sm text-gray-500">{modelParameters.temperature.toFixed(2)}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Slider
                      id="temperature"
                      min={0}
                      max={2}
                      step={0.01}
                      value={[modelParameters.temperature]}
                      onValueChange={(value) => onParametersChange({
                        ...modelParameters,
                        temperature: value[0]
                      })}
                      disabled={isLoading}
                      className="w-full"
                    />
                    <div className="absolute top-full left-0 mt-1 flex justify-between w-full text-xs text-gray-500">
                      <span>精确</span>
                      <span>平衡</span>
                      <span>创造性</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>控制响应的随机性。较低的值使输出更加确定性和精确，较高的值使输出更加创造性和多样化。</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxTokens" className="text-sm font-medium">
                最大响应长度 (Max Tokens)
              </Label>
              <span className="text-sm text-gray-500">{modelParameters.maxTokens}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Slider
                      id="maxTokens"
                      min={512}
                      max={4096}
                      step={512}
                      value={[modelParameters.maxTokens]}
                      onValueChange={(value) => onParametersChange({
                        ...modelParameters,
                        maxTokens: value[0]
                      })}
                      disabled={isLoading}
                      className="w-full"
                    />
                    <div className="absolute top-full left-0 mt-1 flex justify-between w-full text-xs text-gray-500">
                      <span>短</span>
                      <span>中</span>
                      <span>长</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>控制生成响应的最大令牌数。较高的值允许更长的响应，但可能增加处理时间和成本。</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="advanced-settings" />
            <Label htmlFor="advanced-settings" className="text-sm">
              显示高级设置
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelSelection;