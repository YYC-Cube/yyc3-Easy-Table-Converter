"use strict";
/**
 * @file 转换引擎服务主入口
 * @description 提供文件格式转换功能的微服务，支持单文件和批量转换
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-19
 * @updated 2024-11-20
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
// 配置导入
dotenv_1.default.config();
const redis_1 = __importDefault(require("./config/redis"));
// 路由导入
const conversionRoutes_1 = __importDefault(require("./routes/conversionRoutes"));
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const performanceRoutes_1 = __importDefault(require("./routes/performanceRoutes"));
const logger_1 = require("./utils/logger");
const queueManager_1 = require("./utils/queueManager");
const systemMonitor_1 = require("./utils/systemMonitor");
// 服务导入
const conversionService_1 = require("./services/conversionService");
const storageService_1 = require("./services/storageService");
// 常量定义
const PORT = process.env.PORT || 3100;
const HOST = process.env.HOST || '0.0.0.0';
// 初始化 Express 应用
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// 中间件配置
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// 服务初始化
let conversionService = null;
let storageService = null;
let queueManager = null;
let systemMonitor = null;
// 初始化所有服务
async function initializeServices() {
    try {
        // 连接Redis
        await (0, redis_1.default)();
        // 初始化队列管理器
        queueManager = new queueManager_1.QueueManager();
        // 初始化存储服务
        storageService = new storageService_1.StorageService();
        // 初始化转换服务
        conversionService = new conversionService_1.ConversionService(storageService, queueManager);
        // 初始化系统监控
        systemMonitor = new systemMonitor_1.SystemMonitor({ checkInterval: 60000 });
        systemMonitor.startMonitoring();
        // 初始化路由
        app.use('/api/convert', (0, conversionRoutes_1.default)({ conversionService }));
        app.use('/api/health', (0, healthRoutes_1.default)());
        app.use('/api/performance', (0, performanceRoutes_1.default)({
            systemMonitor
        }));
        logger_1.logger.info('所有服务初始化成功');
    }
    catch (error) {
        logger_1.logger.error('服务初始化失败:', error);
        throw error;
    }
}
// 健康检查端点
app.get('/health', (req, res) => {
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
app.use((err, req, res, next) => {
    console.error('🚨 错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
    });
});
// 启动服务
async function startServer() {
    try {
        await initializeServices();
        server.listen(parseInt(PORT), HOST, () => {
            logger_1.logger.info(`🚀 转换引擎服务运行在 http://${HOST}:${PORT}`);
            logger_1.logger.info(`🔍 健康检查: http://${HOST}:${PORT}/health`);
            logger_1.logger.info(`✅ 支持的功能: 单文件转换`);
        });
        // 优雅关闭处理
        process.on('SIGTERM', shutdownServer);
        process.on('SIGINT', shutdownServer);
    }
    catch (error) {
        console.error('❌ 服务启动失败:', error);
        process.exit(1);
    }
}
// 优雅关闭服务器
async function shutdownServer(signal) {
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
    }
    catch (error) {
        console.error('关闭服务器时发生错误:', error);
        process.exit(1);
    }
}
// 启动应用
startServer();
//# sourceMappingURL=index.js.map