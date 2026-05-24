/**
 * @file 日志工具
 * @description 提供统一的日志记录功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

// 日志级别
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 日志配置接口
interface LoggerConfig {
  level?: LogLevel;
  prettyPrint?: boolean;
  serviceName?: string;
}

/**
 * 日志工具类
 */
export class Logger {
  private level: LogLevel;
  private prettyPrint: boolean;
  private serviceName?: string;

  constructor(config?: LoggerConfig) {
    this.level = config?.level || 'info';
    this.prettyPrint = config?.prettyPrint || true;
    this.serviceName = config?.serviceName;
  }

  /**
   * 检查日志级别是否允许输出
   * @param level 日志级别
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  /**
   * 格式化日志消息
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   */
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const service = this.serviceName ? `[${this.serviceName}]` : '';
    const levelStr = `[${level.toUpperCase()}]`;

    if (!data) {
      return `${timestamp} ${service} ${levelStr} ${message}`;
    }

    if (this.prettyPrint) {
      return `${timestamp} ${service} ${levelStr} ${message}\n${JSON.stringify(data, null, 2)}`;
    } else {
      return `${timestamp} ${service} ${levelStr} ${message} ${JSON.stringify(data)}`;
    }
  }

  /**
   * 调试日志
   * @param message 日志消息
   * @param data 附加数据
   */
  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  /**
   * 信息日志
   * @param message 日志消息
   * @param data 附加数据
   */
  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  /**
   * 警告日志
   * @param message 日志消息
   * @param data 附加数据
   */
  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  /**
   * 错误日志
   * @param message 日志消息
   * @param data 附加数据
   */
  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }
}

// 创建默认日志实例
export const logger = new Logger({
  serviceName: 'conversion-engine',
  level: (process.env.LOG_LEVEL as LogLevel) || 'info'
});
