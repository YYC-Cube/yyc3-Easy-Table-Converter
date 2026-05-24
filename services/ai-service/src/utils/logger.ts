/**
 * @file 日志工具模块
 * @description 提供统一的日志记录功能，支持不同级别和格式的日志输出
 * @module utils/logger
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

// 定义日志级别
const logLevel = process.env.LOG_LEVEL || 'info';

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    
    // 开发环境使用更友好的格式
    if (process.env.NODE_ENV === 'development') {
      return `[${timestamp}] ${level.toUpperCase()}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    }
    
    // 生产环境使用JSON格式
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// 创建日志实例
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'ai-service' },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.colorize({
        all: true,
        colors: {
          error: 'red',
          warn: 'yellow',
          info: 'green',
          debug: 'blue',
          verbose: 'cyan',
          silly: 'magenta'
        }
      })
    }),
    // 错误日志文件
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    })
  ]
});

// 确保日志目录存在
import fs from 'fs';
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 封装不同级别的日志方法
export {
  logger
};

// 导出类型
export type Logger = typeof logger;

/**
 * 创建特定上下文的日志记录器
 * @param context 日志上下文
 * @returns 带有上下文的日志记录器
 */
export function createLoggerWithContext(context: string): Logger {
  return logger.child({ context });
}

/**
 * 记录API请求日志
 * @param method HTTP方法
 * @param path 请求路径
 * @param statusCode 状态码
 * @param responseTime 响应时间
 * @param clientIp 客户端IP
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  responseTime: number,
  clientIp: string
): void {
  // 根据状态码决定日志级别
  let level: keyof Logger = 'info';
  if (statusCode >= 500) {
    level = 'error';
  } else if (statusCode >= 400) {
    level = 'warn';
  }
  
  logger[level]({
    message: 'API请求',
    method,
    path,
    statusCode,
    responseTime: `${responseTime}ms`,
    clientIp
  });
}

/**
 * 记录AI处理日志
 * @param operation 操作类型
 * @param result 处理结果
 * @param duration 处理时长
 */
export function logAiProcessing(
  operation: string,
  result: string,
  duration: number
): void {
  logger.info({
    message: 'AI处理',
    operation,
    result,
    duration: `${duration}ms`
  });
}