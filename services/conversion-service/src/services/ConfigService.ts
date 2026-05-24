/**
 * @file 配置服务
 * @description 微服务架构中的配置管理服务
 * @module services/conversion-service/services
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-22
 */

import { LoggerService, defaultLogger } from './LoggerService';

/**
 * 微服务配置接口
 */
export interface ServiceConfig {
  /**
   * 服务名称
   */
  serviceName: string;
  
  /**
   * 服务端口
   */
  port: number;
  
  /**
   * 环境类型
   */
  environment: 'development' | 'staging' | 'production';
  
  /**
   * 是否启用调试模式
   */
  debug: boolean;
  
  /**
   * 转换引擎配置
   */
  conversionEngine: {
    /**
     * 最大并发任务数
     */
    maxConcurrentTasks: number;
    
    /**
     * 任务超时时间（毫秒）
     */
    taskTimeoutMs: number;
    
    /**
     * 内存限制（MB）
     */
    memoryLimitMb: number;
    
    /**
     * 支持的文件格式
     */
    supportedFormats: string[];
  };
  
  /**
   * 队列配置
   */
  queue: {
    /**
     * 队列容量
     */
    capacity: number;
    
    /**
     * 重试次数
     */
    maxRetries: number;
    
    /**
     * 重试间隔（毫秒）
     */
    retryIntervalMs: number;
  };
  
  /**
   * 日志配置
   */
  logger: {
    /**
     * 日志级别
     */
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    
    /**
     * 是否启用文件日志
     */
    fileLogging: boolean;
    
    /**
     * 日志文件路径
     */
    logFilePath: string;
    
    /**
     * 是否使用JSON格式
     */
    jsonFormat: boolean;
  };
  
  /**
   * WebSocket配置
   */
  websocket: {
    /**
     * 是否启用
     */
    enabled: boolean;
    
    /**
     * 心跳间隔（毫秒）
     */
    heartbeatIntervalMs: number;
    
    /**
     * 连接超时时间（毫秒）
     */
    connectionTimeoutMs: number;
  };
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ServiceConfig = {
  serviceName: 'conversion-service',
  port: 3000,
  environment: 'development',
  debug: true,
  conversionEngine: {
    maxConcurrentTasks: 5,
    taskTimeoutMs: 300000, // 5分钟
    memoryLimitMb: 512,
    supportedFormats: ['csv', 'json', 'arrow', 'tsv', 'markdown']
  },
  queue: {
    capacity: 100,
    maxRetries: 3,
    retryIntervalMs: 5000
  },
  logger: {
    level: 'info',
    fileLogging: false,
    logFilePath: './logs/conversion-service.log',
    jsonFormat: false
  },
  websocket: {
    enabled: true,
    heartbeatIntervalMs: 30000,
    connectionTimeoutMs: 60000
  }
};

/**
 * 配置服务类
 */
export class ConfigService {
  private config: ServiceConfig;
  private logger: LoggerService;
  private static instance: ConfigService | null = null;

  /**
   * 私有构造函数，使用单例模式
   */
  private constructor(logger?: LoggerService) {
    this.logger = logger || defaultLogger;
    this.config = { ...DEFAULT_CONFIG };
    
    // 从环境变量加载配置
    this.loadConfigFromEnvironment();
    
    // 验证配置
    this.validateConfig();
    
    this.logger.info('配置服务已初始化');
  }

  /**
   * 获取配置服务实例
   * @param logger 日志服务实例
   */
  public static getInstance(logger?: LoggerService): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService(logger);
    }
    return ConfigService.instance;
  }

  /**
   * 从环境变量加载配置
   */
  private loadConfigFromEnvironment(): void {
    try {
      // 服务基本配置
      const serviceName = process.env.SERVICE_NAME;
      const port = process.env.SERVICE_PORT;
      const environment = process.env.NODE_ENV;
      const debug = process.env.DEBUG === 'true';

      if (serviceName) this.config.serviceName = serviceName;
      if (port) this.config.port = parseInt(port, 10);
      if (environment && ['development', 'staging', 'production'].includes(environment)) {
        this.config.environment = environment as 'development' | 'staging' | 'production';
      }
      this.config.debug = debug;

      // 转换引擎配置
      const maxConcurrentTasks = process.env.CONVERSION_MAX_CONCURRENT_TASKS;
      const taskTimeoutMs = process.env.CONVERSION_TASK_TIMEOUT_MS;
      const memoryLimitMb = process.env.CONVERSION_MEMORY_LIMIT_MB;

      if (maxConcurrentTasks) this.config.conversionEngine.maxConcurrentTasks = parseInt(maxConcurrentTasks, 10);
      if (taskTimeoutMs) this.config.conversionEngine.taskTimeoutMs = parseInt(taskTimeoutMs, 10);
      if (memoryLimitMb) this.config.conversionEngine.memoryLimitMb = parseInt(memoryLimitMb, 10);

      // 日志配置
      const logLevel = process.env.LOG_LEVEL;
      const fileLogging = process.env.LOG_FILE === 'true';
      const logFilePath = process.env.LOG_FILE_PATH;
      const jsonFormat = process.env.LOG_JSON_FORMAT === 'true';

      if (logLevel && ['debug', 'info', 'warn', 'error', 'fatal'].includes(logLevel)) {
        this.config.logger.level = logLevel as 'debug' | 'info' | 'warn' | 'error' | 'fatal';
      }
      this.config.logger.fileLogging = fileLogging;
      if (logFilePath) this.config.logger.logFilePath = logFilePath;
      this.config.logger.jsonFormat = jsonFormat;

      this.logger.debug('已从环境变量加载配置');
    } catch (error) {
      this.logger.error('从环境变量加载配置失败', { error });
      // 使用默认配置继续运行
      this.logger.info('使用默认配置继续运行');
    }
  }

  /**
   * 验证配置的有效性
   */
  private validateConfig(): void {
    try {
      // 验证端口范围
      if (this.config.port < 1024 || this.config.port > 65535) {
        throw new Error(`无效的端口号: ${this.config.port}，必须在1024-65535范围内`);
      }

      // 验证最大并发任务数
      if (this.config.conversionEngine.maxConcurrentTasks < 1) {
        throw new Error('最大并发任务数必须大于0');
      }

      // 验证任务超时时间
      if (this.config.conversionEngine.taskTimeoutMs < 1000) {
        throw new Error('任务超时时间必须大于1000毫秒');
      }

      // 验证内存限制
      if (this.config.conversionEngine.memoryLimitMb < 64) {
        throw new Error('内存限制必须大于64MB');
      }

      this.logger.debug('配置验证通过');
    } catch (error) {
      this.logger.error('配置验证失败', { error });
      throw error;
    }
  }

  /**
   * 获取完整配置
   */
  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  /**
   * 获取服务名称
   */
  public getServiceName(): string {
    return this.config.serviceName;
  }

  /**
   * 获取服务端口
   */
  public getPort(): number {
    return this.config.port;
  }

  /**
   * 获取环境类型
   */
  public getEnvironment(): 'development' | 'staging' | 'production' {
    return this.config.environment;
  }

  /**
   * 是否启用调试模式
   */
  public isDebugEnabled(): boolean {
    return this.config.debug;
  }

  /**
   * 获取转换引擎配置
   */
  public getConversionEngineConfig(): ServiceConfig['conversionEngine'] {
    return { ...this.config.conversionEngine };
  }

  /**
   * 获取队列配置
   */
  public getQueueConfig(): ServiceConfig['queue'] {
    return { ...this.config.queue };
  }

  /**
   * 获取日志配置
   */
  public getLoggerConfig(): ServiceConfig['logger'] {
    return { ...this.config.logger };
  }

  /**
   * 获取WebSocket配置
   */
  public getWebSocketConfig(): ServiceConfig['websocket'] {
    return { ...this.config.websocket };
  }

  /**
   * 动态更新配置
   * @param partialConfig 部分配置对象
   */
  public updateConfig(partialConfig: Partial<ServiceConfig>): void {
    try {
      // 合并配置
      this.config = { ...this.config, ...partialConfig };
      
      // 验证更新后的配置
      this.validateConfig();
      
      this.logger.info('配置已成功更新', { updatedConfig: partialConfig });
    } catch (error) {
      this.logger.error('更新配置失败', { error, attemptedConfig: partialConfig });
      throw error;
    }
  }

  /**
   * 检查是否支持指定的文件格式
   * @param format 文件格式
   */
  public isFormatSupported(format: string): boolean {
    return this.config.conversionEngine.supportedFormats.includes(format.toLowerCase());
  }

  /**
   * 获取支持的文件格式列表
   */
  public getSupportedFormats(): string[] {
    return [...this.config.conversionEngine.supportedFormats];
  }

  /**
   * 获取配置的JSON字符串表示
   */
  public toString(): string {
    // 移除可能包含敏感信息的部分
    const sanitizedConfig = { ...this.config };
    return JSON.stringify(sanitizedConfig, null, 2);
  }
}

// 导出默认配置服务实例
export const defaultConfigService = ConfigService.getInstance();
