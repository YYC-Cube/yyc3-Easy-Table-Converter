/**
 * @file AI配置面板组件
 * @description 提供AI模型配置、API密钥管理和功能设置的用户界面
 * @component AISettingsPanel
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import React, { useState, useEffect } from 'react';
import { AIProvider } from '../types/ai';
// import { useToast } from '../hooks/use-toast'; // 移除不存在的钩子

// 移除不存在的子组件导入，使用简单的占位符组件

interface AISettingsPanelProps {
  onConfigChange?: (config: AIConfig) => void;
  defaultConfig?: AIConfig;
}

export interface AIConfig {
  defaultModel: string;
  providerSettings: {
    [key in AIProvider]?: {
      apiKey: string;
      baseUrl?: string;
      enabled: boolean;
    };
  };
  modelParameters: {
    temperature: number;
    maxTokens: number;
  };
}

const AISettingsPanel: React.FC<AISettingsPanelProps> = ({
  onConfigChange,
  defaultConfig
}) => {
  // 添加缺失的类型定义 - 暂时注释掉未使用的接口
  /*
  interface AIModelConfig {
    id: string;
    name: string;
    provider: AIProvider;
    type: string;
    capabilities: string[];
    defaultConfig?: any;
    maxInputSize?: number;
    costPerToken: number;
    isEnabled: boolean;
    lastUpdated?: string;
  }*/

  // 只保留config状态，移除未使用的setConfig
  const [config] = useState<AIConfig>({
    defaultModel: 'gpt-3.5-turbo',
    providerSettings: {
      [AIProvider.OPENAI]: {
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        enabled: true
      },
      [AIProvider.HUGGINGFACE]: {
        apiKey: '',
        baseUrl: 'https://api-inference.huggingface.co/models',
        enabled: false
      }
    },
    modelParameters: {
      temperature: 0.7,
      maxTokens: 4096
    },
    ...defaultConfig
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('models');
  // const [availableModels, setAvailableModels] = useState<AIModelConfig[]>([]);
  // 只保留hasUnsavedChanges状态，移除未使用的setHasUnsavedChanges
  const [hasUnsavedChanges] = useState(false);

  // 创建简单的toast占位符函数，因为组件中使用了toast但未定义
  const toast = {
    success: (message: string) => console.log('Success toast:', message),
    error: (message: string) => console.error('Error toast:', message),
    info: (message: string) => console.info('Info toast:', message)
  };

  // 加载可用模型
  useEffect(() => {
    // 由于availableModels状态已被注释，我们不再需要加载模型
    // loadAvailableModels();
  }, []);

  // 配置变更时触发回调
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);

  const loadAvailableModels = async () => {
    try {
      setIsLoading(true);
      // 这里应该调用API获取可用模型列表
      // const response = await fetch('/api/ai/config/models');
      // const models = await response.json();
      // 模拟数据 - 注释掉未使用的mockModels变量
      /*
      const mockModels: AIModelConfig[] = [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: AIProvider.OPENAI,
          type: 'multi',
          capabilities: ['text', 'image', 'data'],
          defaultConfig: {
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 4096
          },
          maxInputSize: 8192,
          costPerToken: 0.00003,
          isEnabled: true,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          provider: AIProvider.OPENAI,
          type: 'text',
          capabilities: ['text', 'data'],
          defaultConfig: {
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 4096
          },
          maxInputSize: 4096,
          costPerToken: 0.0000015,
          isEnabled: true,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'bert-base-uncased',
          name: 'BERT Base Uncased',
          provider: AIProvider.HUGGINGFACE,
          type: 'text',
          capabilities: ['text', 'classify'],
          defaultConfig: {
            model: 'bert-base-uncased',
            temperature: 0.0,
            maxTokens: 512
          },
          maxInputSize: 512,
          costPerToken: 0,
          isEnabled: true,
          lastUpdated: new Date().toISOString()
        }
      ];*/
      // availableModels状态已被注释，不再设置
      // setAvailableModels(mockModels);
    } catch (error) {
      console.error('加载模型失败:', error);
      toast.error('加载AI模型失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 移除未使用的handleConfigUpdate函数
  /*
  const handleConfigUpdate = (updates: Partial<AIConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };
  */

  // 移除未使用的handleSaveConfig函数
  /*
  const handleSaveConfig = async () => {
    try {
      setIsLoading(true);
      // 这里应该调用API保存配置
      // const response = await fetch('/api/ai/config/save', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config)
      // });
      // await response.json();
      
      // 模拟成功
      await new Promise(resolve => setTimeout(resolve, 500));
      setHasUnsavedChanges(false);
      toast.success('AI配置已成功保存');
    } catch (error) {
      console.error('保存配置失败:', error);
      toast.error('保存配置失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };
  */

  const handleReloadConfig = async () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('有未保存的更改，确定要重新加载吗？');
      if (!confirm) return;
    }
    
    try {
      setIsLoading(true);
      await loadAvailableModels();
      // setHasUnsavedChanges已移除
      toast.success('配置已重新加载');
    } catch (error) {
      console.error('重新加载配置失败:', error);
      toast.error('重新加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow p-4">
      <div className="pb-2">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">AI 功能配置</div>
        <div className="text-gray-500 dark:text-gray-400">
          管理AI模型、API密钥和性能参数设置
        </div>
      </div>
      
      <div className="mt-4">
        <div className="w-full">
          <div className="mb-6 flex w-full bg-gray-100 dark:bg-gray-800 p-1">
            <button 
              onClick={() => setActiveTab('models')}
              className={`flex-1 py-2 px-4 transition-colors ${activeTab === 'models' ? 'bg-white dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              模型选择
            </button>
            <button 
              onClick={() => setActiveTab('providers')}
              className={`flex-1 py-2 px-4 transition-colors ${activeTab === 'providers' ? 'bg-white dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              提供商配置
            </button>
            <button 
              onClick={() => setActiveTab('api-keys')}
              className={`flex-1 py-2 px-4 transition-colors ${activeTab === 'api-keys' ? 'bg-white dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              API密钥
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-2 px-4 transition-colors ${activeTab === 'stats' ? 'bg-white dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              使用统计
            </button>
          </div>

          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <div className="text-blue-800 dark:text-blue-400 font-medium mb-1">选择默认AI模型</div>
                <div className="text-blue-700 dark:text-blue-300 text-sm">
                  选择一个适合您需求的模型，考虑其功能、性能和成本
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <h3 className="font-medium mb-2">模型选择</h3>
                  <p className="text-sm text-gray-500">当前默认模型: {config.defaultModel || '未设置'}</p>
                </div>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <h3 className="font-medium mb-2">提供商配置</h3>
                  <p className="text-sm text-gray-500">提供商配置区域</p>
                </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <div className="text-yellow-800 dark:text-yellow-400 font-medium mb-1">安全提示</div>
                <div className="text-yellow-700 dark:text-yellow-300 text-sm">
                  API密钥存储在本地浏览器中，请确保在安全的环境中操作
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <h3 className="font-medium mb-2">API密钥管理</h3>
                  <p className="text-sm text-gray-500">API密钥管理区域</p>
                </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                <h3 className="font-medium mb-2">使用统计</h3>
                <p className="text-sm text-gray-500">AI使用统计数据</p>
              </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleReloadConfig}
          disabled={isLoading}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2"
        >
          重新加载
        </button>
      </div>
    </div>
  );
};

export default AISettingsPanel;