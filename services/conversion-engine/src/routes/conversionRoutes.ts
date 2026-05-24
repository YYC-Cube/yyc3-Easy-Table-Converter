/**
 * @file 转换服务路由配置
 * @description 定义转换服务的API端点和请求处理逻辑
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import express, { Request, Response, NextFunction } from 'express';
import { ConversionService } from '../services/conversionService';

// 路由选项接口
interface ConversionRoutesOptions {
  conversionService: ConversionService;
}

/**
 * 创建转换路由
 * @param options 路由选项
 */
export const conversionRoutes = (options: ConversionRoutesOptions): express.Router => {
  const router = express.Router();
  const { conversionService } = options;

/**
   * 获取支持的转换格式
   * @route GET /api/convert/formats
   */
  router.get('/formats', (req: Request, res: Response) => {
    const formats = conversionService.getSupportedFormats();
    res.status(200).json({
      success: true,
      formats
    });
  });

  // 请求验证中间件
function validateConversionRequest(req: Request, res: Response, next: NextFunction) {
  const { inputFile, outputFormat } = req.body;
  
  if (!inputFile) {
    return res.status(400).json({ error: 'inputFile 是必填字段' });
  }
  
  if (!outputFormat) {
    return res.status(400).json({ error: 'outputFormat 是必填字段' });
  }
  
  next();
}

/**
 * @swagger
 * /api/convert: 
 *   post:
 *     summary: 提交转换任务
 *     description: 创建一个新的文件转换任务
 *     tags: [Conversion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inputFile
 *               - outputFormat
 *             properties:
 *               inputFile:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   name: { type: string }
 *                   format: { type: string }
 *                   path: { type: string }
 *                   size: { type: number }
 *                   uploadedAt: { type: string }
 *               outputFormat:
 *                 type: string
 *               options:
 *                 type: object
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/', validateConversionRequest, async (req: Request, res: Response) => {
  try {
    const { inputFile, outputFormat, options, userId } = req.body;
    
    // 创建转换任务（自动添加到队列）
    const taskId = await conversionService.createConversionTask(inputFile, outputFormat, options, userId);
    
    res.status(200).json({
      success: true,
      taskId,
      message: '转换任务已创建',
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ 创建转换任务失败:', error);
    res.status(500).json({
      success: false,
      error: '创建转换任务失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * @swagger
 * /api/convert/{id}:
 *   get:
 *     summary: 获取转换任务状态
 *     description: 查询指定转换任务的当前状态和进度
 *     tags: [Conversion]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务状态信息
 *       404:
 *         description: 任务不存在
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    
    // 获取任务信息
    const task = await conversionService.getConversionTask(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      task: {
        id: task._id,
        status: task.status,
        inputFile: task.inputFile,
        outputFormat: task.outputFormat,
        outputFile: task.outputFile,
        error: task.error,
        metadata: task.metadata,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt
      }
    });
  } catch (error) {
    console.error('❌ 获取任务状态失败:', error);
    res.status(500).json({
      success: false,
      error: '获取任务状态失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
   * 获取转换结果
   * @swagger
   * /api/convert/{id}/result:
   *   get:
   *     summary: 获取转换结果
   *     description: 获取指定转换任务的输出文件信息
   *     tags: [Conversion]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 转换结果
   *       404:
   *         description: 任务不存在或转换未完成
   */
router.get('/:id/result', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    
    // 获取任务信息
    const task = await conversionService.getConversionTask(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }
    
    if (task.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: '转换任务尚未完成',
        status: task.status
      });
    }
    
    if (!task.outputFile) {
      return res.status(500).json({
        success: false,
        error: '转换结果文件不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      result: {
        outputFile: task.outputFile,
        metadata: task.metadata,
        conversionTime: task.completedAt ? 
          `${((task.completedAt.getTime() - task.createdAt.getTime()) / 1000).toFixed(2)}s` : 
          null
      }
    });
  } catch (error) {
    console.error('❌ 获取转换结果失败:', error);
    res.status(500).json({
      success: false,
      error: '获取转换结果失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

  /**
   * 取消转换任务
   * @swagger
   * /api/convert/{id}/cancel:
   *   post:
   *     summary: 取消转换任务
   *     description: 取消指定的转换任务
   *     tags: [Conversion]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 任务取消成功
   *       404:
   *         description: 任务不存在
   *       400:
   *         description: 任务无法取消
   */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    
    // 取消任务
    const success = await conversionService.cancelConversionTask(taskId);
    
    if (!success) {
      const task = await conversionService.getConversionTask(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: '任务不存在'
        });
      }
      return res.status(400).json({
        success: false,
        error: '任务无法取消，只有处于pending或processing状态的任务可以取消',
        status: task.status
      });
    }
    
    res.status(200).json({
      success: true,
      message: '任务已取消'
    });
  } catch (error) {
    console.error('❌ 取消任务失败:', error);
    res.status(500).json({
      success: false,
      error: '取消任务失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

  /**
   * 批量创建转换任务
   * @swagger
   * /api/convert/batch:
   *   post:
   *     summary: 批量创建转换任务
   *     description: 批量创建多个转换任务
   *     tags: [Conversion]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - tasks
   *             properties:
   *               tasks:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - inputFile
   *                     - outputFormat
   *                   properties:
   *                     inputFile:
   *                       type: object
   *                       properties:
   *                         id: { type: string }
   *                         name: { type: string }
   *                         format: { type: string }
   *                         path: { type: string }
   *                         size: { type: number }
   *                         uploadedAt: { type: string }
   *                     outputFormat:
   *                       type: string
   *                     options:
   *                       type: object
   *               userId:
   *                 type: string
   *     responses:
   *       200:
   *         description: 批量任务创建成功
   *       400:
   *         description: 请求参数错误
   */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { tasks, userId } = req.body;
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tasks 是必填字段，且必须是数组'
      });
    }
    
    // 批量创建任务
    const taskIds = await conversionService.batchCreateConversionTasks(tasks, userId);
    
    res.status(200).json({
      success: true,
      taskIds,
      message: `批量转换任务已创建，共 ${taskIds.length} 个任务`,
      count: taskIds.length,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ 批量创建转换任务失败:', error);
    res.status(500).json({
      success: false,
      error: '批量创建转换任务失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

  return router;
};

export default conversionRoutes;