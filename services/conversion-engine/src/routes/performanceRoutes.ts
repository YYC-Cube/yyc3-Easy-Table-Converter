/**
 * @file 性能监控路由
 * @description 提供服务性能指标的接口
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import { Router, Request, Response } from 'express';
import { SystemMonitor } from '../utils/systemMonitor';

// 性能指标接口
interface PerformanceRoutesOptions {
  systemMonitor: SystemMonitor;
}

/**
 * 创建性能监控路由
 * @param options 路由选项
 */
export const performanceRoutes = (options: PerformanceRoutesOptions): Router => {
  const router = Router();
  const { systemMonitor } = options;

  /**
   * 获取当前系统性能指标
   * @route GET /performance/system
   */
  router.get('/system', (req: Request, res: Response) => {
    const status = systemMonitor.getCurrentStatus();
    res.status(200).json({
      status: 'ok',
      data: status
    });
  });

  /**
   * 获取内存使用情况
   * @route GET /performance/memory
   */
  router.get('/memory', (req: Request, res: Response) => {
    const status = systemMonitor.getCurrentStatus();
    res.status(200).json({
      status: 'ok',
      data: status.memory
    });
  });

  /**
   * 获取CPU使用情况
   * @route GET /performance/cpu
   */
  router.get('/cpu', (req: Request, res: Response) => {
    const status = systemMonitor.getCurrentStatus();
    res.status(200).json({
      status: 'ok',
      data: status.cpu
    });
  });

  /**
   * 获取磁盘使用情况
   * @route GET /performance/disk
   */
  router.get('/disk', (req: Request, res: Response) => {
    const status = systemMonitor.getCurrentStatus();
    res.status(200).json({
      status: 'ok',
      data: status.disk
    });
  });

  /**
   * 获取系统负载
   * @route GET /performance/load
   */
  router.get('/load', (req: Request, res: Response) => {
    const status = systemMonitor.getCurrentStatus();
    res.status(200).json({
      status: 'ok',
      data: {
        loadAverage: status.loadAverage,
        cores: status.cpu.cores
      }
    });
  });

  /**
   * 获取网络接口信息
   * @route GET /performance/network
   */
  router.get('/network', (req: Request, res: Response) => {
    const status = systemMonitor.getCurrentStatus();
    res.status(200).json({
      status: 'ok',
      data: status.network
    });
  });

  return router;
};

export default performanceRoutes;
