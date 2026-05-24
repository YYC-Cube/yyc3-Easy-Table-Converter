"use strict";
/**
 * @file 系统监控工具
 * @description 监控服务的性能和资源使用情况
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMonitor = void 0;
const os_1 = __importDefault(require("os"));
const logger_1 = require("./logger");
/**
 * 系统监控类
 */
class SystemMonitor {
    constructor(config = {}) {
        this.isMonitoring = false;
        this.checkInterval = null;
        this.previousCPUUsage = [];
        this.config = {
            checkInterval: config.checkInterval || 60000, // 默认1分钟
            memoryThreshold: config.memoryThreshold || 85,
            cpuThreshold: config.cpuThreshold || 80,
            diskThreshold: config.diskThreshold || 80,
            ...config
        };
        // 初始化CPU使用记录
        this.previousCPUUsage = os_1.default.cpus().map(() => 0);
    }
    /**
     * 开始监控
     */
    startMonitoring() {
        if (this.isMonitoring) {
            logger_1.logger.warn('⚠️  系统监控已经在运行中');
            return;
        }
        this.isMonitoring = true;
        logger_1.logger.info(`🚀 系统监控已启动，检查间隔: ${this.config.checkInterval}ms`);
        // 立即执行一次检查
        this.checkSystemStatus();
        // 设置定期检查
        this.checkInterval = setInterval(() => {
            this.checkSystemStatus();
        }, this.config.checkInterval);
    }
    /**
     * 停止监控
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            logger_1.logger.warn('⚠️  系统监控已经停止');
            return;
        }
        this.isMonitoring = false;
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        logger_1.logger.info('🛑 系统监控已停止');
    }
    /**
     * 检查系统状态
     */
    checkSystemStatus() {
        try {
            const status = this.getSystemStatus();
            this.logSystemStatus(status);
            this.checkThresholds(status);
        }
        catch (error) {
            logger_1.logger.error('❌ 系统状态检查失败:', error);
        }
    }
    /**
     * 获取系统状态
     */
    getSystemStatus() {
        const memory = this.getMemoryStatus();
        const cpu = this.getCPUStatus();
        const disk = this.getDiskStatus();
        return {
            timestamp: Date.now(),
            uptime: os_1.default.uptime(),
            memory,
            cpu,
            disk,
            network: {
                interfaces: Object.keys(os_1.default.networkInterfaces())
            },
            loadAverage: os_1.default.loadavg()
        };
    }
    /**
     * 获取内存状态
     */
    getMemoryStatus() {
        const total = os_1.default.totalmem();
        const free = os_1.default.freemem();
        const used = total - free;
        const usagePercent = Math.round((used / total) * 100);
        return {
            total,
            free,
            used,
            usagePercent
        };
    }
    /**
     * 获取CPU状态
     */
    getCPUStatus() {
        const cpus = os_1.default.cpus();
        let usagePercent = 0;
        // 计算CPU使用率（简单实现）
        cpus.forEach((cpu, index) => {
            const total = Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
            const idle = cpu.times.idle;
            const previousTotal = this.previousCPUUsage[index] || 0;
            const previousIdle = previousTotal ? previousTotal - (previousTotal - idle) : 0;
            const totalDiff = total - previousTotal;
            const idleDiff = idle - previousIdle;
            if (totalDiff > 0) {
                usagePercent += Math.round((1 - idleDiff / totalDiff) * 100);
            }
            this.previousCPUUsage[index] = total;
        });
        return {
            usagePercent: Math.round(usagePercent / cpus.length),
            cores: cpus.length,
            model: cpus[0].model
        };
    }
    /**
     * 获取磁盘状态
     */
    getDiskStatus() {
        // 简单实现：获取根目录的磁盘使用情况
        // 实际项目中应该使用更可靠的方法
        const total = 100 * 1024 * 1024 * 1024; // 假设总磁盘空间为100GB
        const free = 20 * 1024 * 1024 * 1024; // 假设可用空间为20GB
        const used = total - free;
        const usagePercent = Math.round((used / total) * 100);
        return {
            total,
            free,
            used,
            usagePercent
        };
    }
    /**
     * 记录系统状态
     * @param status 系统状态
     */
    logSystemStatus(status) {
        logger_1.logger.info('📊 系统状态报告:', {
            timestamp: new Date(status.timestamp).toISOString(),
            uptime: `${Math.round(status.uptime / 3600)}h ${Math.round((status.uptime % 3600) / 60)}m`,
            memory: `${status.memory.usagePercent}% (${Math.round(status.memory.used / 1024 / 1024)}MB / ${Math.round(status.memory.total / 1024 / 1024)}MB)`,
            cpu: `${status.cpu.usagePercent}% (${status.cpu.cores} cores)`,
            disk: `${status.disk.usagePercent}% (${Math.round(status.disk.used / 1024 / 1024 / 1024)}GB / ${Math.round(status.disk.total / 1024 / 1024 / 1024)}GB)`,
            loadAverage: status.loadAverage.map(la => la.toFixed(2)).join(', ')
        });
    }
    /**
     * 检查阈值并发出警报
     * @param status 系统状态
     */
    checkThresholds(status) {
        const alerts = [];
        // 检查内存使用
        if (status.memory.usagePercent >= this.config.memoryThreshold) {
            alerts.push(`⚠️  内存使用过高: ${status.memory.usagePercent}% (阈值: ${this.config.memoryThreshold}%)`);
        }
        // 检查CPU使用
        if (status.cpu.usagePercent >= this.config.cpuThreshold) {
            alerts.push(`⚠️  CPU使用过高: ${status.cpu.usagePercent}% (阈值: ${this.config.cpuThreshold}%)`);
        }
        // 检查磁盘使用
        if (status.disk.usagePercent >= this.config.diskThreshold) {
            alerts.push(`⚠️  磁盘使用过高: ${status.disk.usagePercent}% (阈值: ${this.config.diskThreshold}%)`);
        }
        // 记录警报
        if (alerts.length > 0) {
            logger_1.logger.warn('🚨 系统资源警报:', {
                alerts,
                status
            });
        }
    }
    /**
     * 获取当前系统状态
     */
    getCurrentStatus() {
        return this.getSystemStatus();
    }
}
exports.SystemMonitor = SystemMonitor;
//# sourceMappingURL=systemMonitor.js.map