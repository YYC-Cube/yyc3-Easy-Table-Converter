/**
 * @file Web3行业工具集合
 * @description Web3行业相关的工具类和功能接口
 * @module industries/web3
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

import { IndustryType, FormatType } from '../IndustryMatrixConfig';
import { BlockchainDataConverter } from './BlockchainDataConverter';
import { NFTAnalyzer } from './NFTAnalyzer';
import { SmartContractAnalyzer } from './SmartContractAnalyzer';
// 移除循环导入
// import { WalletIntegrationService } from './WalletIntegrationService';

/**
 * Web3行业工具接口
 */
export interface IWeb3Tool {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 支持的输入格式 */
  supportedInputFormats: FormatType[];
  /** 支持的输出格式 */
  supportedOutputFormats: FormatType[];
  /** 执行工具功能 */
  execute(input: any, options?: Record<string, any>): Promise<any>;
  /** 验证输入数据 */
  validateInput(input: any): boolean;
  /** 获取工具信息 */
  getInfo(): {
    name: string;
    description: string;
    industry: IndustryType;
    version: string;
  };
}

/**
 * Web3工具管理器 - 负责管理和提供Web3行业的所有工具
 */
export class Web3ToolManager {
  private static readonly tools: Record<string, IWeb3Tool> = {};
  private static readonly instance: Web3ToolManager = new Web3ToolManager();

  /**
   * 私有构造函数，初始化Web3工具
   */
  private constructor() {
    this.initializeTools();
  }

  /**
   * 初始化Web3工具集合
   */
  private initializeTools(): void {
    // 注册区块链数据转换工具
    const blockchainConverter = new BlockchainDataConverter();
    Web3ToolManager.tools[blockchainConverter.name] = blockchainConverter;

    // 注册NFT分析工具
    const nftAnalyzer = new NFTAnalyzer();
    Web3ToolManager.tools[nftAnalyzer.name] = nftAnalyzer;

    // 注册智能合约分析工具
    const contractAnalyzer = new SmartContractAnalyzer();
    Web3ToolManager.tools[contractAnalyzer.name] = contractAnalyzer;

    // 动态导入以避免循环依赖
    this.registerWalletIntegrationService();
  }

  /**
   * 动态注册钱包集成服务
   */
  private async registerWalletIntegrationService(): Promise<void> {
    try {
      // 使用动态导入避免循环依赖
      const walletModule = await import('./WalletIntegrationService');
      const walletService = new walletModule.WalletIntegrationService();
      Web3ToolManager.tools[walletService.name] = walletService;
    } catch (error) {
      console.warn('钱包集成服务注册失败:', error);
    }
  }

  /**
   * 获取Web3ToolManager单例实例
   */
  public static getInstance(): Web3ToolManager {
    return Web3ToolManager.instance;
  }

  /**
   * 获取所有Web3工具
   */
  public getAllTools(): IWeb3Tool[] {
    return Object.values(Web3ToolManager.tools);
  }

  /**
   * 根据名称获取Web3工具
   * @param toolName 工具名称
   */
  public getTool(toolName: string): IWeb3Tool | undefined {
    return Web3ToolManager.tools[toolName];
  }

  /**
   * 执行指定工具
   * @param toolName 工具名称
   * @param input 输入数据
   * @param options 执行选项
   */
  public async executeTool(
    toolName: string,
    input: any,
    options?: Record<string, any>
  ): Promise<any> {
    // 如果是钱包集成服务且尚未注册，尝试等待其注册
    if (toolName === 'WalletIntegrationService' && !this.hasTool(toolName)) {
      // 简单等待一下让动态导入完成
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const tool = this.getTool(toolName);
    if (!tool) {
      throw new Error(`工具 ${toolName} 不存在`);
    }

    if (!tool.validateInput(input)) {
      throw new Error(`工具 ${toolName} 的输入数据无效`);
    }

    return tool.execute(input, options);
  }

  /**
   * 获取支持特定格式的工具列表
   * @param formatType 数据格式类型
   */
  public getToolsByFormat(formatType: FormatType): IWeb3Tool[] {
    return Object.values(Web3ToolManager.tools).filter(
      (tool) =>
        tool.supportedInputFormats.includes(formatType) ||
        tool.supportedOutputFormats.includes(formatType)
    );
  }

  /**
   * 获取工具名称列表
   */
  public getToolNames(): string[] {
    return Object.keys(Web3ToolManager.tools);
  }

  /**
   * 检查工具是否存在
   * @param toolName 工具名称
   */
  public hasTool(toolName: string): boolean {
    return Web3ToolManager.tools.hasOwnProperty(toolName);
  }
}

/**
 * Web3行业工具适配器 - 用于与其他行业工具集成
 */
export class Web3ToolAdapter {
  /**
   * 转换数据格式
   * @param data 输入数据
   * @param fromFormat 源格式
   * @param toFormat 目标格式
   */
  public static async convertDataFormat(
    data: any,
    fromFormat: FormatType,
    toFormat: FormatType
  ): Promise<any> {
    const toolManager = Web3ToolManager.getInstance();
    const converter = toolManager.getTool('BlockchainDataConverter');
    
    if (!converter) {
      throw new Error('区块链数据转换器工具不可用');
    }

    return converter.execute(data, {
      fromFormat,
      toFormat,
    });
  }

  /**
   * 分析NFT数据
   * @param nftData NFT数据
   */
  public static async analyzeNFT(nftData: any): Promise<any> {
    const toolManager = Web3ToolManager.getInstance();
    const analyzer = toolManager.getTool('NFTAnalyzer');
    
    if (!analyzer) {
      throw new Error('NFT分析工具不可用');
    }

    return analyzer.execute(nftData);
  }

  /**
   * 分析智能合约
   * @param contractData 智能合约数据
   */
  public static async analyzeSmartContract(contractData: any): Promise<any> {
    const toolManager = Web3ToolManager.getInstance();
    const analyzer = toolManager.getTool('SmartContractAnalyzer');
    
    if (!analyzer) {
      throw new Error('智能合约分析工具不可用');
    }

    return analyzer.execute(contractData);
  }
}

/**
 * Web3工具工厂 - 创建Web3行业工具的工厂类
 */
export class Web3ToolFactory {
  /**
   * 创建区块链数据转换工具
   */
  public static createBlockchainConverter(): BlockchainDataConverter {
    return new BlockchainDataConverter();
  }

  /**
   * 创建NFT分析工具
   */
  public static createNFTAnalyzer(): NFTAnalyzer {
    return new NFTAnalyzer();
  }

  /**
   * 创建智能合约分析工具
   */
  public static createSmartContractAnalyzer(): SmartContractAnalyzer {
    return new SmartContractAnalyzer();
  }

  /**
   * 创建钱包集成服务
   */
  public static async createWalletIntegrationService(): Promise<any> {
    // 动态导入以避免循环依赖
    const walletModule = await import('./WalletIntegrationService');
    return new walletModule.WalletIntegrationService();
  }
}

/**
 * Web3行业工具模块导出
 * 使用export type符合isolatedModules要求
 */
export {
  Web3ToolManager as ToolManager,
  Web3ToolAdapter as ToolAdapter,
  Web3ToolFactory as ToolFactory
};

// 确保使用export type导出类型
export type { IWeb3Tool as ITool };