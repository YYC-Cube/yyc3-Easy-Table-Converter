/**
 * @file 行业模块服务
 * @description 提供行业数据处理和扩展功能的统一接口
 * @module industries/services
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { IndustryType } from '../types';

export interface IndustryData {
  id: string;
  type: IndustryType;
  name: string;
  description: string;
  icon: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndustryConfig {
  type: IndustryType;
  name: string;
  description: string;
  icon: string;
  features: string[];
  tools: string[];
  plugins: string[];
  color: string;
}

export interface IndustryTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  action: string;
}

export interface IndustryPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface IndustryDashboard {
  title: string;
  description: string;
  metrics: DashboardMetric[];
  charts: ChartConfig[];
  tools: IndustryTool[];
}

export interface DashboardMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  data: any[];
  config: Record<string, any>;
}

export interface IndustryQuery {
  industryType: IndustryType;
  page?: number;
  pageSize?: number;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface IndustryResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class IndustryService {
  private static instance: IndustryService;
  private industries: Map<IndustryType, IndustryConfig> = new Map();
  private plugins: Map<string, IndustryPlugin> = new Map();

  private constructor() {
    this.initializeIndustries();
  }

  static getInstance(): IndustryService {
    if (!IndustryService.instance) {
      IndustryService.instance = new IndustryService();
    }
    return IndustryService.instance;
  }

  private initializeIndustries() {
    const defaultIndustries: IndustryConfig[] = [
      {
        type: IndustryType.RETAIL,
        name: '智慧零售',
        description: '零售行业销售数据分析与预测',
        icon: '🛍️',
        features: ['销售分析', '库存管理', '客户画像', '趋势预测'],
        tools: ['销售报表', '库存预警', '客户分析'],
        plugins: ['retail-analytics', 'inventory-manager'],
        color: '#FF6B6B'
      },
      {
        type: IndustryType.FOOD,
        name: '餐饮服务',
        description: '餐饮行业数据管理与分析平台',
        icon: '🍽️',
        features: ['菜品销售分析', '客流统计', '成本控制', '会员管理'],
        tools: ['销售分析', '成本分析'],
        plugins: ['food-analytics', 'customer-manager'],
        color: '#4ECDC4'
      },
      {
        type: IndustryType.URBAN,
        name: '智慧城市',
        description: '城市数据可视化与智能分析平台',
        icon: '🏙️',
        features: ['交通分析', '环境监测', '公共安全', '设施管理'],
        tools: ['交通报表', '环境监测', '事件管理'],
        plugins: ['urban-analytics', 'traffic-manager'],
        color: '#45B7D1'
      },
      {
        type: IndustryType.FINTECH,
        name: '金融科技',
        description: '金融数据分析与风险评估工具',
        icon: '💹',
        features: ['投资分析', '风险评估', '市场预测', '合规检查'],
        tools: ['投资报表', '风险评估', '市场分析'],
        plugins: ['fintech-analytics', 'risk-manager'],
        color: '#96CEB4'
      }
    ];

    defaultIndustries.forEach(industry => {
      this.industries.set(industry.type, industry);
    });
  }

  getAllIndustries(): IndustryConfig[] {
    return Array.from(this.industries.values());
  }

  getIndustryByType(type: IndustryType): IndustryConfig | undefined {
    return this.industries.get(type);
  }

  getIndustryTools(type: IndustryType): IndustryTool[] {
    const industry = this.industries.get(type);
    if (!industry) return [];

    return industry.tools.map((toolName, index) => ({
      id: `${type}-tool-${index}`,
      name: toolName,
      description: `${toolName}工具`,
      icon: '🔧',
      category: 'analytics',
      action: `/${type}/${toolName.toLowerCase().replace(/\s+/g, '-')}`
    }));
  }

  async getIndustryData(query: IndustryQuery): Promise<IndustryResponse<IndustryData[]>> {
    try {
      const { industryType, page = 1, pageSize = 20 } = query;
      
      const mockData: IndustryData[] = [];
      for (let i = 0; i < pageSize; i++) {
        mockData.push({
          id: `${industryType}-${page}-${i}`,
          type: industryType,
          name: `${this.industries.get(industryType)?.name || 'Unknown'} 数据 ${i + 1}`,
          description: '示例数据',
          icon: this.industries.get(industryType)?.icon || '📊',
          data: {
            value: Math.random() * 1000,
            timestamp: new Date().toISOString()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return {
        success: true,
        data: mockData,
        pagination: {
          page,
          pageSize,
          total: 1000,
          totalPages: Math.ceil(1000 / pageSize)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getIndustryDashboard(type: IndustryType): Promise<IndustryResponse<IndustryDashboard>> {
    try {
      const industry = this.industries.get(type);
      if (!industry) {
        return {
          success: false,
          error: 'Industry not found'
        };
      }

      const dashboard: IndustryDashboard = {
        title: industry.name,
        description: industry.description,
        metrics: [
          { id: 'total', name: '总数据量', value: 12345, unit: '条', trend: 'up', change: 12.5 },
          { id: 'active', name: '活跃用户', value: 2345, unit: '人', trend: 'up', change: 8.3 },
          { id: 'rate', name: '处理效率', value: 98.5, unit: '%', trend: 'stable', change: 0 }
        ],
        charts: [
          {
            id: 'trend',
            type: 'line',
            title: '趋势分析',
            data: [12, 19, 3, 5, 2, 3],
            config: {}
          },
          {
            id: 'distribution',
            type: 'pie',
            title: '数据分布',
            data: [12, 19, 3, 5, 2],
            config: {}
          }
        ],
        tools: this.getIndustryTools(type)
      };

      return {
        success: true,
        data: dashboard
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  registerPlugin(plugin: IndustryPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  unregisterPlugin(pluginId: string): void {
    this.plugins.delete(pluginId);
  }

  getPlugins(industryType?: IndustryType): IndustryPlugin[] {
    return Array.from(this.plugins.values()).filter(
      plugin => !industryType || plugin.enabled
    );
  }

  enablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = true;
    }
  }

  disablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = false;
    }
  }
}

export const industryService = IndustryService.getInstance();
export default industryService;
