/**
 * @file 日志工具
 * @description 提供统一的日志记录功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LoggerConfig {
    level?: LogLevel;
    prettyPrint?: boolean;
    serviceName?: string;
}
/**
 * 日志工具类
 */
export declare class Logger {
    private level;
    private prettyPrint;
    private serviceName?;
    constructor(config?: LoggerConfig);
    /**
     * 检查日志级别是否允许输出
     * @param level 日志级别
     */
    private shouldLog;
    /**
     * 格式化日志消息
     * @param level 日志级别
     * @param message 日志消息
     * @param data 附加数据
     */
    private formatMessage;
    /**
     * 调试日志
     * @param message 日志消息
     * @param data 附加数据
     */
    debug(message: string, data?: any): void;
    /**
     * 信息日志
     * @param message 日志消息
     * @param data 附加数据
     */
    info(message: string, data?: any): void;
    /**
     * 警告日志
     * @param message 日志消息
     * @param data 附加数据
     */
    warn(message: string, data?: any): void;
    /**
     * 错误日志
     * @param message 日志消息
     * @param data 附加数据
     */
    error(message: string, data?: any): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map