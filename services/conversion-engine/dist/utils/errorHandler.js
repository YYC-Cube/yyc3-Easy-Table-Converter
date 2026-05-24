"use strict";
/**
 * @file 错误处理工具
 * @description 提供统一的错误处理机制
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.RateLimitError = exports.ValidationError = exports.ConversionError = void 0;
// 自定义错误类
class ConversionError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ConversionError';
    }
}
exports.ConversionError = ConversionError;
class ValidationError extends Error {
    constructor(message, fields) {
        super(message);
        this.fields = fields;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class RateLimitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
/**
 * 全局错误处理中间件
 * @param err 错误对象
 * @param req 请求对象
 * @param res 响应对象
 * @param next 下一个中间件
 */
const errorHandler = (err, req, res, next) => {
    console.error('🚨 错误详情:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    // 根据错误类型返回不同的状态码和响应
    if (err instanceof ValidationError) {
        return res.status(400).json({
            error: '请求参数验证失败',
            message: err.message,
            fields: err.fields || []
        });
    }
    if (err instanceof RateLimitError) {
        return res.status(429).json({
            error: '请求频率过高',
            message: err.message,
            retryAfter: '15 minutes'
        });
    }
    if (err instanceof ConversionError) {
        return res.status(500).json({
            error: '转换失败',
            message: err.message,
            code: err.code,
            details: err.details || {}
        });
    }
    // 未知错误
    return res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map