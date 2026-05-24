/**
 * @file 中间件模块索引
 * @description 统一导出所有中间件组件
 * @module middleware
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-22
 */

// 导入中间件
import errorHandler from './errorHandler';
import loggerMiddleware from './loggerMiddleware';

// 中间件集合
export const middlewares = {
  errorHandler,
  loggerMiddleware
};

// 导出单个中间件
export { errorHandler, loggerMiddleware };

// 导出中间件配置助手
export { createLoggerMiddleware } from './loggerMiddleware';
export { validateRequest, asyncHandler, zodValidator } from './errorHandler';

/**
 * @description 应用所有核心中间件的辅助函数
 * @param app - Express应用实例
 */
export function applyCoreMiddlewares(app: any): void {
  // 导入必要的中间件
  const { loggerMiddleware } = middlewares;
  
  // 应用请求日志中间件
  app.use(loggerMiddleware);
  
  // 应用错误处理中间件（应在路由之后应用）
  // 注意：这是一个占位符，实际应用时需要在所有路由之后调用
  // app.use(notFoundHandler);
  // app.use(errorHandler);
}

export default middlewares;