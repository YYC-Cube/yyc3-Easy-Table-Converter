/**
 * @file 日志服务
 * @description 转换服务中的统一日志管理服务，支持上下文跟踪和性能监控集成
 * @module services/conversion-service/services
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-22
 * @updated 2024-11-23
 */

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  TRACE = 'trace' // 添加跟踪级别，用于详细的执行流记录
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  level: LogLevel;
  serviceName: string;
  enableFileLogging: boolean;
  logFilePath: string;
  jsonFormat: boolean;
  enableRequestTracking?: boolean; // 是否启用请求跟踪
  maxMetaLength?: number; // 元数据最大长度，防止日志过大
}

/**
 * 日志服务类
 */
export class LoggerService {
  private serviceName: string;
  private level: LogLevel;
  private jsonFormat: boolean;
  private enableFileLogging: boolean;
  private logFilePath: string;
  private enableRequestTracking: boolean;
  private maxMetaLength: number;
  private contextStore: Map<string, any>; // 用于存储请求上下文

  /**
   * 构造函数
   * @param serviceName 服务名称
   * @param config 日志配置
   */
  constructor(serviceName: string, config?: Partial<LoggerConfig>) {
    this.serviceName = serviceName;
    
    // 默认配置
    const defaultConfig: LoggerConfig = {
      level: LogLevel.INFO,
      serviceName,
      enableFileLogging: false,
      logFilePath: './logs/service.log',
      jsonFormat: false,
      enableRequestTracking: true,
      maxMetaLength: 10000
    };

    // 合并配置
    const mergedConfig = { ...defaultConfig, ...config };
    
    this.level = mergedConfig.level;
    this.jsonFormat = mergedConfig.jsonFormat;
    this.enableFileLogging = mergedConfig.enableFileLogging;
    this.logFilePath = mergedConfig.logFilePath;
    this.enableRequestTracking = mergedConfig.enableRequestTracking || true;
    this.maxMetaLength = mergedConfig.maxMetaLength || 10000;
    this.contextStore = new Map();

    // 如果启用文件日志，初始化文件日志器
    if (this.enableFileLogging) {
      this.initializeFileLogger();
    }
  }

  /**
   * 初始化文件日志器
   */
  private initializeFileLogger(): void {
    try {
      // 在实际应用中，这里应该使用文件系统模块创建日志文件
      // 为了简化示例，这里只记录日志
      console.log(`[Logger] 初始化文件日志: ${this.logFilePath}`);
    } catch (error) {
      console.error('[Logger] 初始化文件日志失败:', error);
      // 降级为控制台日志
      this.enableFileLogging = false;
    }
  }

  /**
   * 调试级别日志
   * @param message 日志消息
   * @param meta 附加元数据
   * @param contextId 请求上下文ID
   */
  public debug(message: string, meta?: any, contextId?: string): void {
    this.log(LogLevel.DEBUG, message, meta, contextId);
  }

  /**
   * 跟踪级别日志
   * @param message 日志消息
   * @param meta 附加元数据
   * @param contextId 请求上下文ID
   */
  public trace(message: string, meta?: any, contextId?: string): void {
    this.log(LogLevel.TRACE, message, meta, contextId);
  }

  /**
   * 信息级别日志
   * @param message 日志消息
   * @param meta 附加元数据
   * @param contextId 请求上下文ID
   */
  public info(message: string, meta?: any, contextId?: string): void {
    this.log(LogLevel.INFO, message, meta, contextId);
  }

  /**
   * 警告级别日志
   * @param message 日志消息
   * @param meta 附加元数据
   * @param contextId 请求上下文ID
   */
  public warn(message: string, meta?: any, contextId?: string): void {
    this.log(LogLevel.WARN, message, meta, contextId);
  }

  /**
   * 错误级别日志
   * @param message 日志消息
   * @param error 错误对象
   * @param meta 附加元数据
   * @param contextId 请求上下文ID
   */
  public error(message: string, error?: Error, meta?: any, contextId?: string): void {
    const errorMeta = error ? this.extractErrorDetails(error) : {};
    const mergedMeta = meta ? { ...meta, ...errorMeta } : errorMeta;
    this.log(LogLevel.ERROR, message, mergedMeta, contextId);
  }

  /**
   * 致命级别日志
   * @param message 日志消息
   * @param error 错误对象
   * @param meta 附加元数据
   * @param contextId 请求上下文ID
   */
  public fatal(message: string, error?: Error, meta?: any, contextId?: string): void {
    const errorMeta = error ? this.extractErrorDetails(error) : {};
    const mergedMeta = meta ? { ...meta, ...errorMeta } : errorMeta;
    this.log(LogLevel.FATAL, message, mergedMeta, contextId);
  }

  /**
   * 通用日志方法
   * @param level 日志级别
   * @param message 日志消息
   * @param meta 附加元数据
   * @param contextId 请求上下文ID
   */
  private log(level: LogLevel, message: string, meta?: any, contextId?: string): void {
    // 检查日志级别是否应该被输出
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    
    // 获取上下文信息
    let contextMeta: any = {};
    if (contextId && this.enableRequestTracking) {
      contextMeta = this.getContext(contextId) || {};
    }
    
    // 合并上下文和元数据
    const mergedMeta = { ...contextMeta, ...(meta || {}) };
    
    // 限制元数据大小
    const limitedMeta = this.limitMetaSize(mergedMeta);
    
    const logEntry = this.createLogEntry(timestamp, level, message, limitedMeta, contextId);

    // 输出到控制台
    this.outputToConsole(level, logEntry);

    // 输出到文件（如果启用）
    if (this.enableFileLogging) {
      this.outputToFile(logEntry);
    }
  }

  /**
   * 检查日志级别是否应该被输出
   * @param level 日志级别
   */
  private shouldLog(level: LogLevel): boolean {
    const levelOrder = [
      LogLevel.TRACE,
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL
    ];

    const currentLevelIndex = levelOrder.indexOf(this.level);
    const targetLevelIndex = levelOrder.indexOf(level);

    return targetLevelIndex >= currentLevelIndex;
  }
  
  /**
   * 限制元数据大小，防止日志过大
   */
  private limitMetaSize(meta: any): any {
    if (!meta || typeof meta !== 'object') {
      return meta;
    }
    
    const metaStr = JSON.stringify(meta);
    if (metaStr.length <= this.maxMetaLength) {
      return meta;
    }
    
    // 截断元数据并添加截断标记
    const truncatedMeta = JSON.parse(metaStr.substring(0, this.maxMetaLength));
    return {
      ...truncatedMeta,
      _truncated: true,
      _originalSize: metaStr.length,
      _truncatedSize: this.maxMetaLength
    };
  }
  
  /**
   * 提取错误详情
   */
  private extractErrorDetails(error: Error): any {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      // 对于自定义错误类型，提取额外属性
      ...(error as any).errorCode && { errorCode: (error as any).errorCode },
      ...(error as any).errorDetails && { errorDetails: (error as any).errorDetails }
    };
  }

  /**
   * 创建日志条目
   * @param timestamp 时间戳
   * @param level 日志级别
   * @param message 日志消息
   * @param meta 附加元数据
   * @param contextId 请求上下文ID
   */
  private createLogEntry(timestamp: string, level: LogLevel, message: string, meta?: any, contextId?: string): string | object {
    const baseEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...(contextId && this.enableRequestTracking) && { contextId }
    };

    // 如果有附加元数据，合并到日志条目中
    const logEntry = meta ? { ...baseEntry, ...meta } : baseEntry;

    // 根据配置返回JSON格式或格式化字符串
    if (this.jsonFormat) {
      return logEntry;
    } else {
      return this.formatLogString(logEntry);
    }
  }

  /**
   * 格式化日志字符串
   * @param logEntry 日志条目对象
   */
  private formatLogString(logEntry: any): string {
    const { timestamp, level, service, message, ...meta } = logEntry;
    
    let formattedLog = `[${timestamp}] [${level.toUpperCase()}] [${service}] ${message}`;
    
    // 添加元数据（如果有）
    if (Object.keys(meta).length > 0) {
      formattedLog += ` - ${JSON.stringify(meta)}`;
    }
    
    return formattedLog;
  }

  /**
   * 输出日志到控制台
   * @param level 日志级别
   * @param logEntry 日志条目
   */
  private outputToConsole(level: LogLevel, logEntry: string | object): void {
    const logString = typeof logEntry === 'string' ? logEntry : JSON.stringify(logEntry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logString);
        break;
    }
  }

  /**
   * 输出日志到文件
   * @param logEntry 日志条目
   */
  private outputToFile(logEntry: string | object): void {
    try {
      // 在实际应用中，这里应该使用文件系统模块写入日志文件
      // 为了简化示例，这里只记录日志
      const logString = typeof logEntry === 'string' ? logEntry : JSON.stringify(logEntry);
      console.log(`[Logger] 写入文件日志: ${logString}`);
    } catch (error) {
      console.error('[Logger] 写入文件日志失败:', error);
    }
  }

  /**
   * 设置日志级别
   * @param level 新的日志级别
   */
  public setLevel(level: LogLevel): void {
    this.level = level;
    this.info(`日志级别已更改为: ${level}`);
  }

  /**
   * 启用/禁用JSON格式日志
   * @param enabled 是否启用
   */
  public setJsonFormat(enabled: boolean): void {
    this.jsonFormat = enabled;
    this.info(`JSON格式日志已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 创建结构化日志条目
   * @param message 日志消息
   * @param data 结构化数据
   * @returns 结构化日志对象
   */
  public createStructuredLog(message: string, data?: any): object {
    return {
      message,
      data: data || {},
      service: this.serviceName,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 设置请求上下文
   * @param contextId 上下文ID
   * @param context 上下文数据
   */
  public setContext(contextId: string, context: any): void {
    if (!this.enableRequestTracking) return;
    
    // 清理过期的上下文
    this.cleanupOldContexts();
    
    this.contextStore.set(contextId, {
      ...context,
      createdAt: Date.now()
    });
  }
  
  /**
   * 获取请求上下文
   * @param contextId 上下文ID
   */
  public getContext(contextId: string): any {
    if (!this.enableRequestTracking) return null;
    
    const context = this.contextStore.get(contextId);
    if (context) {
      // 更新最后访问时间
      context.lastAccessed = Date.now();
      this.contextStore.set(contextId, context);
      return { ...context };
    }
    
    return null;
  }
  
  /**
   * 清理上下文
   * @param contextId 上下文ID
   */
  public clearContext(contextId: string): void {
    if (!this.enableRequestTracking) return;
    this.contextStore.delete(contextId);
  }
  
  /**
   * 清理过期的上下文（防止内存泄漏）
   */
  private cleanupOldContexts(): void {
    const now = Date.now();
    const MAX_CONTEXT_AGE = 3600000; // 上下文最大保留时间：1小时
    
    for (const [contextId, context] of this.contextStore.entries()) {
      if (now - context.createdAt > MAX_CONTEXT_AGE) {
        this.contextStore.delete(contextId);
      }
    }
  }
  
  /**
   * 记录转换操作的性能指标
   * @param operation 操作名称
   * @param duration 执行时间（毫秒）
   * @param result 操作结果
   * @param contextId 请求上下文ID
   */
  public logPerformance(operation: string, duration: number, result: 'success' | 'error' | 'warning', contextId?: string): void {
    const performanceMeta = {
      operation,
      duration,
      result,
      timestamp: new Date().toISOString()
    };
    
    // 根据操作结果选择日志级别
    switch (result) {
      case 'error':
        this.warn(`性能警告 - ${operation}`, performanceMeta, contextId);
        break;
      case 'warning':
        this.info(`性能提示 - ${operation}`, performanceMeta, contextId);
        break;
      default:
        this.debug(`性能日志 - ${operation}`, performanceMeta, contextId);
    }
  }
}

// 导出一个默认的日志服务实例，方便直接使用
export const defaultLogger = new LoggerService('ConversionServiceV2');
