/**
 * @file 系统监控工具
 * @description 监控服务器性能指标和健康状况
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import os from 'os';
import process from 'process';
import { getRedisClient } from '../config/redis';

// 监控配置
const MONITORING_INTERVAL = 60000; // 60秒
const MEMORY_THRESHOLD = 85; // 内存使用阈值百分比
const CPU_THRESHOLD = 80; // CPU使用阈值百分比

// 监控历史数据
let monitoringHistory: Array<{
  timestamp: number;
  metrics: SystemMetrics;
}> = [];

// 监控定时器
let monitoringTimer: NodeJS.Timeout | null = null;

// 系统指标接口
export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  system: {
    uptime: number;
    platform: string;
    nodeVersion: string;
  };
  process: {
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    uptime: number;
    cpuUsage: number;
  };
  warnings: string[];
}

/**
 * 获取CPU使用率
 * @returns {Promise<number>} CPU使用率百分比
 */
async function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    // 获取CPU空闲时间的差值来计算使用率
    const startCpuInfo = os.cpus();
    const startTime = Date.now();
    
    setTimeout(() => {
      const endCpuInfo = os.cpus();
      const endTime = Date.now();
      
      let totalIdle = 0;
      let totalTick = 0;
      
      // 计算所有核心的总空闲时间和总时间
      for (let i = 0; i < startCpuInfo.length; i++) {
        const startCore = startCpuInfo[i];
        const endCore = endCpuInfo[i];
        
        if (!endCore.times || !startCore.times) continue;
        
        const startIdle = startCore.times.idle || 0;
        const endIdle = endCore.times.idle || 0;
        
        const startTotal = Object.values(startCore.times).reduce((sum, value) => sum + (value || 0), 0);
        const endTotal = Object.values(endCore.times).reduce((sum, value) => sum + (value || 0), 0);
        
        totalIdle += endIdle - startIdle;
        totalTick += endTotal - startTotal;
      }
      
      // 计算CPU使用率
      const idlePercent = totalIdle / totalTick * 100;
      const usagePercent = 100 - idlePercent;
      
      resolve(Math.round(usagePercent * 100) / 100);
    }, 100); // 采样100ms
  });
}

/**
 * 获取磁盘使用情况
 * @returns {object} 磁盘使用信息
 */
function getDiskInfo(): { total: number; free: number; used: number; usagePercent: number } {
  // 在实际生产环境中，这里应该使用类似 `diskusage` 包来获取更准确的磁盘信息
  // 这里使用临时模拟数据
  const total = 100 * 1024 * 1024 * 1024; // 假设100GB
  const free = 60 * 1024 * 1024 * 1024; // 假设60GB空闲
  const used = total - free;
  const usagePercent = (used / total) * 100;
  
  return {
    total,
    free,
    used,
    usagePercent: Math.round(usagePercent * 100) / 100
  };
}

/**
 * 监控系统健康状况
 * @returns {SystemMetrics} 系统指标
 */
export async function monitorSystemHealth(): Promise<SystemMetrics> {
  try {
    const [cpuUsage] = await Promise.all([
      getCpuUsage()
    ]);
    
    const memoryInfo = os.totalmem() && os.freemem() 
      ? {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100 * 100) / 100
        }
      : {
          total: 0,
          free: 0,
          used: 0,
          usagePercent: 0
        };
    
    const diskInfo = getDiskInfo();
    const cpuModel = os.cpus()[0]?.model || 'Unknown';
    
    const processMemUsage = process.memoryUsage();
    const warnings: string[] = [];
    
    // 检查警告条件
    if (memoryInfo.usagePercent > MEMORY_THRESHOLD) {
      warnings.push(`⚠️ 内存使用率过高: ${memoryInfo.usagePercent}%`);
    }
    
    if (cpuUsage > CPU_THRESHOLD) {
      warnings.push(`⚠️ CPU使用率过高: ${cpuUsage}%`);
    }
    
    if (diskInfo.usagePercent > 90) {
      warnings.push(`⚠️ 磁盘使用率过高: ${diskInfo.usagePercent}%`);
    }
    
    const metrics: SystemMetrics = {
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        model: cpuModel
      },
      memory: memoryInfo,
      disk: diskInfo,
      system: {
        uptime: os.uptime(),
        platform: os.platform(),
        nodeVersion: process.version
      },
      process: {
        memoryUsage: processMemUsage,
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage().user / 1000 // 转换为毫秒
      },
      warnings
    };
    
    // 保存历史记录
    monitoringHistory.push({
      timestamp: Date.now(),
      metrics
    });
    
    // 保留最近24小时的历史数据
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    monitoringHistory = monitoringHistory.filter(item => item.timestamp > oneDayAgo);
    
    // 如果有警告，记录到日志
    if (warnings.length > 0) {
      console.warn('🚨 系统监控警告:', warnings);
    }
    
    return metrics;
  } catch (error) {
    console.error('❌ 系统监控失败:', error);
    throw error;
  }
}

/**
 * 启动定期监控
 */
monitorSystemHealth.startMonitoring = function() {
  if (monitoringTimer) {
    clearInterval(monitoringTimer);
  }
  
  monitoringTimer = setInterval(async () => {
    try {
      const metrics = await monitorSystemHealth();
      
      // 将关键指标存储到Redis
      try {
        const redisClient = getRedisClient();
        await redisClient.set(
          'system:metrics:latest',
          JSON.stringify(metrics),
          { EX: 3600 }
        );
        
        // 存储使用率到Redis以便后续统计
        await redisClient.lPush('system:metrics:history', JSON.stringify({
          timestamp: Date.now(),
          cpuUsage: metrics.cpu.usage,
          memoryUsage: metrics.memory.usagePercent,
          diskUsage: metrics.disk.usagePercent
        }));
        
        // 只保留1000条历史记录
        await redisClient.lTrim('system:metrics:history', 0, 999);
      } catch (redisError) {
        console.error('❌ Redis存储监控数据失败:', redisError);
      }
    } catch (error) {
      console.error('❌ 定期监控失败:', error);
    }
  }, MONITORING_INTERVAL);
  
  console.log(`🔔 系统监控已启动，每 ${MONITORING_INTERVAL / 1000} 秒检查一次`);
};

/**
 * 停止定期监控
 */
monitorSystemHealth.stopMonitoring = function() {
  if (monitoringTimer) {
    clearInterval(monitoringTimer);
    monitoringTimer = null;
    console.log('🔕 系统监控已停止');
  }
};

/**
 * 获取历史监控数据
 * @param limit - 返回的记录数量
 * @returns 历史监控数据
 */
monitorSystemHealth.getHistory = function(limit: number = 24): Array<{ timestamp: number; metrics: SystemMetrics }> {
  return monitoringHistory.slice(-limit);
};

// 导出默认函数
export default monitorSystemHealth;