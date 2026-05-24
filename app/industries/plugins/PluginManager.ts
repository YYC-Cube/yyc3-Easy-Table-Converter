/**
 * @file 插件管理器
 * @description 实现行业工具插件系统的插件管理功能
 * @module industries/plugins/PluginManager
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 * @updated 2024-11-20
 */

import { IndustryType, Tool, ToolExecutionResult } from '../types/index';
import { PluginBase, PluginContext, PluginModule } from './PluginBase';

/**
 * 插件管理配置
 */
export interface PluginManagerConfig {
  /** 是否自动加载所有插件 */
  autoLoad?: boolean;
  /** 是否自动启用所有插件 */
  autoEnable?: boolean;
  /** 插件路径 */
  pluginPaths?: string[];
}

/**
 * 插件状态信息
 */
export interface PluginInfo {
  /** 插件ID */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description: string;
  /** 是否已初始化 */
  initialized: boolean;
  /** 是否已启用 */
  enabled: boolean;
  /** 支持的行业类型 */
  supportedIndustries: IndustryType[];
  /** 提供的工具数量 */
  toolCount: number;
  /** 插件优先级 */
  priority: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 插件管理器
 * 负责管理所有行业工具插件的注册、加载、初始化和执行
 */
export class PluginManager {
  /** 插件配置 */
  private readonly config: PluginManagerConfig;
  /** 已注册的插件实例 */
  private readonly plugins: Map<string, PluginBase>;
  /** 已注册的插件模块 */
  private readonly pluginModules: Map<string, PluginModule>;
  /** 插件工具映射 */
  private readonly toolMap: Map<string, { pluginId: string; tool: Tool }>;
  /** 插件上下文 */
  private readonly pluginContext: PluginContext;
  /** 是否已初始化 */
  private isInitialized: boolean = false;

  /**
   * 构造函数
   * @param config 插件管理配置
   */
  constructor(config: PluginManagerConfig = {}) {
    this.config = {
      autoLoad: true,
      autoEnable: true,
      pluginPaths: [],
      ...config,
    };

    this.plugins = new Map();
    this.pluginModules = new Map();
    this.toolMap = new Map();

    // 创建插件上下文
    this.pluginContext = this.createPluginContext();
  }

  /**
   * 初始化插件管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.log('info', '插件管理器初始化...');

    // 如果配置了自动加载，则加载所有插件
    if (this.config.autoLoad) {
      await this.loadPlugins();
    }

    this.isInitialized = true;
    this.log('info', '插件管理器初始化完成');
  }

  /**
   * 注册插件模块
   * @param pluginModule 插件模块
   */
  registerPluginModule(pluginModule: PluginModule): boolean {
    try {
      const { config } = pluginModule;
      
      if (this.pluginModules.has(config.id)) {
        this.log('warn', `插件 ${config.id} 已注册，跳过`);
        return false;
      }

      this.pluginModules.set(config.id, pluginModule);
      this.log('info', `插件模块 ${config.name} (${config.id}) 注册成功`);
      return true;
    } catch (error) {
      this.log('error', '注册插件模块失败', error as Error);
      return false;
    }
  }

  /**
   * 加载所有插件
   */
  async loadPlugins(): Promise<void> {
    try {
      this.log('info', `开始加载插件，共 ${this.pluginModules.size} 个插件模块`);

      // 按优先级排序插件模块
      const sortedModules = Array.from(this.pluginModules.entries())
        .sort(([, a], [, b]) => (a.config.priority || 0) - (b.config.priority || 0));

      for (const [pluginId, module] of sortedModules) {
        await this.loadPlugin(pluginId, module);
      }

      this.log('info', `插件加载完成，成功加载 ${this.plugins.size} 个插件`);
    } catch (error) {
      this.log('error', '加载插件失败', error as Error);
    }
  }

  /**
   * 加载单个插件
   * @param pluginId 插件ID
   * @param module 插件模块
   */
  private async loadPlugin(pluginId: string, module: PluginModule): Promise<void> {
    try {
      // 如果插件已存在，跳过
      if (this.plugins.has(pluginId)) {
        return;
      }

      this.log('info', `正在加载插件: ${module.config.name} (${pluginId})`);

      // 创建插件实例
      const plugin = module.plugin.create(this.pluginContext);
      this.plugins.set(pluginId, plugin);

      // 初始化插件
      const initialized = await plugin.initialize();
      if (initialized) {
        // 更新工具映射
        this.updateToolMap(pluginId, plugin.getTools());

        // 如果配置了自动启用，则启用插件
        if (this.config.autoEnable) {
          await plugin.enable();
        }
      }
    } catch (error) {
      this.log('error', `加载插件 ${pluginId} 失败`, error as Error);
    }
  }

  /**
   * 更新工具映射
   * @param pluginId 插件ID
   * @param tools 工具列表
   */
  private updateToolMap(pluginId: string, tools: Tool[]): void {
    for (const tool of tools) {
      const toolKey = `${tool.industry}:${tool.id}`;
      if (this.toolMap.has(toolKey)) {
        this.log('warn', `工具 ${tool.id} 在行业 ${tool.industry} 中已存在，可能会被覆盖`);
      }
      this.toolMap.set(toolKey, { pluginId, tool });
    }
  }

  /**
   * 获取插件信息
   * @param pluginId 插件ID
   */
  getPluginInfo(pluginId: string): PluginInfo | undefined {
    const plugin = this.plugins.get(pluginId);
    const module = this.pluginModules.get(pluginId);

    if (!plugin || !module) {
      return undefined;
    }

    const status = plugin.status;
    const tools = plugin.getTools();

    return {
      id: pluginId,
      name: module.config.name,
      version: module.config.version,
      description: module.config.description,
      initialized: status.initialized,
      enabled: status.enabled,
      supportedIndustries: module.config.supportedIndustries,
      toolCount: tools.length,
      priority: module.config.priority || 0,
    };
  }

  /**
   * 获取所有插件信息
   */
  getAllPluginsInfo(): PluginInfo[] {
    const pluginsInfo: PluginInfo[] = [];

    for (const [pluginId] of this.plugins) {
      const info = this.getPluginInfo(pluginId);
      if (info) {
        pluginsInfo.push(info);
      }
    }

    return pluginsInfo.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取指定行业的工具列表
   * @param industry 行业类型
   */
  getToolsByIndustry(industry: IndustryType): Tool[] {
    const tools: Tool[] = [];

    this.toolMap.forEach(({ tool }) => {
      if (tool.industry === industry) {
        tools.push(tool);
      }
    });

    return tools.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  /**
   * 获取所有工具列表
   */
  getAllTools(): Tool[] {
    const tools: Tool[] = [];
    
    this.toolMap.forEach(({ tool }) => {
      tools.push(tool);
    });

    return tools.sort((a, b) => {
      // 先按行业排序，再按优先级排序
      if (a.industry !== b.industry) {
        return a.industry.localeCompare(b.industry);
      }
      return (a.priority || 0) - (b.priority || 0);
    });
  }

  /**
   * 获取指定工具
   * @param industry 行业类型
   * @param toolId 工具ID
   */
  getTool(industry: IndustryType, toolId: string): Tool | undefined {
    const toolKey = `${industry}:${toolId}`;
    const toolInfo = this.toolMap.get(toolKey);
    
    return toolInfo?.tool;
  }

  /**
   * 执行工具
   * @param industry 行业类型
   * @param toolId 工具ID
   * @param parameters 工具参数
   */
  async executeTool(industry: IndustryType, toolId: string, parameters: Record<string, any>): Promise<ToolExecutionResult> {
    const toolKey = `${industry}:${toolId}`;
    const toolInfo = this.toolMap.get(toolKey);

    if (!toolInfo) {
      return {
        success: false,
        error: `工具 ${toolId} 在行业 ${industry} 中不存在`,
        executionTime: 0,
        timestamp: Date.now(),
        toolId,
        industry
      };
    }

    const { pluginId } = toolInfo;
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      return {
        success: false,
        error: `工具 ${toolId} 对应的插件 ${pluginId} 不存在`,
        executionTime: 0,
        timestamp: Date.now(),
        toolId,
        industry
      };
    }

    try {
      // 执行工具
      const result = await plugin.executeTool(toolId, parameters);
      
      // 确保返回结果包含行业信息
      return {
        ...result,
        industry
      };
    } catch (error) {
      this.log('error', `执行工具 ${toolId} 失败`, error as Error, { industry, parameters });
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        executionTime: 0,
        timestamp: Date.now(),
        toolId,
        industry
      };
    }
  }

  /**
   * 启用插件
   * @param pluginId 插件ID
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    return await plugin.enable();
  }

  /**
   * 禁用插件
   * @param pluginId 插件ID
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    return await plugin.disable();
  }

  /**
   * 卸载插件
   * @param pluginId 插件ID
   */
  async unloadPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    try {
      // 销毁插件
      await plugin.destroy();
      
      // 移除插件
      this.plugins.delete(pluginId);
      
      // 更新工具映射
      this.removeToolsFromMap(pluginId);
      
      return true;
    } catch (error) {
      this.log('error', `卸载插件 ${pluginId} 失败`, error as Error);
      return false;
    }
  }

  /**
   * 从工具映射中移除插件的工具
   * @param pluginId 插件ID
   */
  private removeToolsFromMap(pluginId: string): void {
    const keysToRemove: string[] = [];
    
    this.toolMap.forEach((info, key) => {
      if (info.pluginId === pluginId) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => {
      this.toolMap.delete(key);
    });
  }

  /**
   * 创建插件上下文
   */
  private createPluginContext(): PluginContext {
    return {
      getIndustries: () => {
        // 返回所有行业类型
        return Object.values(IndustryType).map(industry => ({
          id: industry,
          name: this.getIndustryName(industry)
        }));
      },
      
      getToolsByIndustry: (industry) => {
        return this.getToolsByIndustry(industry);
      },
      
      registerTool: (tool) => {
        try {
          const toolKey = `${tool.industry}:${tool.id}`;
          this.toolMap.set(toolKey, {
            pluginId: 'system', // 系统注册的工具
            tool
          });
          return true;
        } catch {
          return false;
        }
      },
      
      getConfig: <T = any>(key?: string, defaultValue?: T) => {
        // 简单的配置获取逻辑，实际应用中可能需要从配置服务获取
        if (!key) {
          return this.config as unknown as T;
        }
        
        // @ts-ignore - 简化配置获取
        return this.config[key] || defaultValue;
      },
      
      setConfig: (key: string, value: any) => {
        // @ts-ignore - 简化配置设置
        this.config[key] = value;
      },
      
      logger: {
        info: (message, data?) => this.log('info', message, undefined, data),
        warn: (message, data?) => this.log('warn', message, undefined, data),
        error: (message, error?, data?) => this.log('error', message, error, data),
        debug: (message, data?) => this.log('debug', message, undefined, data)
      }
    };
  }

  /**
   * 获取行业名称
   * @param industry 行业类型
   */
  private getIndustryName(industry: IndustryType): string {
    // 行业名称映射
    const industryNames: Record<string, string> = {
      [IndustryType.AGRICULTURE]: '智慧农业',
      [IndustryType.EDUCATION]: '智能教育',
      [IndustryType.FINANCE]: '智能金融',
      [IndustryType.HEALTHCARE]: '智能医疗',
      [IndustryType.RETAIL]: '智能零售',
      [IndustryType.MANUFACTURING]: '智能制造',
      [IndustryType.ENERGY]: '能源管理',
      [IndustryType.CREATIVE]: '智能文创',
      [IndustryType.LEGAL]: '法律服务',
      [IndustryType.HUMANRESOURCE]: '人力资源',
      [IndustryType.MEDIA]: '媒体服务',
      [IndustryType.SMARTCITY]: '智慧城市'
    };

    return industryNames[industry] || industry;
  }

  /**
   * 记录日志
   * @param level 日志级别
   * @param message 日志消息
   * @param error 错误对象
   * @param data 额外数据
   */
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, error?: Error, data?: any): void {
    // 构建日志内容
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    // 根据不同级别输出日志
    switch (level) {
      case 'info':
        console.info(logMessage, data || {});
        break;
      case 'warn':
        console.warn(logMessage, data || {});
        break;
      case 'error':
        console.error(logMessage, error || {}, data || {});
        break;
      case 'debug':
        console.debug(logMessage, data || {});
        break;
    }
  }

  /**
   * 获取插件管理器实例信息
   */
  getInfo(): {
    initialized: boolean;
    pluginCount: number;
    toolCount: number;
    industryCount: number;
  } {
    // 统计行业数量
    const industries = new Set<IndustryType>();
    this.toolMap.forEach(({ tool }) => {
      industries.add(tool.industry);
    });

    return {
      initialized: this.isInitialized,
      pluginCount: this.plugins.size,
      toolCount: this.toolMap.size,
      industryCount: industries.size
    };
  }
}

/**
 * 插件管理器单例实例
 */
let pluginManagerInstance: PluginManager | null = null;

/**
 * 获取插件管理器单例
 * @param config 插件管理配置
 */
export function getPluginManager(config?: PluginManagerConfig): PluginManager {
  if (!pluginManagerInstance) {
    pluginManagerInstance = new PluginManager(config || {});
  }
  return pluginManagerInstance;
}

/**
 * 导出单例和类
 */
export default PluginManager;
export { pluginManagerInstance as pluginManager };
