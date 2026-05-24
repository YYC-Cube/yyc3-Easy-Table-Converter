/**
 * @file AI数据分析路由
 * @description 提供表格数据的分析、预测、分类和可视化建议的RESTful API接口
 * @module routes/data-analysis.routes
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { Router, Request, Response, NextFunction } from 'express';
import { DataAnalysisService } from '../services/DataAnalysisService';
import { 
  DataAnalysisRequest, 
  DataOperation, 
  DataAnalysisResponse,
  DataSummary, 
  DataPrediction,
  DataClassification,
  AnomalyDetection,
  DataInsights,
  VisualizationSuggestions
} from '../types';
import { logger } from '../utils/logger';
import { z } from 'zod';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';

// 创建路由实例
const router = Router();

// 数据分析服务实例
const dataAnalysisService = new DataAnalysisService();

// 配置multer用于CSV文件上传
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
    const allowedExtensions = ['.csv'];
    
    const extname = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(extname)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，仅支持CSV文件'), false);
    }
  }
});

// 验证请求参数schema
const dataAnalysisBaseSchema = z.object({
  operation: z.nativeEnum(DataOperation),
  modelId: z.string().optional(),
  provider: z.string().optional(),
  options: z.object({
    targetColumn: z.string().optional(),
    featureColumns: z.array(z.string()).optional(),
    correlationMethod: z.enum(['pearson', 'kendall', 'spearman']).optional(),
    predictionHorizon: z.number().min(1).optional(),
    anomalyThreshold: z.number().min(0).optional(),
    maxInsights: z.number().min(1).max(50).optional()
  }).optional()
});

// CSV数据解析辅助函数
const parseCSVData = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(new Error(`CSV解析失败: ${error.message}`));
      });
  });
};

// 清理临时文件的辅助函数
const cleanupTempFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error(`清理临时文件失败: ${filePath}`, err);
      }
    });
  }
};

/**
 * @swagger
 * /api/data/analyze:
 *   post:
 *     summary: 分析数据
 *     description: 根据指定操作对表格数据进行分析、预测、分类、异常检测或洞察生成
 *     tags: [数据分析]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: 
 *                 type: string
 *                 format: binary
 *                 description: 要分析的CSV数据文件
 *               operation:
 *                 type: string
 *                 enum: [summary, prediction, classification, anomaly_detection, generate_insights, suggest_visualizations]
 *                 description: 数据分析操作类型
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *               options:
 *                 type: string
 *                 description: 可选，JSON格式的操作选项
 *     responses:
 *       200: 
 *         description: 数据分析成功
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/analyze', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  // 保存文件路径以便清理
  let tempFilePath: string | null = null;
  
  try {
    // 检查文件是否上传
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '未提供数据文件'
      });
    }

    tempFilePath = req.file.path;
    
    // 验证请求参数
    const { operation, modelId, provider, options } = dataAnalysisBaseSchema.parse({
      operation: req.body.operation,
      modelId: req.body.modelId,
      provider: req.body.provider,
      options: req.body.options ? JSON.parse(req.body.options) : undefined
    });

    logger.info(`接收数据分析请求: ${operation}`, {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      modelId,
      provider
    });

    // 解析CSV数据
    const data = await parseCSVData(req.file.path);
    
    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: '数据文件为空或格式错误'
      });
    }

    const request: DataAnalysisRequest = {
      data,
      operation,
      modelId,
      provider,
      options
    };

    // 执行数据分析
    const result: DataAnalysisResponse = await dataAnalysisService.analyzeData(request);

    logger.info('数据分析完成', {
      operation,
      success: result.success,
      dataCount: data.length
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('数据分析请求参数验证失败:', error.issues);
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }

    logger.error('数据分析失败:', error);
    next(error);
  } finally {
    // 清理临时文件
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * @swagger
 * /api/data/summary:
 *   post:
 *     summary: 数据摘要
 *     description: 生成数据的统计摘要和概述
 *     tags: [数据分析]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: 
 *                 type: string
 *                 format: binary
 *                 description: 要分析的CSV数据文件
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 数据摘要生成成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/summary', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供数据文件' });
    }

    tempFilePath = req.file.path;
    
    // 解析CSV数据
    const data = await parseCSVData(req.file.path);
    
    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: '数据文件为空或格式错误'
      });
    }

    const request: DataAnalysisRequest = {
      data,
      operation: DataOperation.SUMMARY,
      modelId: req.body.modelId,
      provider: req.body.provider
    };

    logger.info('接收数据摘要请求', { fileName: req.file.originalname, dataCount: data.length });
    const result: DataSummary = await dataAnalysisService.generateDataSummary(request);

    return res.status(200).json({
      success: true,
      operation: DataOperation.SUMMARY,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    logger.error('数据摘要生成失败:', error);
    next(error);
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * @swagger
 * /api/data/prediction:
 *   post:
 *     summary: 数据预测
 *     description: 基于历史数据进行预测分析
 *     tags: [数据分析]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: 
 *                 type: string
 *                 format: binary
 *                 description: 要分析的CSV数据文件
 *               targetColumn: 
 *                 type: string
 *                 required: true
 *                 description: 要预测的目标列名
 *               featureColumns:
 *                 type: string
 *                 description: 用于预测的特征列名，逗号分隔
 *               predictionHorizon:
 *                 type: number
 *                 description: 预测的时间范围
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 数据预测成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/prediction', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供数据文件' });
    }

    tempFilePath = req.file.path;
    
    // 验证预测参数
    const { targetColumn, featureColumns, predictionHorizon } = z.object({
      targetColumn: z.string(),
      featureColumns: z.string().optional(),
      predictionHorizon: z.number().min(1).optional()
    }).parse({
      targetColumn: req.body.targetColumn,
      featureColumns: req.body.featureColumns,
      predictionHorizon: req.body.predictionHorizon ? parseInt(req.body.predictionHorizon) : undefined
    });

    // 解析CSV数据
    const data = await parseCSVData(req.file.path);
    
    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: '数据文件为空或格式错误'
      });
    }

    // 检查目标列是否存在
    if (!data[0].hasOwnProperty(targetColumn)) {
      return res.status(400).json({
        success: false,
        error: `目标列 "${targetColumn}" 不存在于数据中`
      });
    }

    const request: DataAnalysisRequest = {
      data,
      operation: DataOperation.PREDICTION,
      modelId: req.body.modelId,
      provider: req.body.provider,
      options: {
        targetColumn,
        featureColumns: featureColumns ? featureColumns.split(',').map(col => col.trim()) : undefined,
        predictionHorizon
      }
    };

    logger.info('接收数据预测请求', { fileName: req.file.originalname, targetColumn });
    const result: DataPrediction = await dataAnalysisService.predictData(request);

    return res.status(200).json({
      success: true,
      operation: DataOperation.PREDICTION,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('数据预测请求参数验证失败:', error.issues);
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }

    logger.error('数据预测失败:', error);
    next(error);
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * @swagger
 * /api/data/classification:
 *   post:
 *     summary: 数据分类
 *     description: 对数据进行分类分析
 *     tags: [数据分析]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: 
 *                 type: string
 *                 format: binary
 *                 description: 要分析的CSV数据文件
 *               targetColumn: 
 *                 type: string
 *                 required: true
 *                 description: 要分类的目标列名
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 数据分类成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/classification', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供数据文件' });
    }

    tempFilePath = req.file.path;
    
    // 验证分类参数
    const { targetColumn } = z.object({
      targetColumn: z.string()
    }).parse({
      targetColumn: req.body.targetColumn
    });

    // 解析CSV数据
    const data = await parseCSVData(req.file.path);
    
    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: '数据文件为空或格式错误'
      });
    }

    const request: DataAnalysisRequest = {
      data,
      operation: DataOperation.CLASSIFICATION,
      modelId: req.body.modelId,
      provider: req.body.provider,
      options: { targetColumn }
    };

    logger.info('接收数据分类请求', { fileName: req.file.originalname, targetColumn });
    const result: DataClassification = await dataAnalysisService.classifyData(request);

    return res.status(200).json({
      success: true,
      operation: DataOperation.CLASSIFICATION,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('数据分类请求参数验证失败:', error.issues);
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }

    logger.error('数据分类失败:', error);
    next(error);
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * @swagger
 * /api/data/anomaly-detection:
 *   post:
 *     summary: 异常检测
 *     description: 检测数据中的异常值和离群点
 *     tags: [数据分析]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: 
 *                 type: string
 *                 format: binary
 *                 description: 要分析的CSV数据文件
 *               anomalyThreshold:
 *                 type: number
 *                 description: 异常检测阈值
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 异常检测成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/anomaly-detection', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供数据文件' });
    }

    tempFilePath = req.file.path;
    
    // 验证参数
    const { anomalyThreshold } = z.object({
      anomalyThreshold: z.number().min(0).optional()
    }).parse({
      anomalyThreshold: req.body.anomalyThreshold ? parseFloat(req.body.anomalyThreshold) : undefined
    });

    // 解析CSV数据
    const data = await parseCSVData(req.file.path);
    
    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: '数据文件为空或格式错误'
      });
    }

    const request: DataAnalysisRequest = {
      data,
      operation: DataOperation.ANOMALY_DETECTION,
      modelId: req.body.modelId,
      provider: req.body.provider,
      options: { anomalyThreshold }
    };

    logger.info('接收异常检测请求', { fileName: req.file.originalname });
    const result: AnomalyDetection = await dataAnalysisService.detectAnomalies(request);

    return res.status(200).json({
      success: true,
      operation: DataOperation.ANOMALY_DETECTION,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('异常检测请求参数验证失败:', error.issues);
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }

    logger.error('异常检测失败:', error);
    next(error);
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * @swagger
 * /api/data/insights:
 *   post:
 *     summary: 生成数据洞察
 *     description: 从数据中提取有价值的洞察和发现
 *     tags: [数据分析]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: 
 *                 type: string
 *                 format: binary
 *                 description: 要分析的CSV数据文件
 *               maxInsights:
 *                 type: number
 *                 description: 最大洞察数量
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 数据洞察生成成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/insights', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供数据文件' });
    }

    tempFilePath = req.file.path;
    
    // 验证参数
    const { maxInsights } = z.object({
      maxInsights: z.number().min(1).max(50).optional()
    }).parse({
      maxInsights: req.body.maxInsights ? parseInt(req.body.maxInsights) : undefined
    });

    // 解析CSV数据
    const data = await parseCSVData(req.file.path);
    
    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: '数据文件为空或格式错误'
      });
    }

    const request: DataAnalysisRequest = {
      data,
      operation: DataOperation.GENERATE_INSIGHTS,
      modelId: req.body.modelId,
      provider: req.body.provider,
      options: { maxInsights }
    };

    logger.info('接收数据洞察请求', { fileName: req.file.originalname });
    const result: DataInsights = await dataAnalysisService.generateInsights(request);

    return res.status(200).json({
      success: true,
      operation: DataOperation.GENERATE_INSIGHTS,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('数据洞察请求参数验证失败:', error.issues);
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }

    logger.error('数据洞察生成失败:', error);
    next(error);
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * @swagger
 * /api/data/visualization-suggestions:
 *   post:
 *     summary: 可视化建议
 *     description: 根据数据特征提供最佳可视化方式建议
 *     tags: [数据分析]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: 
 *                 type: string
 *                 format: binary
 *                 description: 要分析的CSV数据文件
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 可视化建议生成成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/visualization-suggestions', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供数据文件' });
    }

    tempFilePath = req.file.path;
    
    // 解析CSV数据
    const data = await parseCSVData(req.file.path);
    
    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: '数据文件为空或格式错误'
      });
    }

    const request: DataAnalysisRequest = {
      data,
      operation: DataOperation.SUGGEST_VISUALIZATIONS,
      modelId: req.body.modelId,
      provider: req.body.provider
    };

    logger.info('接收可视化建议请求', { fileName: req.file.originalname });
    const result: VisualizationSuggestions = await dataAnalysisService.suggestVisualizations(request);

    return res.status(200).json({
      success: true,
      operation: DataOperation.SUGGEST_VISUALIZATIONS,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    logger.error('可视化建议生成失败:', error);
    next(error);
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * 错误处理中间件
 */
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('数据分析API错误:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  return res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default router;