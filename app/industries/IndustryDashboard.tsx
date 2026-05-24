/**
 * @file 行业导航仪表板页面
 * @description 行业矩阵功能的核心导航系统页面
 * @module industries/IndustryDashboard
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 * @updated 2024-11-20
 */

import React, { useState } from 'react';
import { IndustryNavigation } from './components/IndustryNavigation';
import { IndustryDetail } from './components/IndustryDetail';
import { ToolExecutionService } from './services/toolExecutionService';
import { IndustryType, Tool } from './types/index';

// 定义参数类型接口
interface Parameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | string;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  minValue?: number;
  maxValue?: number;
  step?: number;
  maxLength?: number;
}

interface ExecutionResult {
  success: boolean;
  error?: string;
  data?: any;
  executionTime: number;
  timestamp: number;
}

interface IndustryDashboardProps {
  initialIndustry?: IndustryType;
  className?: string;
}

/**
 * 行业仪表板页面 - 行业矩阵功能的核心导航系统
 */
export const IndustryDashboard: React.FC<IndustryDashboardProps> = ({
  initialIndustry = IndustryType.AGRICULTURE,
  className = ''
}) => {
  const [currentIndustry, setCurrentIndustry] = useState<IndustryType>(initialIndustry);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isToolPanelOpen, setIsToolPanelOpen] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [toolParameters, setToolParameters] = useState<Record<string, any>>({});

  /**
   * 处理行业切换
   */
  const handleIndustryChange = (industry: IndustryType) => {
    setCurrentIndustry(industry);
    setSelectedTool(null);
    setIsToolPanelOpen(false);
    setExecutionResult(null);
  };

  /**
   * 处理工具选择
   */
  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    setIsToolPanelOpen(true);
    setExecutionResult(null);
    
    // 初始化工具参数
    const initialParams: Record<string, any> = {};
    tool.parameters?.forEach((param: Parameter) => {
      initialParams[param.id] = param.defaultValue;
    });
    setToolParameters(initialParams);
  };

  /**
   * 处理参数变化
   */
  const handleParameterChange = (paramId: string, value: any) => {
    setToolParameters(prev => ({
      ...prev,
      [paramId]: value
    }));
  };

  /**
   * 执行工具
   */
  const executeTool = async () => {
    if (!selectedTool) return;
    
    setIsExecuting(true);
    setExecutionResult(null);
    
    try {
      const toolService = new ToolExecutionService();
      const result: any = await toolService.executeTool(
        selectedTool.id,
        toolParameters
      );
      
      setExecutionResult(result);
    } catch (error: unknown) {
      console.error('工具执行错误:', error);
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : '工具执行失败',
        executionTime: 0,
        timestamp: Date.now()
      });
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * 渲染工具参数表单
   */
  const renderParameterForm = () => {
    if (!selectedTool || !selectedTool.parameters || selectedTool.parameters.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          此工具无需参数，点击下方按钮直接执行
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {selectedTool.parameters.map((param: Parameter) => (
          <div key={param.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {param.name}
              {param.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <div className="relative">
              {param.type === 'string' && param.options && param.options.length > 0 ? (
                // 下拉选择
                <select
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={toolParameters[param.id] || ''}
                  onChange={(e) => handleParameterChange(param.id, e.target.value)}
                >
                  <option value="">请选择...</option>
                  {param.options.map((option: { value: string; label: string }) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : param.type === 'string' ? (
                // 文本输入
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={param.placeholder || `请输入${param.name}`}
                  value={toolParameters[param.id] || ''}
                  onChange={(e) => handleParameterChange(param.id, e.target.value)}
                  maxLength={param.maxLength}
                />
              ) : param.type === 'number' ? (
                // 数字输入
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={param.placeholder || `请输入${param.name}`}
                  value={toolParameters[param.id] ?? ''}
                  onChange={(e) => handleParameterChange(param.id, e.target.value ? Number(e.target.value) : undefined)}
                  min={param.minValue}
                  max={param.maxValue}
                  step={param.step || 1}
                />
              ) : param.type === 'boolean' ? (
                // 布尔开关
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={param.id}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={Boolean(toolParameters[param.id])}
                    onChange={(e) => handleParameterChange(param.id, e.target.checked)}
                  />
                  <label htmlFor={param.id} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {param.description || ''}
                  </label>
                </div>
              ) : (
                // 其他类型
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={param.placeholder || `请输入${param.name}`}
                  value={toolParameters[param.id] || ''}
                  onChange={(e) => handleParameterChange(param.id, e.target.value)}
                />
              )}
            </div>
            {param.description && param.type !== 'boolean' && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {param.description}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  /**
   * 渲染工具执行结果
   */
  const renderExecutionResult = () => {
    if (!executionResult) return null;
    
    if (executionResult.success) {
      return (
        <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <span className="text-green-500 text-xl mr-2">✓</span>
            <h4 className="font-semibold text-green-800 dark:text-green-400">执行成功</h4>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            执行时间: {executionResult.executionTime}ms
          </div>
          <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
            <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-60">
              {JSON.stringify(executionResult.data, null, 2)}
            </pre>
          </div>
        </div>
      );
    } else {
      return (
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <span className="text-red-500 text-xl mr-2">✗</span>
            <h4 className="font-semibold text-red-800 dark:text-red-400">执行失败</h4>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300">
            {executionResult.error}
          </p>
        </div>
      );
    }
  };

  /**
   * 渲染工具面板
   */
  const renderToolPanel = () => {
    if (!isToolPanelOpen || !selectedTool) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={() => setIsToolPanelOpen(false)}>
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 p-4 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <ToolPanel
            tool={selectedTool}
            onClose={() => setIsToolPanelOpen(false)}
            parameterForm={renderParameterForm()}
            executionResult={renderExecutionResult()}
            isExecuting={isExecuting}
            onExecute={executeTool}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`industry-dashboard ${className} min-h-screen bg-gray-50 dark:bg-gray-900/50`}>
      {/* 页面标题 */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">行业矩阵导航系统</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            探索多行业AI增强工具，助力业务增长
          </p>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="container mx-auto py-6 px-4">
        {/* 行业导航 */}
        <section className="mb-8">
          <IndustryNavigation
            currentIndustry={currentIndustry}
            onIndustryChange={handleIndustryChange}
          />
        </section>

        {/* 主要内容网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 行业详情和工具列表 - 占据2/3宽度 */}
          <div className="lg:col-span-2">
            <IndustryDetail
              industryId={currentIndustry}
              onToolSelect={handleToolSelect}
            />
          </div>

          {/* 工具执行面板 - 桌面端显示在右侧 */}
          <div className="hidden lg:block">
            {selectedTool ? (
              <ToolPanel
                tool={selectedTool}
                parameterForm={renderParameterForm()}
                executionResult={renderExecutionResult()}
                isExecuting={isExecuting}
                onExecute={executeTool}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                <div className="text-gray-400 text-4xl mb-4">⚙️</div>
                <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-2">工具执行面板</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  从左侧选择一个工具来开始
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 移动端工具面板 */}
      {renderToolPanel()}

      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 px-4 mt-12">
        <div className="container mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            YYC³ EasyVizAI 平台 © 2024 - 行业矩阵功能核心导航系统
          </p>
        </div>
      </footer>
    </div>
  );
};

// 工具面板组件
interface ToolPanelProps {
  tool: Tool;
  parameterForm: React.ReactNode;
  executionResult: React.ReactNode;
  isExecuting: boolean;
  onExecute: () => void;
  onClose?: () => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({
  tool,
  parameterForm,
  executionResult,
  isExecuting,
  onExecute,
  onClose
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white">{tool.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {tool.type}
          </p>
        </div>
        {onClose && (
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {tool.description}
        </div>
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">参数设置</h4>
          {parameterForm}
        </div>
        <button
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${(
            isExecuting
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700'
          )}`}
          onClick={onExecute}
          disabled={isExecuting}
        >
          {isExecuting ? '执行中...' : `执行 ${tool.name}`}
        </button>
        {executionResult}
      </div>
    </div>
  );
};

/**
 * 默认导出
 */
export default IndustryDashboard;