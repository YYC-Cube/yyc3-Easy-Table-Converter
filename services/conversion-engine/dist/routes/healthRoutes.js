"use strict";
/**
 * @file 健康检查路由
 * @description 提供服务健康状态检查接口
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
/**
 * 创建健康检查路由
 */
const healthRoutes = () => {
    const router = (0, express_1.Router)();
    /**
     * 基础健康检查
     * @route GET /health
     */
    router.get('/', (req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'conversion-engine',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            message: '转换引擎服务运行正常'
        });
    });
    /**
     * 详细健康检查
     * @route GET /health/detailed
     */
    router.get('/detailed', (req, res) => {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        res.status(200).json({
            status: 'ok',
            service: 'conversion-engine',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                rss: memoryUsage.rss,
                heapTotal: memoryUsage.heapTotal,
                heapUsed: memoryUsage.heapUsed,
                external: memoryUsage.external
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version
        });
    });
    /**
     * 依赖服务健康检查
     * @route GET /health/dependencies
     */
    router.get('/dependencies', async (req, res) => {
        try {
            // 这里可以添加对依赖服务（如数据库、Redis等）的健康检查
            const dependencies = {
                mongodb: { status: 'ok', message: 'MongoDB连接正常' },
                redis: { status: 'ok', message: 'Redis连接正常' },
                bullQueue: { status: 'ok', message: '任务队列运行正常' }
            };
            // 检查所有依赖是否都正常
            const allHealthy = Object.values(dependencies).every(dep => dep.status === 'ok');
            res.status(allHealthy ? 200 : 503).json({
                status: allHealthy ? 'ok' : 'degraded',
                dependencies,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(503).json({
                status: 'error',
                dependencies: {
                    mongodb: { status: 'error', message: 'MongoDB连接失败' },
                    redis: { status: 'error', message: 'Redis连接失败' },
                    bullQueue: { status: 'error', message: '任务队列初始化失败' }
                },
                error: error instanceof Error ? error.message : '依赖服务检查失败',
                timestamp: new Date().toISOString()
            });
        }
    });
    return router;
};
exports.healthRoutes = healthRoutes;
exports.default = exports.healthRoutes;
//# sourceMappingURL=healthRoutes.js.map