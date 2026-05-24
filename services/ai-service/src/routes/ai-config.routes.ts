/**
 * @file AI配置管理路由
 * @description 提供AI模型配置、API密钥管理和模型使用统计的RESTful API接口
 * @module routes/ai-config.routes
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AIConfigService } from '../services/AIConfigService';
import { 
  ModelConfig, 
  ProviderConfig, 
  UpdateModelRequest,
  UpdateProviderRequest,
  ModelStats,
  EnableModelRequest,
  ApiKeyRequest
} from '../types';
import { logger } from '../utils/logger';
import { z } from 'zod';

// 创建路由实例
const router = Router();

// AI配置服务实例
const configService = AIConfigService.getInstance();

// 验证模型ID的schema
const modelIdSchema = z.object({
  modelId: z.string()
});

// 验证提供商名称的schema
const providerNameSchema = z.object({
  providerName: z.string()
});

// 验证更新模型请求的schema
const updateModelSchema = z.object({
  modelId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  parameters: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().min(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional()
  }).optional(),
  cost: z.object({
    input: z.number().min(0).optional(),
    output: z.number().min(0).optional(),
    unit: z.string().optional()
  }).optional(),
  tags: z.array(z.string()).optional()
});

// 验证更新提供商请求的schema
const updateProviderSchema = z.object({
  providerName: z.string(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  timeout: z.number().min(1000).optional(),
  maxRetries: z.number().min(0).optional(),
  enabled: z.boolean().optional()
});

// 验证启用/禁用模型请求的schema
const enableModelSchema = z.object({
  modelId: z.string(),
  enabled: z.boolean()
});

// 验证API密钥请求的schema
const apiKeySchema = z.object({
  providerName: z.string(),
  apiKey: z.string()
});

/**
 * @swagger
 * /api/config/models:
 *   get:
 *     summary: 获取所有模型配置
 *     description: 获取系统中配置的所有AI模型列表
 *     tags: [AI配置]
 *     responses:
 *       200: 
 *         description: 成功获取模型列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ModelConfig'
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/models', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('获取所有模型配置请求');
    const models: ModelConfig[] = await configService.getAllModels();
    
    return res.status(200).json({
      success: true,
      data: models
    });
  } catch (error) {
    logger.error('获取模型配置失败:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/config/models/{modelId}:
 *   get:
 *     summary: 获取特定模型配置
 *     description: 根据模型ID获取模型详细配置
 *     tags: [AI配置]
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: 
 *         description: 成功获取模型配置
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModelConfig'
 *       404: 
 *         description: 模型不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/models/:modelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = modelIdSchema.parse(req.params);
    
    logger.info(`获取模型配置: ${modelId}`);
    const model: ModelConfig | null = await configService.getModel(modelId);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        error: `模型 ${modelId} 不存在`
      });
    }
    
    return res.status(200).json({
      success: true,
      data: model
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }
    
    logger.error('获取模型配置失败:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/config/models/{modelId}:
 *   put:
 *     summary: 更新模型配置
 *     description: 更新指定模型的配置信息
 *     tags: [AI配置]
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: 
 *                 type: string
 *                 description: 模型名称
 *               description: 
 *                 type: string
 *                 description: 模型描述
 *               parameters: 
 *                 type: object
 *                 description: 模型参数配置
 *               cost: 
 *                 type: object
 *                 description: 模型成本配置
 *               tags: 
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 模型标签
 *     responses:
 *       200: 
 *         description: 模型配置更新成功
 *       404: 
 *         description: 模型不存在
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.put('/models/:modelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = modelIdSchema.parse(req.params);
    const body = req.body;
    
    // 合并路径参数和请求体
    const updateRequest = { ...body, modelId };
    const validatedRequest = updateModelSchema.parse(updateRequest);
    
    logger.info(`更新模型配置: ${modelId}`);
    
    const updatedModel: ModelConfig | null = await configService.updateModel(validatedRequest);
    
    if (!updatedModel) {
      return res.status(404).json({
        success: false,
        error: `模型 ${modelId} 不存在`
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '模型配置更新成功',
      data: updatedModel
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }
    
    logger.error('更新模型配置失败:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/config/models/{modelId}/enable:
 *   post:
 *     summary: 启用/禁用模型
 *     description: 启用或禁用指定模型
 *     tags: [AI配置]
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled: 
 *                 type: boolean
 *                 description: 是否启用模型
 *     responses:
 *       200: 
 *         description: 模型状态更新成功
 *       404: 
 *         description: 模型不存在
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/models/:modelId/enable', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = modelIdSchema.parse(req.params);
    const body = req.body;
    
    // 合并路径参数和请求体
    const enableRequest = { ...body, modelId };
    const validatedRequest = enableModelSchema.parse(enableRequest);
    
    logger.info(`${validatedRequest.enabled ? '启用' : '禁用'}模型: ${modelId}`);
    
    const success: boolean = await configService.enableModel(validatedRequest);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `模型 ${modelId} 不存在`
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `模型 ${validatedRequest.enabled ? '已启用' : '已禁用'}`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }
    
    logger.error('更新模型状态失败:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/config/providers:
 *   get:
 *     summary: 获取所有提供商配置
 *     description: 获取系统中配置的所有AI服务提供商列表
 *     tags: [AI配置]
 *     responses:
 *       200: 
 *         description: 成功获取提供商列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProviderConfig'
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/providers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('获取所有提供商配置请求');
    const providers: ProviderConfig[] = await configService.getAllProviders();
    
    // 过滤掉API密钥信息
    const safeProviders = providers.map(provider => ({
      ...provider,
      apiKey: provider.apiKey ? '***' : undefined
    }));
    
    return res.status(200).json({
      success: true,
      data: safeProviders
    });
  } catch (error) {
    logger.error('获取提供商配置失败:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/config/providers/{providerName}:
 *   get:
 *     summary: 获取特定提供商配置
 *     description: 根据提供商名称获取详细配置
 *     tags: [AI配置]
 *     parameters:
 *       - in: path
 *         name: providerName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: 
 *         description: 成功获取提供商配置
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProviderConfig'
 *       404: 
 *         description: 提供商不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/providers/:providerName', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerName } = providerNameSchema.parse(req.params);
    
    logger.info(`获取提供商配置: ${providerName}`);
    const provider: ProviderConfig | null = await configService.getProvider(providerName);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: `提供商 ${providerName} 不存在`
      });
    }
    
    // 过滤掉API密钥信息
    const safeProvider = {
      ...provider,
      apiKey: provider.apiKey ? '***' : undefined
    };
    
    return res.status(200).json({
      success: true,
      data: safeProvider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }
    
    logger.error('获取提供商配置失败:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/config/providers/{providerName}:
 *   put:
 *     summary: 更新提供商配置
 *     description: 更新指定提供商的配置信息
 *     tags: [AI配置]
 *     parameters:
 *       - in: path
 *         name: providerName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               baseUrl: 
 *                 type: string
 *                 description: API基础URL
 *               timeout: 
 *                 type: number
 *                 description: 请求超时时间(毫秒)
 *               maxRetries: 
 *                 type: number
 *                 description: 最大重试次数
 *               enabled: 
 *                 type: boolean
 *                 description: 是否启用该提供商
 *     responses:
 *       200: 
 *         description: 提供商配置更新成功
 *       404: 
 *         description: 提供商不存在
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.put('/providers/:providerName', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerName } = providerNameSchema.parse(req.params);
    const body = req.body;
    
    // 合并路径参数和请求体
    const updateRequest = { ...body, providerName };
    const validatedRequest = updateProviderSchema.parse(updateRequest);
    
    logger.info(`更新提供商配置: ${providerName}`);
    
    const updatedProvider: ProviderConfig | null = await configService.updateProvider(validatedRequest);
    
    if (!updatedProvider) {
      return res.status(404).json({
        success: false,
        error: `提供商 ${providerName} 不存在`
      });
    }
    
    // 过滤掉API密钥信息
    const safeProvider = {
      ...updatedProvider,
      apiKey: updatedProvider.apiKey ? '***' : undefined
    };
    
    return res.status(200).json({
      success: true,
      message: '提供商配置更新成功',
      data: safeProvider
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }
    
    logger.error('更新提供商配置失败:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/config/providers/{providerName}/api-key:
 *   post:
 *     summary: 设置API密钥
 *     description: 为指定提供商设置API密钥
 *     tags: [AI配置]
 *     parameters:
 *       - in: path
 *         name: providerName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               apiKey: 
 *                 type: string
 *                 description: API密钥
 *     responses:
 *       200: 
 *         description: API密钥设置成功
 *       404: 
 *         description: 提供商不存在
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/providers/:providerName/api-key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerName } = providerNameSchema.parse(req.params);
    const body = req.body;
    
    // 合并路径参数和请求体
    const apiKeyRequest = { ...body, providerName };
    const validatedRequest = apiKeySchema.parse(apiKeyRequest);
    
    logger.info(`设置提供商API密钥: ${providerName}`);
    
    const success: boolean = await configService.setApiKey(validatedRequest);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `提供商 ${providerName} 不存在`
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'API密钥设置成功'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }
    
    logger.error('设置API密钥失败:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/config/stats:
 *   get:
 *     summary: 获取模型使用统计
 *     description: 获取所有模型的使用统计信息
 *     tags: [AI配置]
 *     responses:
 *       200: 
 *         description: 成功获取使用统计
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ModelStats'
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('获取模型使用统计请求');
    const stats: ModelStats[] = await configService.getModelStats();
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取模型使用统计失败:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/config/reload:
 *   post:
 *     summary: 重新加载配置
 *     description: 从配置文件重新加载所有AI配置
 *     tags: [AI配置]
 *     responses:
 *       200: 
 *         description: 配置重新加载成功
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/reload', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('重新加载配置请求');
    
    await configService.loadConfig();
    
    return res.status(200).json({
      success: true,
      message: '配置重新加载成功'
    });
  } catch (error) {
    logger.error('重新加载配置失败:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/config/save:
 *   post:
 *     summary: 保存配置
 *     description: 将当前配置保存到配置文件
 *     tags: [AI配置]
 *     responses:
 *       200: 
 *         description: 配置保存成功
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/save', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('保存配置请求');
    
    await configService.saveConfig();
    
    return res.status(200).json({
      success: true,
      message: '配置保存成功'
    });
  } catch (error) {
    logger.error('保存配置失败:', error);
    next(error);
  }
});

/**
 * 错误处理中间件
 */
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('AI配置API错误:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  return res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default router;