/**
 * @file 大数据处理服务主入口文件
 * @description YYC³ Easy Table Converter 大数据处理服务的启动入口
 * @module big-data-processor
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import connectMongoDB from './config/mongodb';
import connectRedis from './config/redis';
import initializeQueues from './queues';
import bigDataRoutes from './routes/bigDataRoutes';
import { monitorSystemHealth } from './utils/systemMonitor';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3102;

// 确保处理目录存在
const processingDir = process.env.PROCESSING_DIR || path.join(__dirname, '../processing');
const tempDir = process.env.TEMP_DIR || path.join(processingDir, 'temp');

if (!fs.existsSync(processingDir)) {
  fs.mkdirSync(processingDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 中间件配置
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// WebSocket连接处理
wss.on('connection', (ws, req) => {
  console.log('📡 新的WebSocket连接');
  
  // 发送连接确认
  ws.send(JSON.stringify({
    type: 'connected',
    message: '连接到大数据处理服务'
  }));
  
  // 心跳检测
  const heartbeat = setInterval(() => {
    ws.send(JSON.stringify({ type: 'ping' }));
  }, 30000);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📥 收到消息:', data.type);
      
      // 处理不同类型的消息
      switch (data.type) {
        case 'pong':
          // 心跳响应
          break;
        case 'subscribe':
          // 订阅任务进度
          if (data.taskId) {
            // 这里会在后面的队列处理器中实现订阅逻辑
            console.log(`🔔 客户端订阅任务进度: ${data.taskId}`);
          }
          break;
        default:
          console.warn(`⚠️ 未知消息类型: ${data.type}`);
      }
    } catch (error) {
      console.error('❌ 处理WebSocket消息失败:', error);
    }
  });
  
  ws.on('close', () => {
    clearInterval(heartbeat);
    console.log('📡 WebSocket连接关闭');
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'big-data-processor',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// 性能监控端点
app.get('/metrics', (req, res) => {
  const metrics = monitorSystemHealth();
  res.status(200).json(metrics);
});

// 路由配置
app.use('/api/big-data', bigDataRoutes);

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试',
    timestamp: new Date().toISOString()
  });
});

// 启动服务
async function startServer() {
  try {
    // 连接数据库和缓存
    await connectMongoDB();
    await connectRedis();
    
    // 初始化队列
    await initializeQueues(wss);
    
    // 启动系统监控
    monitorSystemHealth.startMonitoring();
    
    // 启动HTTP服务器
    server.listen(PORT, () => {
      console.log(`🚀 大数据处理服务运行在 http://localhost:${PORT}`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
      console.log(`📊 性能监控: http://localhost:${PORT}/metrics`);
      console.log(`📁 处理目录: ${processingDir}`);
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

// 启动应用
startServer();

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('📢 收到SIGTERM信号，正在关闭服务...');
  server.close(() => {
    console.log('✅ 服务已安全关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📢 收到SIGINT信号，正在关闭服务...');
  server.close(() => {
    console.log('✅ 服务已安全关闭');
    process.exit(0);
  });
});