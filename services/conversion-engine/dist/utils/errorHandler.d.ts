/**
 * @file 错误处理工具
 * @description 提供统一的错误处理机制
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
export declare class ConversionError extends Error {
    code?: string | undefined;
    details?: any | undefined;
    constructor(message: string, code?: string  , details?: any  );
}
export declare class ValidationError extends Error {
    fields?: string[] | undefined;
    constructor(message: string, fields?: string[]  );
}
export declare class RateLimitError extends Error {
    constructor(message: string);
}
/**
 * 全局错误处理中间件
 * @param err 错误对象
 * @param req 请求对象
 * @param res 响应对象
 * @param next 下一个中间件
 */
export declare const errorHandler: (err: Error, req: any, res: any, next: any) => any;
//# sourceMappingURL=errorHandler.d.ts.map