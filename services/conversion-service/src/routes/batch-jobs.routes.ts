/**
 * @file 批处理任务路由
 * @description 提供批处理任务相关的API接口
 * @module routes/batch-jobs.routes
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import express, { Request, Response } from 'express';
import { batchJobService, BatchJobConfig } from '../services/BatchJobService';
import { ConversionRequest } from '../types';
// 导入将在需要时添加
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * /api/batch-jobs:  
 *   post:
 *     summary: 创建批处理任务
 *     description: 创建一个新的批处理转换任务，支持多个转换请求
 *     tags: [Batch Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requests:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ConversionRequest'
 *               config:
 *                 $ref: '#/components/schemas/BatchJobConfig'
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: 批处理任务创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, processing, completed, failed]
 *       400:
 *         description: 请求参数错误
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { requests, config, metadata } = req.body;
    
    // 验证请求参数
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        error: '请求列表不能为空',
        code: 'INVALID_REQUESTS'
      });
    }
    
    // 验证每个请求项
    for (const request of requests) {
      if (!request.sourceData || !request.sourceFormat || !request.targetFormat) {
        return res.status(400).json({
          error: '每个请求项必须包含sourceData、sourceFormat和targetFormat',
          code: 'INVALID_REQUEST_ITEM'
        });
      }
    }
    
    // 创建批处理任务
    const jobId = batchJobService.createBatchJob(
      requests as ConversionRequest[],
      config as BatchJobConfig,
      metadata
    );
    
    return res.json({
      jobId,
      status: 'pending',
      message: '批处理任务创建成功'
    });
  } catch (error) {
    logger.error('创建批处理任务失败:', error);
    return res.status(500).json({
      error: '创建批处理任务失败',
      code: 'CREATE_BATCH_JOB_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/batch-jobs/{jobId}:  
 *   get:
 *     summary: 获取批处理任务状态
 *     description: 根据任务ID获取批处理任务的详细状态信息
 *     tags: [Batch Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务状态信息
 *       404:
 *         description: 任务不存在
 */
router.get('/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = batchJobService.getBatchJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json({
        error: '批处理任务不存在',
        code: 'JOB_NOT_FOUND'
      });
    }
    
    // 转换Map为数组格式返回
    const formattedJob = {
      ...job,
      responses: Array.from(job.responses.entries()).map(([taskId, response]) => ({
        taskId,
        ...response
      }))
    };
    
    return res.json(formattedJob);
  } catch (error) {
    logger.error('获取批处理任务状态失败:', error);
    return res.status(500).json({
      error: '获取批处理任务状态失败',
      code: 'GET_JOB_STATUS_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/batch-jobs:  
 *   get:
 *     summary: 获取批处理任务列表
 *     description: 获取所有批处理任务或按状态筛选的任务列表
 *     tags: [Batch Jobs]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *     responses:
 *       200:
 *         description: 批处理任务列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const jobs = batchJobService.getAllBatchJobs(status as any);
    
    // 格式化响应
    const formattedJobs = jobs.map(job => ({
      ...job,
      responses: Array.from(job.responses.entries()).map(([taskId, response]) => ({
        taskId,
        ...response
      }))
    }));
    
    return res.json({
      jobs: formattedJobs,
      total: jobs.length
    });
  } catch (error) {
    logger.error('获取批处理任务列表失败:', error);
    return res.status(500).json({
      error: '获取批处理任务列表失败',
      code: 'GET_JOBS_LIST_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/batch-jobs/{jobId}/start:  
 *   post:
 *     summary: 开始批处理任务
 *     description: 启动一个已创建但未开始的批处理任务
 *     tags: [Batch Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务启动成功
 *       400:
 *         description: 任务无法启动
 *       404:
 *         description: 任务不存在
 */
router.post('/:jobId/start', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const success = batchJobService.startBatchJob(jobId);
    
    if (!success) {
      const job = batchJobService.getBatchJobStatus(jobId);
      if (!job) {
        return res.status(404).json({
          error: '批处理任务不存在',
          code: 'JOB_NOT_FOUND'
        });
      }
      
      return res.status(400).json({
        error: '任务无法启动，可能已开始或已完成',
        code: 'JOB_CANNOT_START'
      });
    }
    
    return res.json({
      message: '批处理任务启动成功',
      jobId,
      status: 'processing'
    });
  } catch (error) {
    logger.error('启动批处理任务失败:', error);
    return res.status(500).json({
      error: '启动批处理任务失败',
      code: 'START_JOB_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/batch-jobs/{jobId}/pause:  
 *   post:
 *     summary: 暂停批处理任务
 *     description: 暂停一个正在运行的批处理任务
 *     tags: [Batch Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务暂停成功
 *       400:
 *         description: 任务无法暂停
 *       404:
 *         description: 任务不存在
 */
router.post('/:jobId/pause', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const success = batchJobService.pauseBatchJob(jobId);
    
    if (!success) {
      const job = batchJobService.getBatchJobStatus(jobId);
      if (!job) {
        return res.status(404).json({
          error: '批处理任务不存在',
          code: 'JOB_NOT_FOUND'
        });
      }
      
      return res.status(400).json({
        error: '任务无法暂停，可能未在运行',
        code: 'JOB_CANNOT_PAUSE'
      });
    }
    
    return res.json({
      message: '批处理任务暂停成功',
      jobId,
      status: 'paused'
    });
  } catch (error) {
    logger.error('暂停批处理任务失败:', error);
    return res.status(500).json({
      error: '暂停批处理任务失败',
      code: 'PAUSE_JOB_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/batch-jobs/{jobId}/resume:  
 *   post:
 *     summary: 恢复批处理任务
 *     description: 恢复一个已暂停的批处理任务
 *     tags: [Batch Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务恢复成功
 *       400:
 *         description: 任务无法恢复
 *       404:
 *         description: 任务不存在
 */
router.post('/:jobId/resume', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const success = batchJobService.resumeBatchJob(jobId);
    
    if (!success) {
      const job = batchJobService.getBatchJobStatus(jobId);
      if (!job) {
        return res.status(404).json({
          error: '批处理任务不存在',
          code: 'JOB_NOT_FOUND'
        });
      }
      
      return res.status(400).json({
        error: '任务无法恢复，可能未暂停',
        code: 'JOB_CANNOT_RESUME'
      });
    }
    
    return res.json({
      message: '批处理任务恢复成功',
      jobId,
      status: 'processing'
    });
  } catch (error) {
    logger.error('恢复批处理任务失败:', error);
    return res.status(500).json({
      error: '恢复批处理任务失败',
      code: 'RESUME_JOB_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/batch-jobs/{jobId}/cancel:  
 *   post:
 *     summary: 取消批处理任务
 *     description: 取消一个正在运行或待处理的批处理任务
 *     tags: [Batch Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务取消成功
 *       400:
 *         description: 任务无法取消
 *       404:
 *         description: 任务不存在
 */
router.post('/:jobId/cancel', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const success = batchJobService.cancelBatchJob(jobId);
    
    if (!success) {
      const job = batchJobService.getBatchJobStatus(jobId);
      if (!job) {
        return res.status(404).json({
          error: '批处理任务不存在',
          code: 'JOB_NOT_FOUND'
        });
      }
      
      return res.status(400).json({
        error: '任务无法取消，可能已完成或已失败',
        code: 'JOB_CANNOT_CANCEL'
      });
    }
    
    return res.json({
      message: '批处理任务取消成功',
      jobId,
      status: 'cancelled'
    });
  } catch (error) {
    logger.error('取消批处理任务失败:', error);
    return res.status(500).json({
      error: '取消批处理任务失败',
      code: 'CANCEL_JOB_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/batch-jobs/stats:  
 *   get:
 *     summary: 获取批处理任务统计信息
 *     description: 获取批处理任务的总体统计数据
 *     tags: [Batch Jobs]
 *     responses:
 *       200:
 *         description: 统计信息
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = batchJobService.getBatchJobStats();
    return res.json(stats);
  } catch (error) {
    logger.error('获取批处理任务统计失败:', error);
    return res.status(500).json({
      error: '获取批处理任务统计失败',
      code: 'GET_STATS_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/batch-jobs/groups/{groupId}:  
 *   get:
 *     summary: 获取任务组中的所有任务
 *     description: 根据任务组ID获取该组下的所有批处理任务
 *     tags: [Batch Jobs]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务组中的任务列表
 */
router.get('/groups/:groupId', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const jobs = batchJobService.getBatchJobsByGroup(groupId);
    
    // 格式化响应
    const formattedJobs = jobs.map(job => ({
      ...job,
      responses: Array.from(job.responses.entries()).map(([taskId, response]) => ({
        taskId,
        ...response
      }))
    }));
    
    return res.json({
      groupId,
      jobs: formattedJobs,
      total: jobs.length
    });
  } catch (error) {
    logger.error('获取任务组失败:', error);
    return res.status(500).json({
      error: '获取任务组失败',
      code: 'GET_GROUP_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/batch-jobs/cleanup:  
 *   post:
 *     summary: 清理过期任务
 *     description: 清理超过指定时间的已完成或失败的批处理任务
 *     tags: [Batch Jobs]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxAgeMs:
 *                 type: number
 *     responses:
 *       200:
 *         description: 清理成功
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const { maxAgeMs = 24 * 60 * 60 * 1000 } = req.body;
    batchJobService.cleanupOldJobs(maxAgeMs);
    
    return res.json({
      message: '过期任务清理成功'
    });
  } catch (error) {
    logger.error('清理过期任务失败:', error);
    return res.status(500).json({
      error: '清理过期任务失败',
      code: 'CLEANUP_FAILED'
    });
  }
});

export default router;
