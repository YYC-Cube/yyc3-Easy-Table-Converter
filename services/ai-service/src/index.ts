/**
 * @file AI服务入口文件
 * @description AI增强功能服务模块的主入口，配置服务器和路由
 * @module index
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

// 导入路由
import textProcessingRoutes from './routes/text-processing.routes';
import imageProcessingRoutes from './routes/image-processing.routes';
import dataAnalysisRoutes from './routes/data-analysis.routes';
import aiConfigRoutes from './routes/ai-config.routes';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3300;

// 中间件配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", process.env.API_BASE_URL || '']
    }
  }
}));

app.use(compression());
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ai-service',
    timestamp: new Date().toISOString()
  });
});

// API路由前缀
const apiPrefix = '/api/v1';

// 注册路由
app.use(`${apiPrefix}/text`, textProcessingRoutes);
app.use(`${apiPrefix}/image`, imageProcessingRoutes);
app.use(`${apiPrefix}/data`, dataAnalysisRoutes);
app.use(`${apiPrefix}/config`, aiConfigRoutes);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('AI服务错误:', { error: err.message, stack: err.stack, path: req.path });
  
  // 自定义错误处理
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: '请求参数验证失败',
      details: err.details,
      code: 'VALIDATION_ERROR'
    });
  }
  
  if (err.status === 404) {
    return res.status(404).json({
      error: '请求的资源不存在',
      code: 'NOT_FOUND'
    });
  }
  
  // 默认500错误
  return res.status(500).json({
    error: '服务器内部错误',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? '服务器繁忙，请稍后再试' : err.message
  });
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`AI服务已启动，监听端口: ${PORT}`);
  logger.info(`API文档地址: http://localhost:${PORT}/api/v1/docs`);
  logger.info(`健康检查地址: http://localhost:${PORT}/health`);
});

// 处理进程信号，优雅关闭
process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，准备关闭AI服务...');
  shutdownServer();
});

process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，准备关闭AI服务...');
  shutdownServer();
});

/**
 * 优雅关闭服务器
 */
async function shutdownServer() {
  try {
    // 可以在这里关闭数据库连接、清理资源等
    logger.info('AI服务已成功关闭');
    process.exit(0);
  } catch (error) {
    logger.error('关闭服务器时发生错误:', error);
    process.exit(1);
  }
}