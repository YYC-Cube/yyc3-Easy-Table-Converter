/**
 * @file 转换引擎服务主入口
 * @description 提供文件格式转换功能的微服务，支持单文件和批量转换
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-19
 * @updated 2024-11-20
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// 配置导入
dotenv.config();
import connectRedis from './config/redis';

// 路由导入
import conversionRoutes from './routes/conversionRoutes';
import healthRoutes from './routes/healthRoutes';
import performanceRoutes from './routes/performanceRoutes';

// 中间件导入
import { authMiddleware } from './middlewares/authMiddleware';
import { errorHandler } from './utils/errorHandler';
import { logger } from './utils/logger';
import { QueueManager } from './utils/queueManager';
import { SystemMonitor } from './utils/systemMonitor';

// 服务导入
import { ConversionService } from './services/conversionService';
import { StorageService } from './services/storageService';

// 常量定义
const PORT = process.env.PORT || 3100;
const HOST = process.env.HOST || '0.0.0.0';

// 初始化 Express 应用
const app: Express = express();
const server = http.createServer(app);

// 中间件配置
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));



// 服务初始化
let conversionService: ConversionService | null = null;
let storageService: StorageService | null = null;
let queueManager: QueueManager | null = null;
let systemMonitor: SystemMonitor | null = null;

// 初始化所有服务
async function initializeServices(): Promise<void> {
  try {
    // 连接Redis
    await connectRedis();
    
    // 初始化队列管理器
    queueManager = new QueueManager();
    
    // 初始化存储服务
    storageService = new StorageService();
    
    // 初始化转换服务
    conversionService = new ConversionService(storageService, queueManager);
    
    // 初始化系统监控
    systemMonitor = new SystemMonitor({ checkInterval: 60000 });
    systemMonitor.startMonitoring();
    
    // 初始化路由
    app.use('/api/convert', conversionRoutes({ conversionService }));
    
    app.use('/api/health', healthRoutes());
    app.use('/api/performance', performanceRoutes({
      systemMonitor
    }));
    
    logger.info('所有服务初始化成功');
  } catch (error) {
    logger.error('服务初始化失败:', error);
    throw error;
  }
}



// 健康检查端点
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'conversion-engine',
    timestamp: new Date().toISOString(),
    features: {
      singleConversion: conversionService !== null,
      queueProcessing: queueManager !== null,
      systemMonitoring: systemMonitor !== null
    }
  });
});

// 全局错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 启动服务
async function startServer(): Promise<void> {
  try {
    await initializeServices();
    
    server.listen(parseInt(PORT as string), HOST, () => {
      logger.info(`🚀 转换引擎服务运行在 http://${HOST}:${PORT}`);
      logger.info(`🔍 健康检查: http://${HOST}:${PORT}/health`);
      logger.info(`✅ 支持的功能: 单文件转换`);
    });
    
    // 优雅关闭处理
    process.on('SIGTERM', shutdownServer);
    process.on('SIGINT', shutdownServer);
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭服务器
async function shutdownServer(signal: string): Promise<void> {
  console.log(`接收到 ${signal} 信号，正在关闭服务器...`);
  
  try {
    // 停止系统监控
    if (systemMonitor) {
      systemMonitor.stopMonitoring();
    }
    
    // 关闭队列管理器
    if (queueManager) {
      await queueManager.close();
    }
    

    
    // 关闭服务器
    server.close(() => {
      console.log('服务器已成功关闭');
      process.exit(0);
    });
    
    // 设置超时
    setTimeout(() => {
      console.error('强制关闭服务器');
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error('关闭服务器时发生错误:', error);
    process.exit(1);
  }
}

// 启动应用
startServer();
