/**
 * @file 认证中间件
 * @description 处理API请求的认证和授权
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { Request, Response, NextFunction } from 'express';
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authMiddleware.d.ts.map