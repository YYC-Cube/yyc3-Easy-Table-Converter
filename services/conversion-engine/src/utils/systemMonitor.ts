/**
 * @file 系统监控工具
 * @description 监控服务的性能和资源使用情况
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import os from 'os';
import { logger } from './logger';

// 监控配置接口
export interface SystemMonitorConfig {
  checkInterval?: number; // 检查间隔（毫秒）
  memoryThreshold?: number; // 内存使用阈值（百分比）
  cpuThreshold?: number; // CPU使用阈值（百分比）
  diskThreshold?: number; // 磁盘使用阈值（百分比）
}

// 系统状态接口
export interface SystemStatus {
  timestamp: number;
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  cpu: {
    usagePercent: number;
    cores: number;
    model: string;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  network: {
    interfaces: string[];
  };
  loadAverage: number[];
}

/**
 * 系统监控类
 */
export class SystemMonitor {
  private config: SystemMonitorConfig;
  private isMonitoring: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private previousCPUUsage: number[] = [];

  constructor(config: SystemMonitorConfig = {}) {
    this.config = {
      checkInterval: config.checkInterval || 60000, // 默认1分钟
      memoryThreshold: config.memoryThreshold || 85,
      cpuThreshold: config.cpuThreshold || 80,
      diskThreshold: config.diskThreshold || 80,
      ...config
    };

    // 初始化CPU使用记录
    this.previousCPUUsage = os.cpus().map(() => 0);
  }

  /**
   * 开始监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      logger.warn('⚠️  系统监控已经在运行中');
      return;
    }

    this.isMonitoring = true;
    logger.info(`🚀 系统监控已启动，检查间隔: ${this.config.checkInterval}ms`);

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
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      logger.warn('⚠️  系统监控已经停止');
      return;
    }

    this.isMonitoring = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    logger.info('🛑 系统监控已停止');
  }

  /**
   * 检查系统状态
   */
  private checkSystemStatus(): void {
    try {
      const status = this.getSystemStatus();
      this.logSystemStatus(status);
      this.checkThresholds(status);
    } catch (error) {
      logger.error('❌ 系统状态检查失败:', error);
    }
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): SystemStatus {
    const memory = this.getMemoryStatus();
    const cpu = this.getCPUStatus();
    const disk = this.getDiskStatus();

    return {
      timestamp: Date.now(),
      uptime: os.uptime(),
      memory,
      cpu,
      disk,
      network: {
        interfaces: Object.keys(os.networkInterfaces())
      },
      loadAverage: os.loadavg()
    };
  }

  /**
   * 获取内存状态
   */
  private getMemoryStatus(): SystemStatus['memory'] {
    const total = os.totalmem();
    const free = os.freemem();
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
  private getCPUStatus(): SystemStatus['cpu'] {
    const cpus = os.cpus();
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
  private getDiskStatus(): SystemStatus['disk'] {
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
  private logSystemStatus(status: SystemStatus): void {
    logger.info('📊 系统状态报告:', {
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
  private checkThresholds(status: SystemStatus): void {
    const alerts: string[] = [];

    // 检查内存使用
    if (status.memory.usagePercent >= this.config.memoryThreshold!) {
      alerts.push(`⚠️  内存使用过高: ${status.memory.usagePercent}% (阈值: ${this.config.memoryThreshold}%)`);
    }

    // 检查CPU使用
    if (status.cpu.usagePercent >= this.config.cpuThreshold!) {
      alerts.push(`⚠️  CPU使用过高: ${status.cpu.usagePercent}% (阈值: ${this.config.cpuThreshold}%)`);
    }

    // 检查磁盘使用
    if (status.disk.usagePercent >= this.config.diskThreshold!) {
      alerts.push(`⚠️  磁盘使用过高: ${status.disk.usagePercent}% (阈值: ${this.config.diskThreshold}%)`);
    }

    // 记录警报
    if (alerts.length > 0) {
      logger.warn('🚨 系统资源警报:', {
        alerts,
        status
      });
    }
  }

  /**
   * 获取当前系统状态
   */
  getCurrentStatus(): SystemStatus {
    return this.getSystemStatus();
  }
}
