/**
 * @file AI文本处理路由
 * @description 提供文本分析、摘要、分类、生成和关键词提取的RESTful API接口
 * @module routes/text-processing.routes
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { Router, Request, Response, NextFunction } from 'express';
import { TextProcessingService } from '../services/TextProcessingService';
import { 
  TextProcessingRequest, 
  TextOperation, 
  TextProcessingResponse,
  TextProcessingOptions
} from '../types';
import { logger } from '../utils/logger';
import { z } from 'zod';

// 创建路由实例
const router = Router();

// 文本处理服务实例
const textService = new TextProcessingService();

// 文本处理请求验证schema
const textProcessingSchema = z.object({
  text: z.string().min(1, '文本内容不能为空').max(50000, '文本内容不能超过50000字符'),
  operation: z.nativeEnum(TextOperation),
  modelId: z.string().optional(),
  provider: z.string().optional(),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).optional(),
    language: z.string().optional(),
    keywordsCount: z.number().min(1).max(50).optional(),
    summaryLength: z.enum(['short', 'medium', 'long']).optional(),
    categoryCount: z.number().min(1).max(10).optional()
  }).optional()
});

/**
 * @swagger
 * /api/text/process:
 *   post:
 *     summary: 处理文本内容
 *     description: 根据指定操作对文本进行分析、摘要、分类、生成或关键词提取
 *     tags: [文本处理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: 
 *                 type: string
 *                 description: 要处理的文本内容
 *               operation:
 *                 type: string
 *                 enum: [analyze, summarize, classify, generate, extract_keywords]
 *                 description: 文本操作类型
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *               options:
 *                 type: object
 *                 description: 操作相关的选项
 *     responses:
 *       200: 
 *         description: 文本处理成功
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证请求参数
    const validatedData = textProcessingSchema.parse(req.body);
    
    const request: TextProcessingRequest = {
      text: validatedData.text,
      operation: validatedData.operation,
      modelId: validatedData.modelId,
      provider: validatedData.provider,
      options: validatedData.options
    };

    logger.info(`接收文本处理请求: ${validatedData.operation}`, {
      textLength: validatedData.text.length,
      modelId: validatedData.modelId,
      provider: validatedData.provider
    });

    // 执行文本处理
    const result: TextProcessingResponse = await textService.processText(request);

    logger.info('文本处理完成', {
      operation: validatedData.operation,
      success: result.success
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('文本处理请求参数验证失败:', error.issues);
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }

    logger.error('文本处理失败:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/text/analyze:
 *   post:
 *     summary: 分析文本
 *     description: 分析文本内容，提供情感、主题、语言等分析结果
 *     tags: [文本处理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: 
 *                 type: string
 *                 description: 要分析的文本
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 文本分析成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, modelId, provider } = z.object({
      text: z.string().min(1, '文本内容不能为空').max(50000, '文本内容不能超过50000字符'),
      modelId: z.string().optional(),
      provider: z.string().optional()
    }).parse(req.body);

    const request: TextProcessingRequest = {
      text,
      operation: TextOperation.ANALYZE,
      modelId,
      provider
    };

    logger.info('接收文本分析请求', { textLength: text.length });
    const result = await textService.analyzeText(request);

    return res.status(200).json({
      success: true,
      operation: TextOperation.ANALYZE,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues
      });
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/text/summarize:
 *   post:
 *     summary: 生成文本摘要
 *     description: 为长文本生成简洁的摘要，支持指定摘要长度
 *     tags: [文本处理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: 
 *                 type: string
 *                 description: 要生成摘要的文本
 *               summaryLength: 
 *                 type: string
 *                 enum: [short, medium, long]
 *                 default: medium
 *                 description: 摘要长度
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 摘要生成成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/summarize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, summaryLength = 'medium', modelId, provider } = z.object({
      text: z.string().min(10, '文本内容太短，无法生成摘要').max(50000, '文本内容不能超过50000字符'),
      summaryLength: z.enum(['short', 'medium', 'long']).optional(),
      modelId: z.string().optional(),
      provider: z.string().optional()
    }).parse(req.body);

    const request: TextProcessingRequest = {
      text,
      operation: TextOperation.SUMMARIZE,
      modelId,
      provider,
      options: { summaryLength }
    };

    logger.info('接收文本摘要请求', { textLength: text.length, summaryLength });
    const result = await textService.summarizeText(request);

    return res.status(200).json({
      success: true,
      operation: TextOperation.SUMMARIZE,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues
      });
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/text/classify:
 *   post:
 *     summary: 文本分类
 *     description: 对文本进行分类，可指定类别数量
 *     tags: [文本处理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: 
 *                 type: string
 *                 description: 要分类的文本
 *               categoryCount: 
 *                 type: number
 *                 default: 3
 *                 description: 返回的类别数量
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 文本分类成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/classify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, categoryCount = 3, modelId, provider } = z.object({
      text: z.string().min(1, '文本内容不能为空').max(50000, '文本内容不能超过50000字符'),
      categoryCount: z.number().min(1).max(10).optional(),
      modelId: z.string().optional(),
      provider: z.string().optional()
    }).parse(req.body);

    const request: TextProcessingRequest = {
      text,
      operation: TextOperation.CLASSIFY,
      modelId,
      provider,
      options: { categoryCount }
    };

    logger.info('接收文本分类请求', { textLength: text.length, categoryCount });
    const result = await textService.classifyText(request);

    return res.status(200).json({
      success: true,
      operation: TextOperation.CLASSIFY,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues
      });
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/text/extract-keywords:
 *   post:
 *     summary: 提取关键词
 *     description: 从文本中提取重要的关键词和短语
 *     tags: [文本处理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: 
 *                 type: string
 *                 description: 要提取关键词的文本
 *               keywordsCount: 
 *                 type: number
 *                 default: 10
 *                 description: 提取的关键词数量
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 关键词提取成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/extract-keywords', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, keywordsCount = 10, modelId, provider } = z.object({
      text: z.string().min(10, '文本内容太短，无法提取关键词').max(50000, '文本内容不能超过50000字符'),
      keywordsCount: z.number().min(1).max(50).optional(),
      modelId: z.string().optional(),
      provider: z.string().optional()
    }).parse(req.body);

    const request: TextProcessingRequest = {
      text,
      operation: TextOperation.EXTRACT_KEYWORDS,
      modelId,
      provider,
      options: { keywordsCount }
    };

    logger.info('接收关键词提取请求', { textLength: text.length, keywordsCount });
    const result = await textService.extractKeywords(request);

    return res.status(200).json({
      success: true,
      operation: TextOperation.EXTRACT_KEYWORDS,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues
      });
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/text/generate:
 *   post:
 *     summary: 生成文本
 *     description: 根据提示生成文本内容
 *     tags: [文本处理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: 
 *                 type: string
 *                 description: 生成文本的提示词
 *               maxTokens: 
 *                 type: number
 *                 default: 500
 *                 description: 最大生成长度
 *               temperature: 
 *                 type: number
 *                 default: 0.7
 *                 description: 生成的随机性，0-2之间
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 文本生成成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, maxTokens = 500, temperature = 0.7, modelId, provider } = z.object({
      text: z.string().min(1, '提示词不能为空').max(5000, '提示词不能超过5000字符'),
      maxTokens: z.number().min(10).max(2000).optional(),
      temperature: z.number().min(0).max(2).optional(),
      modelId: z.string().optional(),
      provider: z.string().optional()
    }).parse(req.body);

    const request: TextProcessingRequest = {
      text,
      operation: TextOperation.GENERATE,
      modelId,
      provider,
      options: { maxTokens, temperature }
    };

    logger.info('接收文本生成请求', { promptLength: text.length, maxTokens, temperature });
    const result = await textService.generateText(request);

    return res.status(200).json({
      success: true,
      operation: TextOperation.GENERATE,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues
      });
    }
    next(error);
  }
});

/**
 * 错误处理中间件
 */
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('文本处理API错误:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  return res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default router;