/**
 * @file 安全工具
 * @description 提供存储服务的安全功能和最佳实践
 * @module utils/securityUtils
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 * @updated 2024-11-25
 */

import crypto from 'crypto';
import path from 'path';
import { Request } from 'express';

// 安全配置
export const SECURITY_CONFIG = {
  // 文件验证
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_MIME_TYPES: [
    // 文本文件
    'text/plain',
    'text/csv',
    'text/xml',
    'text/html',
    'application/json',
    'application/xml',
    // 电子表格
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.spreadsheet',
    // JSON格式
    'application/json',
    // 压缩文件
    'application/zip',
    'application/x-gzip',
  ],
  // 密码学
  HASH_ALGORITHM: 'sha256',
  SALT_ROUNDS: 12,
  // URL签名
  URL_SIGNATURE_EXPIRY: 3600, // 1小时（秒）
  // 速率限制
  MAX_REQUESTS_PER_MINUTE: 60,
  // CORS
  ALLOWED_ORIGINS: ['http://localhost:3000', 'http://localhost:3100'],
};

/**
 * 验证文件安全性
 */
export function validateFileSecurity(file: {
  originalname: string;
  mimetype: string;
  size: number;
}): { isValid: boolean; error?: string } {
  // 检查文件大小
  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `文件大小超过限制 (${file.size} > ${SECURITY_CONFIG.MAX_FILE_SIZE} bytes)`,
    };
  }

  // 检查文件扩展名和MIME类型匹配
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // 验证MIME类型
  if (!SECURITY_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      error: `不支持的文件类型: ${mimeType}`,
    };
  }

  // 基本的文件路径安全检查
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return {
      isValid: false,
      error: '文件名包含不安全字符',
    };
  }

  return { isValid: true };
}

/**
 * 生成文件内容的哈希值
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash(SECURITY_CONFIG.HASH_ALGORITHM).update(buffer).digest('hex');
}

/**
 * 验证文件完整性
 */
export function verifyFileIntegrity(buffer: Buffer, expectedHash: string): boolean {
  const actualHash = calculateFileHash(buffer);
  return actualHash === expectedHash;
}

/**
 * 生成安全的文件名
 */
export function generateSafeFilename(originalName: string): string {
  // 保留原始扩展名
  const extension = path.extname(originalName).toLowerCase();
  // 生成随机文件名
  const safeName = crypto.randomBytes(16).toString('hex');
  return `${safeName}${extension}`;
}

/**
 * 验证请求来源（CORS检查）
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.origin;
  if (!origin) return true; // 允许无来源请求（如浏览器直接请求）
  
  return SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin);
}

/**
 * 验证用户权限
 */
export function validateUserPermission(userId: string, resourceUserId: string | undefined): boolean {
  // 检查用户是否有权限访问资源
  return userId === resourceUserId;
}

/**
 * 生成安全的临时URL签名
 */
export function generateSignedUrl(
  resourcePath: string,
  expiresIn: number = SECURITY_CONFIG.URL_SIGNATURE_EXPIRY
): { url: string; signature: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  const dataToSign = `${resourcePath}:${expiresAt}`;
  
  // 使用环境变量中的密钥进行签名
  const signature = crypto
    .createHmac(SECURITY_CONFIG.HASH_ALGORITHM, process.env.SIGNATURE_SECRET || 'default-secret')
    .update(dataToSign)
    .digest('hex');
  
  // 创建签名URL参数
  const signedUrl = `${resourcePath}?expires=${expiresAt}&signature=${signature}`;
  
  return { url: signedUrl, signature, expiresAt };
}

/**
 * 验证签名URL
 */
export function verifySignedUrl(
  resourcePath: string,
  expiresAt: number,
  signature: string
): boolean {
  // 检查是否过期
  if (expiresAt < Math.floor(Date.now() / 1000)) {
    return false;
  }
  
  // 重新生成签名
  const dataToSign = `${resourcePath}:${expiresAt}`;
  const expectedSignature = crypto
    .createHmac(SECURITY_CONFIG.HASH_ALGORITHM, process.env.SIGNATURE_SECRET || 'default-secret')
    .update(dataToSign)
    .digest('hex');
  
  // 使用时间安全的比较
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * 清理用户输入
 */
export function sanitizeInput(input: string): string {
  // 移除潜在的危险字符和HTML标签
  return input
    .replace(/[<>"'&]/g, '') // 移除HTML特殊字符
    .trim() // 移除首尾空白
    .substring(0, 1000); // 限制长度
}

/**
 * 生成随机安全令牌
 */
export function generateSecurityToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 验证环境变量完整性
 */
export function validateEnvironmentVariables(): string[] {
  const requiredVariables = [
    'NODE_ENV',
    // 'SIGNATURE_SECRET', // 可选，但建议配置
  ];
  
  const missingVariables: string[] = [];
  
  for (const variable of requiredVariables) {
    if (!process.env[variable]) {
      missingVariables.push(variable);
    }
  }
  
  // 检查敏感信息是否使用了默认值
  const securityWarnings: string[] = [];
  
  if (process.env.SIGNATURE_SECRET === 'default-secret') {
    securityWarnings.push('使用了默认的签名密钥，建议在生产环境中修改');
  }
  
  return [...missingVariables, ...securityWarnings];
}

/**
 * 创建安全的错误响应
 */
export function createSafeErrorResponse(
  error: unknown,
  isDevelopment: boolean
): { status: number; message: string; details?: any } {
  const defaultError = {
    status: 500,
    message: '服务器内部错误',
  };
  
  if (isDevelopment && error instanceof Error) {
    return {
      status: 500,
      message: error.message,
      details: error.stack,
    };
  }
  
  // 针对不同类型的错误返回适当的错误消息
  if (error instanceof Error) {
    if (error.message.includes('文件不存在')) {
      return {
        status: 404,
        message: '文件不存在',
      };
    }
    if (error.message.includes('权限')) {
      return {
        status: 403,
        message: '权限不足',
      };
    }
  }
  
  return defaultError;
}

/**
 * 日志敏感信息屏蔽
 */
export function maskSensitiveInfo(data: any): any {
  if (typeof data !== 'object' || data === null) return data;
  
  const sensitiveFields = [
    'password',
    'secret',
    'key',
    'token',
    'credential',
    'authorization',
    'accessKeyId',
    'secretAccessKey',
  ];
  
  const result = { ...data };
  
  for (const field of sensitiveFields) {
    if (result[field]) {
      result[field] = '****' + (result[field] as string).slice(-4);
    }
  }
  
  return result;
}
