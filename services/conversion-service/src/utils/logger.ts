/**
 * @file 日志工具
 * @description 提供统一的日志记录功能，支持不同日志级别和环境
 * @module utils/logger
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

/**
 * 日志级别枚举
 */
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * 日志配置接口
 */
interface LoggerConfig {
  level: LogLevel;
  serviceName: string;
  prettyPrint: boolean;
}

/**
 * 日志工具类
 */
class Logger {
  private config: LoggerConfig;
  
  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LogLevel[process.env.LOG_LEVEL?.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO,
      serviceName: process.env.SERVICE_NAME || 'conversion-service',
      prettyPrint: process.env.NODE_ENV !== 'production',
      ...config
    };
  }
  
  /**
   * 检查日志级别是否应该被输出
   * @param level 日志级别
   * @returns 是否应该输出
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }
  
  /**
   * 格式化日志消息
   * @param level 日志级别
   * @param message 日志消息
   * @param meta 额外信息
   * @returns 格式化后的日志对象
   */
  private formatLog(level: LogLevel, message: string, meta?: any): any {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service: this.config.serviceName,
      level,
      message
    };
    
    if (meta) {
      return { ...logEntry, meta };
    }
    
    return logEntry;
  }
  
  /**
   * 输出日志
   * @param level 日志级别
   * @param message 日志消息
   * @param meta 额外信息
   */
  private log(level: LogLevel, message: string, meta?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const logEntry = this.formatLog(level, message, meta);
    
    if (this.config.prettyPrint) {
      // 开发环境美化输出
      console[level === LogLevel.ERROR ? 'error' : level](`[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}`, meta || '');
    } else {
      // 生产环境JSON格式输出
      console.log(JSON.stringify(logEntry));
    }
  }
  
  /**
   * 输出调试日志
   * @param message 日志消息
   * @param meta 额外信息
   */
  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }
  
  /**
   * 输出信息日志
   * @param message 日志消息
   * @param meta 额外信息
   */
  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }
  
  /**
   * 输出警告日志
   * @param message 日志消息
   * @param meta 额外信息
   */
  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }
  
  /**
   * 输出错误日志
   * @param message 日志消息
   * @param meta 额外信息或错误对象
   */
  error(message: string, meta?: any): void {
    // 处理错误对象
    if (meta instanceof Error) {
      meta = {
        name: meta.name,
        message: meta.message,
        stack: meta.stack
      };
    }
    this.log(LogLevel.ERROR, message, meta);
  }
}

/**
 * 日志工具实例
 */
export const logger = new Logger();
