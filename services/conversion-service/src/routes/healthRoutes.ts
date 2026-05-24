/**
 * @file 健康检查路由模块
 * @description 提供服务健康状态监控和系统资源检查
 * @module routes/healthRoutes
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-22
 */

import express, { Request, Response, NextFunction } from 'express';
import os from 'os';
import { ConversionEngine } from '../engine/ConversionEngine';
import { LoggerService } from '../services/LoggerService';
import { ConfigService } from '../services/ConfigService';
import { StorageService } from '../services/StorageService';

const router = express.Router();

// 健康检查响应接口
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: string;
  version: string;
  components: {
    engine: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      activeTasks: number;
      memoryUsage: { rss: string; heapUsed: string };
      uptime: string;
    };
    storage: {
      status: 'healthy' | 'unhealthy';
      usedSpace?: string;
      availableSpace?: string;
    };
    system: {
      cpuUsage?: number;
      memory: {
        total: string;
        free: string;
        used: string;
      };
      loadAvg?: number[];
      uptime: string;
    };
  };
  details?: Record<string, any>;
}

/**
 * @description 计算CPU使用率的辅助函数
 */
function calculateCpuUsage(): number {
  const cpus = os.cpus();
  if (!cpus.length) return 0;

  // 简单计算CPU使用率（这里只是一个近似值）
  const totalIdle = cpus.reduce((acc, cpu) => {
    return acc + (cpu.times?.idle || 0);
  }, 0);
  
  const totalTicks = cpus.reduce((acc, cpu) => {
    return acc + Object.values(cpu.times || {}).reduce((sum, time) => sum + time, 0);
  }, 0);

  return (1 - totalIdle / totalTicks) * 100;
}

/**
 * @description 格式化内存大小
 */
function formatMemory(memoryBytes: number): string {
  const memoryMB = memoryBytes / 1024 / 1024;
  return memoryMB >= 1024 ? `${(memoryMB / 1024).toFixed(2)}GB` : `${memoryMB.toFixed(2)}MB`;
}

/**
 * @description 格式化运行时间
 */
function formatUptime(uptimeSeconds: number): string {
  const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
  const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
}

/**
 * @description 完整健康检查端点
 * @route GET /api/health
 * @returns {HealthCheckResponse} 健康检查结果
 */
router.get('/', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const startTime = performance.now();
    const response: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: formatUptime(process.uptime()),
      version: '1.0.0',
      components: {
        engine: {
          status: 'unhealthy', // 默认值，后续更新
          activeTasks: 0,
          memoryUsage: { rss: '0MB', heapUsed: '0MB' },
          uptime: '0s'
        },
        storage: {
          status: 'unhealthy', // 默认值，后续更新
        },
        system: {
          memory: {
            total: formatMemory(os.totalmem()),
            free: formatMemory(os.freemem()),
            used: formatMemory(os.totalmem() - os.freemem())
          },
          uptime: formatUptime(os.uptime())
        }
      }
    };

    // 获取Express应用实例中的服务引用
    const app = req.app;
    
    // 检查转换引擎状态
    if (app.locals?.conversionEngine instanceof ConversionEngine) {
      try {
        const engineStatus = app.locals.conversionEngine.getEngineStatus();
        const memoryUsage = process.memoryUsage();
        
        response.components.engine = {
          status: 'healthy',
          activeTasks: engineStatus.activeTasks || 0,
          memoryUsage: {
            rss: formatMemory(memoryUsage.rss),
            heapUsed: formatMemory(memoryUsage.heapUsed)
          },
          uptime: formatUptime(process.uptime())
        };
      } catch (error) {
        response.components.engine.status = 'degraded';
        if (!response.details) response.details = {};
        response.details.engineError = error instanceof Error ? error.message : String(error);
      }
    }

    // 检查存储服务状态
    if (app.locals?.storageService instanceof StorageService) {
      try {
        // 使用getStorageStats()方法代替getStatus()
        const storageStats = await app.locals.storageService.getStorageStats();
        response.components.storage = {
          status: 'healthy', // 只要能获取到统计信息，就认为存储健康
          usedSpace: formatMemory(storageStats.usedSpace),
          // getStorageStats()不提供可用空间信息
        };
      } catch (error) {
        response.components.storage.status = 'unhealthy';
        if (!response.details) response.details = {};
        response.details.storageError = error instanceof Error ? error.message : String(error);
      }
    }

    // 添加系统负载信息（可选，可能在某些系统上不可用）
    try {
      if (os.loadavg && Array.isArray(os.loadavg())) {
        response.components.system.loadAvg = os.loadavg();
        response.components.system.cpuUsage = calculateCpuUsage();
      }
    } catch (error) {
      // 忽略获取系统负载失败的错误
    }

    // 计算整体健康状态
    const componentStatuses = [
      response.components.engine.status,
      response.components.storage.status
    ];

    if (componentStatuses.includes('unhealthy')) {
      response.status = 'unhealthy';
    } else if (componentStatuses.includes('degraded')) {
      response.status = 'degraded';
    }

    // 记录响应时间
    const responseTime = performance.now() - startTime;
    response.details = response.details || {};
    response.details.responseTime = `${responseTime.toFixed(2)}ms`;

    // 根据健康状态设置HTTP状态码
    const statusCode = response.status === 'unhealthy' ? 503 : 
                      response.status === 'degraded' ? 200 : 200;

    res.status(statusCode).json(response);
  } catch (error) {
    // 捕获所有异常，确保健康检查端点不会完全失败
    const fallbackResponse: Partial<HealthCheckResponse> = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
    
    // 尝试获取日志服务并记录错误
    if (req.app.locals?.logger instanceof LoggerService) {
      req.app.locals.logger.error('健康检查失败', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    res.status(503).json(fallbackResponse);
  }
});

/**
 * @description 轻量级健康检查端点（用于负载均衡器）
 * @route GET /api/health/liveness
 * @returns {object} 简化的健康状态
 */
router.get('/liveness', (_req: Request, res: Response) => {
  try {
    // 轻量级检查，只返回基本状态
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @description 就绪性检查端点（用于Kubernetes就绪探针）
 * @route GET /api/health/readiness
 * @returns {object} 服务就绪状态
 */
router.get('/readiness', async (req: Request, res: Response) => {
  try {
    let ready = true;
    const checks: Record<string, boolean> = {};
    const app = req.app;

    // 检查转换引擎是否就绪
    if (app.locals?.conversionEngine instanceof ConversionEngine) {
      try {
        app.locals.conversionEngine.getEngineStatus();
        checks.engine = true;
      } catch (error) {
        checks.engine = false;
        ready = false;
      }
    }

    // 检查存储服务是否就绪
    if (app.locals?.storageService instanceof StorageService) {
      try {
        // 使用getStorageStats()方法代替getStatus()
        const storageStats = await app.locals.storageService.getStorageStats();
        checks.storage = !!storageStats; // 只要能获取到存储统计信息，就认为存储服务可用
      } catch (error) {
        checks.storage = false;
        ready = false;
      }
    }

    // 检查配置服务是否就绪
    if (app.locals?.configService instanceof ConfigService) {
      try {
        app.locals.configService.getConfig();
        checks.config = true;
      } catch (error) {
        checks.config = false;
        ready = false;
      }
    }

    res.status(ready ? 200 : 503).json({
      ready,
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @description 详细系统信息端点
 * @route GET /api/health/system
 * @returns {object} 系统资源使用情况
 */
router.get('/system', (_req: Request, res: Response) => {
  try {
    const memoryInfo = os.totalmem() - os.freemem();
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpuInfo: {
        count: os.cpus()?.length || 0,
        model: os.cpus()?.[0]?.model || 'unknown'
      },
      memory: {
        total: formatMemory(os.totalmem()),
        free: formatMemory(os.freemem()),
        used: formatMemory(memoryInfo),
        usagePercent: ((memoryInfo / os.totalmem()) * 100).toFixed(2)
      },
      uptime: formatUptime(os.uptime()),
      loadAverage: os.loadavg ? os.loadavg() : undefined,
      process: {
        pid: process.pid,
        uptime: formatUptime(process.uptime()),
        memoryUsage: {
          rss: formatMemory(process.memoryUsage().rss),
          heapTotal: formatMemory(process.memoryUsage().heapTotal),
          heapUsed: formatMemory(process.memoryUsage().heapUsed),
          external: formatMemory(process.memoryUsage().external)
        }
      }
    };

    res.status(200).json(systemInfo);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @description 配置信息端点（安全的配置查看，不包含敏感信息）
 * @route GET /api/health/config
 * @returns {object} 非敏感配置信息
 */
router.get('/config', (req: Request, res: Response) => {
  try {
    const app = req.app;
    const configService = app.locals?.configService instanceof ConfigService 
      ? app.locals.configService 
      : ConfigService.getInstance();
    
    const config = configService.getConfig();
    
    // 返回非敏感配置信息
    const safeConfig = {
      environment: config.environment,
      serviceName: config.serviceName,
      server: {
        port: config.port
      },
      websocket: {
        enabled: config.websocket?.enabled,
        heartbeatIntervalMs: config.websocket?.heartbeatIntervalMs
      },
      logger: {
        level: config.logger?.level,
        fileLogging: config.logger?.fileLogging
      },
      conversionEngine: {
        maxConcurrentTasks: config.conversionEngine?.maxConcurrentTasks,
        taskTimeoutMs: config.conversionEngine?.taskTimeoutMs,
        memoryLimitMb: config.conversionEngine?.memoryLimitMb
      }
    };

    res.status(200).json(safeConfig);
  } catch (error) {
    res.status(500).json({
      error: '无法获取配置信息'
    });
  }
});

export default router;