/**
 * @file 存储服务主入口文件
 * @description YYC³ Easy Table Converter 存储服务的启动入口
 * @module storage-service
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-20
 * @updated 2024-11-23
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import storageRoutes from './routes/storageRoutes';
import connectMongoDB from './config/mongodb';
import { StorageService, StorageServiceConfig } from './services/storageService';
import { StorageAdapterFactory } from './services/adapters/StorageAdapterFactory';
import { rateLimit, RateLimiter } from './utils/performanceOptimizer';
import { sanitizeInput, validateConfigSecurity, setupLogging } from './utils/securityUtils';

// 加载环境变量
dotenv.config();

// 安全配置验证
const securityCheck = validateConfigSecurity(process.env);
if (!securityCheck.isValid) {
  console.error('🚨 配置安全验证失败:', securityCheck.errors);
  process.exit(1);
}

// 验证存储配置
const validateStorageConfig = (config: StorageServiceConfig): void => {
  // 检查默认存储类型是否可用
  const availableTypes = [];
  
  if (config.localConfig) availableTypes.push('local');
  if (config.s3Config) availableTypes.push('s3');
  if (config.gcsConfig) availableTypes.push('gcs');
  
  if (!availableTypes.includes(config.defaultStorageType)) {
    console.warn(`⚠️ 默认存储类型 ${config.defaultStorageType} 未配置，切换到 local`);
    config.defaultStorageType = 'local';
  }
  
  console.log(`✅ 存储配置验证完成，可用存储类型: ${availableTypes.join(', ')}`);
};

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3101;

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置多存储后端支持
const storageConfig: StorageServiceConfig = {
  defaultStorageType: (process.env.DEFAULT_STORAGE_TYPE as 'local' | 's3' | 'gcs') || 'local',
  localConfig: {
    uploadDir,
  },
  s3Config: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET_NAME || 'yyc-table-converter',
    endpoint: process.env.S3_ENDPOINT,
  } : undefined,
  gcsConfig: process.env.GCS_CREDENTIALS ? {
    credentials: JSON.parse(process.env.GCS_CREDENTIALS),
    bucketName: process.env.GCS_BUCKET_NAME || 'yyc-table-converter',
  } : undefined,
};

// 初始化存储服务
validateStorageConfig(storageConfig);
const storageService = new StorageService(storageConfig);

// 设置增强日志系统
setupLogging(app);

// 中间件配置
app.use(helmet());
app.use(cors({ 
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// 性能日志记录
app.use(morgan('combined'));

// 输入清理中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query as Record<string, any>);
  }
  next();
});

// 请求大小限制
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 速率限制
const apiLimiter = rateLimit({ max: 100, windowMs: 15 * 60 * 1000 });
app.use('/api/', apiLimiter);

// 静态文件服务（用于测试文件下载）
app.use('/uploads', express.static(uploadDir));

// 健康检查端点
  app.get('/health', (req, res) => {
    try {
      res.status(200).json({
        status: 'ok',
        service: 'storage-service',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        storageType: storageConfig.defaultStorageType,
        availableStorageTypes: [
          'local',
          storageConfig.s3Config ? 's3' : null,
          storageConfig.gcsConfig ? 'gcs' : null
        ].filter(Boolean),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: '服务健康检查失败' });
    }
  });
  
  // 性能指标接口
  app.get('/metrics', async (req: Request, res: Response) => {
    try {
      res.status(200).json({
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        rateLimiterStats: RateLimiter?.stats ? RateLimiter.stats() : {}
      });
    } catch (error) {
      res.status(500).json({ error: '获取性能指标失败' });
    }
  });
  
  // 存储配置信息端点
  app.get('/config', (req, res) => {
    try {
      const configInfo = {
        defaultStorageType: storageConfig.defaultStorageType,
        availableStorageTypes: [
          'local',
          storageConfig.s3Config ? 's3' : null,
          storageConfig.gcsConfig ? 'gcs' : null
        ].filter(Boolean),
        features: {
          signedUrls: true,
          multipleStorages: true,
          fileExpiry: true
        }
      };
      res.status(200).json(configInfo);
    } catch (error) {
      res.status(500).json({ status: 'error', message: '获取配置信息失败' });
    }
  });

// 路由配置
app.use('/api/storage', storageRoutes(storageService));

// 为路由中间件添加安全增强
app.use('/api/storage/files', apiLimiter);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 记录错误，但避免记录敏感信息
  console.error('🚨 错误:', err);
  
  // 不同类型的错误处理
  if (err.name === 'SyntaxError' && err instanceof SyntaxError) {
    return res.status(400).json({ error: '请求格式错误' });
  }
  
  if (err.status === 429) {
    return res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      retryAfter: 60 // 60秒后重试
    });
  }
  
  // 安全的错误响应
  res.status(500).json({
    error: '服务器内部错误',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || Math.random().toString(36).substring(2),
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 404处理
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ 
    error: 'API路径不存在',
    path: req.path
  });
});

// 启动服务
async function startServer() {
  try {
    // 连接数据库
    await connectMongoDB();
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`🚀 存储服务运行在 http://localhost:${PORT}`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
      console.log(`📁 上传目录: ${uploadDir}`);
      console.log(`🔧 默认存储类型: ${storageConfig.defaultStorageType}`);
      if (storageConfig.s3Config) {
        console.log(`☁️  S3存储已启用，桶名: ${storageConfig.s3Config.bucket}`);
      }
      if (storageConfig.gcsConfig) {
        console.log(`☁️  GCS存储已启用，桶名: ${storageConfig.gcsConfig.bucketName}`);
      }
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

// 启动应用
startServer();

export { app, storageService };