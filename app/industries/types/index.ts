/**
 * @file 行业矩阵核心类型定义
 * @description 定义行业矩阵功能中使用的核心数据结构和接口
 * @module industries/types
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 * @updated 2024-11-20
 */

/**
 * 行业类型定义
 */
export enum IndustryType {
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  FINANCE = 'finance',
  SMARTCITY = 'smartcity',
  RETAIL = 'retail',
  MANUFACTURING = 'manufacturing',
  ENERGY = 'energy',
  MEDIA = 'media',
  CREATIVE = 'creative',
  LEGAL = 'legal',
  HUMANRESOURCE = 'humanresource'
}

/**
 * 行业信息接口
 */
export interface Industry {
  id: IndustryType;
  name: string;
  description: string;
  icon: string;
  color: string;
  tools: Tool[];
  order: number;
  tags: string[];
  highlights: string[];
}

/**
 * 工具类型定义
 */
export enum ToolType {
  ANALYTICS = 'analytics',
  CONVERSION = 'conversion',
  AI_ASSISTANT = 'ai_assistant',
  REPORT = 'report',
  MONITORING = 'monitoring',
  PREDICTION = 'prediction',
  OPTIMIZATION = 'optimization',
  GENERATION = 'generation',
  VALIDATION = 'validation',
  COMPLIANCE = 'compliance'
}

/**
 * 工具接口定义
 */
export interface Tool {
  id: string;
  name: string;
  description: string;
  industry: IndustryType;
  type: ToolType;
  icon: string;
  color: string;
  aiEnhanced: boolean;
  requiresAuth: boolean;
  priority?: number;
  parameters?: ToolParameter[];
  exampleInputs?: Record<string, any>[];
  relatedTools?: string[];
  apiEndpoint?: string;
  documentationUrl?: string;
}

/**
 * 工具参数接口
 */
export interface ToolParameter {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'file';
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
  validation?: string;
  maxLength?: number;
  minLength?: number;
  maxValue?: number;
  minValue?: number;
}

/**
 * 工具执行结果接口
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  timestamp: number;
  toolId: string;
  industry: IndustryType;
  logs?: string[];
}

/**
 * 跨行业协同请求接口
 */
export interface CrossIndustryRequest {
  workflowId: string;
  industryTools: IndustryToolStep[];
  sharedData: Record<string, any>;
  executionOptions?: ExecutionOptions;
}

/**
 * 行业工具执行步骤
 */
export interface IndustryToolStep {
  toolId: string;
  industry: IndustryType;
  parameters: Record<string, any>;
  dependsOn?: string[];
  dataMapping?: Record<string, string>;
}

/**
 * 执行选项
 */
export interface ExecutionOptions {
  timeout?: number;
  errorHandling: 'stop' | 'continue' | 'retry';
  maxRetries?: number;
  parallel?: boolean;
}

/**
 * 跨行业协同执行结果
 */
export interface CrossIndustryResult {
  workflowId: string;
  success: boolean;
  stepResults: StepResult[];
  finalOutput?: any;
  totalExecutionTime: number;
  startTimestamp: number;
  endTimestamp: number;
  errors?: WorkflowError[];
}

/**
 * 步骤执行结果
 */
export interface StepResult {
  stepId: string;
  toolId: string;
  industry: IndustryType;
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
}

/**
 * 工作流错误
 */
export interface WorkflowError {
  stepId: string;
  errorMessage: string;
  errorCode?: string;
  timestamp: number;
}
