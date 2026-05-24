/**
 * @file 文件上传中间件
 * @description 处理文件上传并验证文件格式和大小
 * @module middleware/fileUploadMiddleware
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-15
 * @updated 2024-11-15
 */

import { Request, Response, NextFunction } from 'express';
import multer, { Multer, FileFilterCallback } from 'multer';
import { LoggerService } from '../services/LoggerService';

interface FileUploadOptions {
  allowedTypes: string[];
  maxSize: number;
}

/**
 * 文件上传中间件
 * @param options 上传选项
 * @returns Express中间件
 */
export function fileUploadMiddleware(options: FileUploadOptions): Multer {
  const logger = new LoggerService('FileUploadMiddleware');
  
  // 内存存储配置
  const storage = multer.memoryStorage();
  
  // 文件过滤器
  const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    // 获取文件扩展名
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    
    // 检查文件类型是否允许
    if (fileExtension && options.allowedTypes.includes(fileExtension)) {
      logger.info('文件类型验证通过', { filename: file.originalname, type: fileExtension });
      cb(null, true);
    } else {
      logger.warn('不允许的文件类型', {
        filename: file.originalname,
        type: fileExtension,
        allowedTypes: options.allowedTypes
      });
      cb(new Error(`不支持的文件类型。允许的类型: ${options.allowedTypes.join(', ')}`));
    }
  };
  
  // 配置multer
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: options.maxSize,
      files: 1 // 一次只允许上传一个文件
    },
    preservePath: true
  }).single('file'); // 单个文件上传，字段名为'file'
}
