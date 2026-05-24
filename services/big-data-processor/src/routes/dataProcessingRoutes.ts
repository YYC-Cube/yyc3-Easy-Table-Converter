/**
 * @file 数据处理API路由
 * @description 定义大数据处理服务的HTTP接口
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import { Router, Request, Response, NextFunction } from 'express';
import { DataProcessorService } from '../services/dataProcessorService';
import monitorSystemHealth, { SystemMetrics } from '../utils/systemMonitor';
import DataProcessingJob from '../models/DataProcessingJob';
import { getRedisClient } from '../config/redis';

// 创建路由实例
const router = Router();
const dataProcessorService = DataProcessorService.getInstance();

// 请求验证中间件
function validateRequest(req: Request, res: Response, next: NextFunction): void {
  try {
    // 提取用户ID（在实际项目中，这里应该从认证中间件获取）
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    (req as any).userId = userId;
    next();
  } catch (error) {
    res.status(400).json({
      error: '无效的请求参数',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * @swagger
 * /api/data-processing/jobs:
 *   post:
 *     summary: 提交数据处理任务
 *     description: 创建一个新的数据处理任务并加入队列
 *     tags: [Data Processing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inputFileId
 *               - outputFormat
 *             properties:
 *               inputFileId: { type: string, description: '输入文件ID' }
 *               outputFormat: { type: string, description: '输出格式 (csv/json/xlsx/parquet)' }
 *               options: { type: object, description: '处理选项' }
 *     responses:
 *       200: { description: '任务已成功提交' }
 *       400: { description: '请求参数错误' }
 *       500: { description: '服务器内部错误' }
 */
router.post('/jobs', validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { inputFileId, outputFormat, options } = req.body;
    const userId = (req as any).userId;
    
    // 验证必要参数
    if (!inputFileId || !outputFormat) {
      res.status(400).json({ error: '缺少必要参数: inputFileId 和 outputFormat' });
      return;
    }
    
    // 提交任务
    const job = await dataProcessorService.submitJob(
      userId,
      inputFileId,
      outputFormat,
      options
    );
    
    res.status(202).json({
      success: true,
      message: '任务已成功提交到队列',
      jobId: job.jobId,
      status: job.status,
      estimatedTime: '任务正在排队中，请稍后查询状态'
    });
  } catch (error) {
    console.error('❌ 任务提交失败:', error);
    res.status(500).json({
      success: false,
      error: '任务提交失败',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @swagger
 * /api/data-processing/jobs/{jobId}:
 *   get:
 *     summary: 获取任务状态
 *     description: 查询指定任务的处理状态和进度
 *     tags: [Data Processing]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: '任务状态信息' }
 *       404: { description: '任务不存在' }
 *       500: { description: '服务器内部错误' }
 */
router.get('/jobs/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const job = await dataProcessorService.getJobStatus(jobId);
    
    if (!job) {
      res.status(404).json({
        success: false,
        error: '任务不存在'
      });
      return;
    }
    
    // 格式化响应
    const response = {
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      inputFileId: job.inputFileId,
      outputFormat: job.outputFormat,
      resultFileId: job.resultFileId,
      errorMessage: job.errorMessage,
      processingTime: job.processingTime ? `${(job.processingTime / 1000).toFixed(2)}秒` : undefined,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ 获取任务状态失败:', error);
    res.status(500).json({
      success: false,
      error: '获取任务状态失败',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @swagger
 * /api/data-processing/jobs/{jobId}/cancel:
 *   post:
 *     summary: 取消任务
 *     description: 取消一个等待中的任务
 *     tags: [Data Processing]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: '任务已取消' }
 *       400: { description: '任务无法取消' }
 *       404: { description: '任务不存在' }
 *       500: { description: '服务器内部错误' }
 */
router.post('/jobs/:jobId/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const job = await dataProcessorService.cancelJob(jobId);
    
    if (!job) {
      res.status(404).json({
        success: false,
        error: '任务不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      message: '任务已成功取消',
      jobId: job.jobId,
      status: job.status
    });
  } catch (error) {
    console.error('❌ 取消任务失败:', error);
    res.status(400).json({
      success: false,
      error: '取消任务失败',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @swagger
 * /api/data-processing/user/jobs:
 *   get:
 *     summary: 获取用户任务列表
 *     description: 获取当前用户的所有处理任务
 *     tags: [Data Processing]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: 任务状态过滤
 *       - in: query
 *         name: limit
 *         schema: { type: number, default: 10 }
 *         description: 返回记录数量
 *       - in: query
 *         name: offset
 *         schema: { type: number, default: 0 }
 *         description: 偏移量
 *     responses:
 *       200: { description: '用户任务列表' }
 *       500: { description: '服务器内部错误' }
 */
router.get('/user/jobs', validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { status, limit = 10, offset = 0 } = req.query;
    
    const query: any = { userId };
    if (status) query.status = status;
    
    const jobs = await DataProcessingJob
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .exec();
    
    const total = await DataProcessingJob.countDocuments(query).exec();
    
    res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('❌ 获取用户任务列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取任务列表失败',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @swagger
 * /api/data-processing/health:
 *   get:
 *     summary: 服务健康检查
 *     description: 获取服务运行状态和系统资源使用情况
 *     tags: [System]
 *     responses:
 *       200: { description: '服务健康状态' }
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await monitorSystemHealth();
    
    // 检查Redis连接状态
    let redisStatus = 'disconnected';
    try {
      const redisClient = getRedisClient();
      await redisClient.ping();
      redisStatus = 'connected';
    } catch (redisError) {
      console.error('❌ Redis连接检查失败:', redisError);
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'big-data-processor',
      system: metrics,
      dependencies: {
        redis: redisStatus,
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      },
      warnings: metrics.warnings
    });
  } catch (error) {
    console.error('❌ 健康检查失败:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: '服务健康检查失败',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @swagger
 * /api/data-processing/stats:
 *   get:
 *     summary: 获取处理统计信息
 *     description: 获取服务处理任务的统计数据
 *     tags: [System]
 *     responses:
 *       200: { description: '统计信息' }
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const redisClient = getRedisClient();
    
    // 获取队列中的任务数
    const queuedJobs = await redisClient.lLen('data:processing:queue');
    
    // 获取活跃任务数
    const activeJobs = await redisClient.sCard('data:processing:active');
    
    // 获取任务状态统计
    const statusStats = await DataProcessingJob.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).exec();
    
    // 转换为更友好的格式
    const statusCounts: Record<string, number> = {};
    statusStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });
    
    // 获取今日处理的任务数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await DataProcessingJob.countDocuments({
      createdAt: { $gte: today }
    }).exec();
    
    res.json({
      success: true,
      queue: {
        queuedJobs,
        activeJobs
      },
      statusCounts,
      todayProcessed: todayCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ 获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计信息失败',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// 添加mongoose引用，避免编译错误
import mongoose from 'mongoose';

export default router;