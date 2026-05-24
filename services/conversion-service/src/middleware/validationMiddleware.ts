/**
 * @file 验证中间件
 * @description 对API请求进行参数验证
 * @module middleware/validationMiddleware
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-15
 * @updated 2024-11-15
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * 创建验证中间件
 * @param schema 验证模式
 * @returns Express中间件函数
 */
export function validationMiddleware(schema: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 提取验证规则并应用
    const validations: ValidationChain[] = [];
    
    if (schema.body) {
      Object.keys(schema.body).forEach(field => {
        const rules = schema.body[field];
        if (rules.notEmpty) {
          // 简单验证实现
          validations.push(
            (req: Request, res: Response, next: NextFunction) => {
              if (!req.body[field] && rules.notEmpty.errorMessage) {
                const errors = validationResult(req);
                errors.array().push({
                  param: field,
                  msg: rules.notEmpty.errorMessage,
                  location: 'body'
                });
                return next();
              }
              next();
            }
          );
        }
        
        if (rules.isIn && req.body[field]) {
          const allowedValues = rules.isIn.options[0];
          validations.push(
            (req: Request, res: Response, next: NextFunction) => {
              if (!allowedValues.includes(req.body[field])) {
                const errors = validationResult(req);
                errors.array().push({
                  param: field,
                  msg: rules.isIn.errorMessage || `值必须是 ${allowedValues.join(', ')} 之一`,
                  location: 'body'
                });
                return next();
              }
              next();
            }
          );
        }
      });
    }
    
    // 立即执行验证
    let hasErrors = false;
    const validationErrors = validationResult(req);
    
    // 手动验证逻辑
    if (schema.body) {
      Object.keys(schema.body).forEach(field => {
        const rules = schema.body[field];
        
        // 检查必填字段
        if (rules.notEmpty && !req.body[field] && !rules.optional) {
          validationErrors.array().push({
            param: field,
            msg: rules.notEmpty.errorMessage || `${field} 是必填字段`,
            location: 'body'
          });
          hasErrors = true;
        }
        
        // 检查值是否在允许的范围内
        if (rules.isIn && req.body[field] && !rules.isIn.options[0].includes(req.body[field])) {
          validationErrors.array().push({
            param: field,
            msg: rules.isIn.errorMessage || `${field} 必须是 ${rules.isIn.options[0].join(', ')} 之一`,
            location: 'body'
          });
          hasErrors = true;
        }
      });
    }
    
    // 如果有验证错误，返回错误响应
    if (hasErrors) {
      res.status(400).json({
        success: false,
        errors: validationErrors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
      return;
    }
    
    next();
  };
}
