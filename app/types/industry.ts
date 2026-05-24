/**
 * @file 行业数据模型和标签系统类型定义
 * @description 定义行业矩阵功能相关的TypeScript接口和类型
 * @module types/industry
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */

import { Identifiable, Timestamped } from './common';

/**
 * 行业分类枚举
 */
export enum IndustryCategory {
  // 核心行业
  FOOD = 'food', // 餐饮服务
  URBAN = 'urban', // 智慧城市
  RETAIL = 'retail', // 智慧零售
  EDUCATION = 'education', // 教育服务
  MEDICAL = 'medical', // 医疗健康
  FINTECH = 'fintech', // 金融科技
  TOURISM = 'tourism', // 旅游出行
  
  // 扩展行业
  ENERGY = 'energy', // 能源管理
  MANUFACTURING = 'manufacturing', // 智能制造
  REALESTATE = 'realestate', // 房地产
  LOGISTICS = 'logistics', // 物流运输
  CULTURE = 'culture', // 文化传媒
  SPORTS = 'sports', // 体育健身
  AUTO = 'auto', // 汽车服务
  
  // 专业服务
  LEGAL = 'legal', // 法律服务
  HR = 'hr', // 人力资源
  CONSULTING = 'consulting', // 管理咨询
  DESIGN = 'design', // 设计创意
  
  // 新兴领域
  AI = 'ai', // AI实验室
  METAVERSE = 'metaverse', // 元宇宙
  GREEN = 'green', // 绿色生态
  
  // 工具中心
  TOOLS = 'tools' // 工具中心
}

/**
 * 功能标签接口
 */
export interface FeatureTag extends Identifiable, Timestamped {
  name: string; // 标签名称
  description: string; // 标签描述
  icon: string; // 标签图标
  color: string; // 标签颜色
  category: string; // 标签分类
  isActive: boolean; // 是否激活
  usageCount: number; // 使用次数
}

/**
 * 行业信息接口
 */
export interface IndustryInfo extends Identifiable, Timestamped {
  category: IndustryCategory; // 行业分类
  name: string; // 行业名称
  description: string; // 行业描述
  icon: string; // 行业图标
  color: string; // 行业主色调
  secondaryColor: string; // 行业辅助色
  accentColor: string; // 行业强调色
  features: string[]; // 功能列表
  tags: string[]; // 标签ID列表
  priority: number; // 优先级
  isActive: boolean; // 是否激活
  toolsCount: number; // 工具数量
  usersCount: number; // 使用用户数
  coverImage: string; // 封面图片
  headerImage: string; // 头部图片
}

/**
 * 行业工具接口
 */
export interface IndustryTool extends Identifiable, Timestamped {
  name: string; // 工具名称
  description: string; // 工具描述
  industryId: string; // 所属行业ID
  icon: string; // 工具图标
  thumbnail: string; // 缩略图
  url: string; // 工具链接
  type: 'internal' | 'external'; // 工具类型
  status: 'draft' | 'published' | 'archived'; // 状态
  features: FeatureItem[]; // 功能特性
  parameters: ToolParameter[]; // 参数配置
  usageCount: number; // 使用次数
  rating: number; // 评分
  tags: string[]; // 标签ID列表
  seoKeywords: string[]; // SEO关键词
  documentationUrl: string; // 文档链接
  isPremium: boolean; // 是否付费
}

/**
 * 功能特性项接口
 */
export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  isHighlight: boolean;
}

/**
 * 工具参数接口
 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: Record<string, any>;
}

/**
 * 行业看板数据接口
 */
export interface IndustryDashboard {
  industryId: string;
  industryName: string;
  tools: IndustryTool[];
  recentActivity: Activity[];
  statistics: {
    totalTools: number;
    activeUsers: number;
    dailyUsage: number;
    satisfactionRate: number;
    growthRate: number;
  };
  popularTags: Array<{ tagId: string; name: string; usageCount: number }>;
}

/**
 * 活动记录接口
 */
export interface Activity extends Identifiable, Timestamped {
  type: 'tool_used' | 'user_joined' | 'tool_created' | 'tool_updated' | 'system';
  userId: string;
  relatedId: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * 行业导航项接口
 */
export interface IndustryNavigationItem {
  id: string;
  category: IndustryCategory;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
  hasNewContent: boolean;
  subItems?: IndustryNavigationItem[];
}

/**
 * 搜索过滤参数接口
 */
export interface IndustrySearchParams {
  query?: string;
  industry?: IndustryCategory[];
  tags?: string[];
  isActive?: boolean;
  sortBy?: 'name' | 'usageCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * AI增强配置接口
 */
export interface IndustryAIAugmentation {
  industryId: string;
  enabledFeatures: {
    smartSuggestions: boolean;
    contentGeneration: boolean;
    dataAnalysis: boolean;
    predictiveInsights: boolean;
    workflowAutomation: boolean;
  };
  promptTemplates: Array<{
    id: string;
    name: string;
    template: string;
    usageCount: number;
  }>;
  contextVariables: Record<string, string>;
  modelPreferences: {
    textModel: string;
    imageModel: string;
    embeddingModel: string;
  };
}

/**
 * 用户行业偏好接口
 */
export interface UserIndustryPreference {
  userId: string;
  preferredIndustries: string[];
  recentlyUsedTools: string[];
  favoriteTools: string[];
  customSettings: Record<string, any>;
  notificationPreferences: Record<string, boolean>;
}

/**
 * 行业数据映射接口
 */
export interface IndustryDataMapping {
  industryId: string;
  dataFields: Array<{
    sourceField: string;
    targetField: string;
    transformation?: string;
    type: string;
    required: boolean;
    defaultValue?: any;
  }>;
  validationRules: Record<string, any>;
  sampleData: any[];
}
