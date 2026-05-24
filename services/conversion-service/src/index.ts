/**
 * @file 微服务转换引擎入口
 * @description 高性能数据转换微服务主模块
 * @module services/conversion-service
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-22
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { ConversionEngine } from './engine/ConversionEngine';
import { JobQueueService } from './services/JobQueueService';
// import { StorageService } from './services/StorageService'; // 移除未使用的导入
import { ConfigService } from './services/ConfigService';
import { LoggerService } from './services/LoggerService';
// import conversionRoutes from './routes/conversionRoutes'; // 暂时注释，等待修复路由文件
import healthRoutes from './routes/healthRoutes';
import { errorHandler } from './middleware'; // 只导入需要的中间件

// 加载环境变量
dotenv.config();

// 初始化配置服务
const configService = ConfigService.getInstance();
const config = configService.getConfig();

// 初始化日志服务
  const logger = new LoggerService(config.serviceName, {
    level: 'info' as any,
    enableFileLogging: false,
    logFilePath: './logs/service.log',
    jsonFormat: false
  });

logger.info('正在启动转换服务...');
logger.debug(`配置信息: ${JSON.stringify(config, null, 2)}`);

// 创建Express应用实例
const app = express();
const server = createServer(app);

// 配置Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*', // 简化配置，避免引用不存在的属性
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingInterval: config.websocket?.heartbeatIntervalMs || 25000,
  pingTimeout: config.websocket?.connectionTimeoutMs || 5000
});

// 中间件配置 - 简化CORS配置并使用环境变量优先
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
  }));
  app.use(express.json({ limit: '50mb' })); // 简化配置
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // 简化配置

// 初始化监控服务（简化版本）
  if (process.env.NODE_ENV === 'development') {
    // 性能监控逻辑
    const performanceLogger = (req: any, res: any, next: Function) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`[性能] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });
      next();
    };
    app.use(performanceLogger);
  }

// 初始化服务
const conversionEngine = new ConversionEngine(config.conversionEngine);
const jobQueueService = new JobQueueService();
// 初始化存储服务 - 暂时注释，等待配置修复
// const storageService = new StorageService({});

// 依赖注入 - 在全局对象中存储服务实例
app.locals.conversionEngine = conversionEngine;
app.locals.jobQueueService = jobQueueService;
// app.locals.storageService = storageService; // 移除未定义的引用
app.locals.io = io;
app.locals.configService = configService;
app.locals.logger = logger;

// 路由配置
// 临时注释路由，等待修复路由文件
// app.use('/api/conversion', conversionRoutes);
app.use('/api/health', healthRoutes);

// Socket.IO事件处理
if (config.websocket?.enabled !== false) {
  io.on('connection', (socket) => {
    logger.info('新的客户端连接', { socketId: socket.id });
    
    // 监听任务状态查询事件
    socket.on('query_job_status', async (jobId: string) => {
      try {
        const status = await jobQueueService.getJobStatus(jobId);
        socket.emit('job_status_update', { jobId, status });
      } catch (error) {
        logger.error('查询任务状态失败', { 
          jobId, 
          error: error instanceof Error ? error.message : String(error) 
        });
        socket.emit('error', { jobId, error: error instanceof Error ? error.message : String(error) });
      }
    });
    
    // 断开连接处理
    socket.on('disconnect', () => {
      logger.info('客户端断开连接', { socketId: socket.id });
      // 清理与该客户端相关的资源
      // 暂时注释掉，因为JobQueueService中没有cleanupSocketResources方法
  // jobQueueService.cleanupSocketResources(socket.id);
    });
  });
} else {
  logger.info('WebSocket功能已禁用');
}

// 统一错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = config.port || process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info('转换服务启动成功', {
    port: PORT,
    healthCheckUrl: `http://localhost:${PORT}/api/health`,
    conversionApiUrl: `http://localhost:${PORT}/api/conversion`,
    environment: config.environment
  });
  
  // 初始化消息队列消费者
  jobQueueService.initializeWorker();
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  logger.info('收到关闭信号，正在优雅关闭...');
  
  // 停止接受新请求
  // 暂时注释掉，因为JobQueueService中没有pauseQueue方法
  // jobQueueService.pauseQueue();
  
  // 等待正在处理的任务完成
  setTimeout(() => {
    server.close(() => {
      logger.info('服务器已关闭');
      process.exit(0);
    });
  }, 5000); // 默认5秒超时
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在优雅关闭...');
  
  // 停止接受新请求
  // 暂时注释掉，因为JobQueueService中没有pauseQueue方法
  // jobQueueService.pauseQueue();
  
  // 等待正在处理的任务完成
  setTimeout(() => {
    server.close(() => {
      logger.info('服务器已关闭');
      process.exit(0);
    });
  }, 5000); // 默认5秒超时
});

// 监听未处理的Promise拒绝
process.on('unhandledRejection', (reason) => {
  logger.error('未处理的Promise拒绝', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
});

// 监听未捕获的异常
process.on('uncaughtException', (error) => {
  logger.fatal('未捕获的异常', {
    error: error.message,
    stack: error.stack
  });
  
  // 记录错误后退出进程
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

export default app;
