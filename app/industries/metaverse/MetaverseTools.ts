/**
 * @file 元宇宙工具管理系统
 * @description 提供元宇宙相关工具的管理、适配器和工厂类
 * @module industries/metaverse/MetaverseTools
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

import { IndustryType, FormatType } from '../IndustryMatrixConfig';
import { DigitalTwinManager } from './DigitalTwinManager';
import { MetaverseAssetManager } from './MetaverseAssetManager';

/**
 * 元宇宙工具接口
 */
export interface IDigitalTwinTool {
  /** 工具名称 */
  readonly name: string;
  
  /** 工具描述 */
  readonly description: string;
  
  /** 支持的输入格式 */
  readonly supportedInputFormats: FormatType[];
  
  /** 支持的输出格式 */
  readonly supportedOutputFormats: FormatType[];

  /**
   * 执行工具功能
   * @param input 输入数据
   * @param options 执行选项
   * @param formatType 格式类型
   * @returns Promise<any> 执行结果
   */
  execute(input: any, options?: Record<string, any>, formatType?: FormatType): Promise<any>;

  /**
   * 验证输入数据
   * @param input 输入数据
   * @param formatType 格式类型
   * @returns boolean 是否有效
   */
  validateInput(input: any, formatType?: FormatType): boolean;

  /**
   * 获取工具信息
   * @returns 工具信息对象
   */
  getInfo(): {
    name: string;
    description: string;
    industry: IndustryType;
    version: string;
  };
}

/**
 * 元宇宙工具管理器 - 单例类
 */
export class MetaverseToolManager {
  private static instance: MetaverseToolManager;
  private tools: Map<string, IDigitalTwinTool> = new Map();

  private constructor() {
    this.initializeTools();
  }

  /**
   * 获取工具管理器实例
   * @returns MetaverseToolManager 实例
   */
  public static getInstance(): MetaverseToolManager {
    if (!MetaverseToolManager.instance) {
      MetaverseToolManager.instance = new MetaverseToolManager();
    }
    return MetaverseToolManager.instance;
  }

  /**
   * 初始化内置工具
   */
  private initializeTools(): void {
    try {
      // 注册数字孪生管理器
      const digitalTwinManager = DigitalTwinManager.getInstance();
      this.registerTool(digitalTwinManager);

      // 注册元宇宙资产管理器
      const assetManager = new MetaverseAssetManager();
      this.registerTool(assetManager);

      console.log(`✅ 元宇宙工具初始化完成，已加载 ${this.tools.size} 个工具`);
    } catch (error) {
      console.error('❌ 元宇宙工具初始化失败:', error);
    }
  }

  /**
   * 注册新工具
   * @param tool 工具实例
   */
  public registerTool(tool: IDigitalTwinTool): void {
    if (!tool || !tool.name) {
      throw new Error('无效的工具实例');
    }
    
    this.tools.set(tool.name.toLowerCase(), tool);
    console.log(`📦 工具已注册: ${tool.name}`);
  }

  /**
   * 获取工具实例
   * @param toolName 工具名称
   * @returns IDigitalTwinTool 工具实例
   */
  public getTool(toolName: string): IDigitalTwinTool | undefined {
    if (!toolName) {
      return undefined;
    }
    return this.tools.get(toolName.toLowerCase());
  }

  /**
   * 列出所有可用工具
   * @returns IDigitalTwinTool[] 工具列表
   */
  public listTools(): IDigitalTwinTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 执行指定工具
   * @param toolName 工具名称
   * @param input 输入数据
   * @param options 执行选项
   * @param formatType 格式类型
   * @returns Promise<any> 执行结果
   */
  public async executeTool(
    toolName: string,
    input: any,
    options?: Record<string, any>,
    formatType?: FormatType
  ): Promise<any> {
    const tool = this.getTool(toolName);
    if (!tool) {
      throw new Error(`工具 "${toolName}" 未找到`);
    }

    // 验证输入
    if (!tool.validateInput(input, formatType)) {
      throw new Error(`工具 "${toolName}" 的输入数据验证失败`);
    }

    // 执行工具
    try {
      return await tool.execute(input, options, formatType);
    } catch (error) {
      throw new Error(`工具 "${toolName}" 执行失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取工具支持的格式
   * @param toolName 工具名称
   * @returns { inputFormats: FormatType[], outputFormats: FormatType[] } 格式信息
   */
  public getToolFormats(toolName: string): { inputFormats: FormatType[]; outputFormats: FormatType[] } | undefined {
    const tool = this.getTool(toolName);
    if (!tool) {
      return undefined;
    }

    return {
      inputFormats: tool.supportedInputFormats || [],
      outputFormats: tool.supportedOutputFormats || []
    };
  }

  /**
   * 检查工具是否支持特定格式
   * @param toolName 工具名称
   * @param formatType 格式类型
   * @param isOutput 是否为输出格式
   * @returns boolean 是否支持
   */
  public isFormatSupported(toolName: string, formatType: FormatType, isOutput: boolean = false): boolean {
    const formats = this.getToolFormats(toolName);
    if (!formats) {
      return false;
    }

    const targetFormats = isOutput ? formats.outputFormats : formats.inputFormats;
    return targetFormats.some(format => format === formatType);
  }
}

/**
 * 元宇宙工具适配器
 */
export class MetaverseToolAdapter {
  /**
   * 适配工具执行
   * @param tool 工具实例
   * @param input 输入数据
   * @param options 执行选项
   * @param formatType 格式类型
   * @returns Promise<any> 执行结果
   */
  public static async adaptExecution(
    tool: IDigitalTwinTool,
    input: any,
    options?: Record<string, any>,
    formatType?: FormatType
  ): Promise<any> {
    // 格式转换预处理
    const processedInput = this.preprocessInput(input, formatType);
    
    // 执行工具
    const result = await tool.execute(processedInput, options, formatType);
    
    // 结果后处理
    return this.postprocessOutput(result);
  }

  /**
   * 输入数据预处理
   * @param input 输入数据
   * @param formatType 格式类型
   * @returns any 处理后的输入
   */
  private static preprocessInput(input: any, formatType?: FormatType): any {
    // 根据不同格式类型进行预处理
    switch (formatType) {
      case FormatType.CSV:
      case FormatType.XML:
      case FormatType.EXCEL:
        // 如果需要转换为JSON格式进行处理
        return input;
      default:
        return input;
    }
  }

  /**
   * 输出数据后处理
   * @param output 输出数据
   * @param formatType 格式类型
   * @returns any 处理后的输出
   */
  private static postprocessOutput(output: any): any {
    // 输出数据格式化
    return output;
  }
}

/**
 * 元宇宙工具工厂类
 */
export class MetaverseToolFactory {
  /**
   * 创建工具实例
   * @param toolType 工具类型
   * @param options 创建选项
   * @returns IDigitalTwinTool 工具实例
   */
  public static createTool(toolType: string, options?: Record<string, any>): IDigitalTwinTool {
    switch (toolType.toLowerCase()) {
      case 'digitaltwinmanager':
        return DigitalTwinManager.getInstance(options as any);
      case 'metaverseassetmanager':
        return new MetaverseAssetManager();
      default:
        throw new Error(`不支持的工具类型: ${toolType}`);
    }
  }

  /**
   * 获取支持的工具类型列表
   * @returns string[] 工具类型列表
   */
  public static getSupportedToolTypes(): string[] {
    return [
      'DigitalTwinManager',
      'MetaverseAssetManager'
    ];
  }
}
