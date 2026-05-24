/**
 * @file AI图像处理路由
 * @description 提供图像分析、识别、转换和增强的RESTful API接口
 * @module routes/image-processing.routes
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ImageProcessingService } from '../services/ImageProcessingService';
import { 
  ImageProcessingRequest, 
  ImageOperation, 
  ImageProcessingResponse
} from '../types';
import { logger } from '../utils/logger';
import { z } from 'zod';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// 创建路由实例
const router = Router();

// 图像处理服务实例
const imageService = new ImageProcessingService();

// 配置multer用于文件上传
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
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的图像格式，仅支持JPG、PNG、WebP、GIF、BMP'), false);
    }
  }
});

// 验证请求参数schema
const imageProcessingBaseSchema = z.object({
  operation: z.nativeEnum(ImageOperation),
  modelId: z.string().optional(),
  provider: z.string().optional(),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).optional(),
    enhanceQuality: z.boolean().optional(),
    resizeWidth: z.number().min(1).optional(),
    resizeHeight: z.number().min(1).optional(),
    detectObjects: z.boolean().optional(),
    detectText: z.boolean().optional()
  }).optional()
});

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
 * /api/image/process:
 *   post:
 *     summary: 处理图像
 *     description: 根据指定操作对图像进行分析、分类、对象检测、文字提取或增强
 *     tags: [图像处理]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: 
 *                 type: string
 *                 format: binary
 *                 description: 要处理的图像文件
 *               operation:
 *                 type: string
 *                 enum: [analyze, classify, detect_objects, extract_text, enhance]
 *                 description: 图像操作类型
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
 *         description: 图像处理成功
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/process', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  // 保存文件路径以便清理
  let tempFilePath: string | null = null;
  
  try {
    // 检查文件是否上传
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '未提供图像文件'
      });
    }

    tempFilePath = req.file.path;
    
    // 验证请求参数
    const { operation, modelId, provider, options } = imageProcessingBaseSchema.parse({
      operation: req.body.operation,
      modelId: req.body.modelId,
      provider: req.body.provider,
      options: req.body.options ? JSON.parse(req.body.options) : undefined
    });

    logger.info(`接收图像处理请求: ${operation}`, {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      modelId,
      provider
    });

    // 读取图像文件为Base64
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;
    const base64WithPrefix = `data:${mimeType};base64,${base64Image}`;

    const request: ImageProcessingRequest = {
      image: base64WithPrefix,
      operation,
      modelId,
      provider,
      options
    };

    // 执行图像处理
    const result: ImageProcessingResponse = await imageService.processImage(request);

    logger.info('图像处理完成', {
      operation,
      success: result.success
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('图像处理请求参数验证失败:', error.issues);
      return res.status(400).json({
        success: false,
        error: '请求参数错误',
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
    }

    logger.error('图像处理失败:', error);
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
 * /api/image/analyze:
 *   post:
 *     summary: 分析图像
 *     description: 分析图像内容，提供详细描述和理解
 *     tags: [图像处理]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: 
 *                 type: string
 *                 format: binary
 *                 description: 要分析的图像
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 图像分析成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/analyze', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供图像文件' });
    }

    tempFilePath = req.file.path;
    
    // 读取并转换图像
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const base64WithPrefix = `data:${req.file.mimetype};base64,${base64Image}`;

    const request: ImageProcessingRequest = {
      image: base64WithPrefix,
      operation: ImageOperation.ANALYZE,
      modelId: req.body.modelId,
      provider: req.body.provider
    };

    logger.info('接收图像分析请求', { fileName: req.file.originalname });
    const result = await imageService.analyzeImage(request);

    return res.status(200).json({
      success: true,
      operation: ImageOperation.ANALYZE,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    logger.error('图像分析失败:', error);
    next(error);
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * @swagger
 * /api/image/classify:
 *   post:
 *     summary: 图像分类
 *     description: 对图像内容进行分类
 *     tags: [图像处理]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: 
 *                 type: string
 *                 format: binary
 *                 description: 要分类的图像
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 图像分类成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/classify', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供图像文件' });
    }

    tempFilePath = req.file.path;
    
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const base64WithPrefix = `data:${req.file.mimetype};base64,${base64Image}`;

    const request: ImageProcessingRequest = {
      image: base64WithPrefix,
      operation: ImageOperation.CLASSIFY,
      modelId: req.body.modelId,
      provider: req.body.provider
    };

    logger.info('接收图像分类请求', { fileName: req.file.originalname });
    const result = await imageService.classifyImage(request);

    return res.status(200).json({
      success: true,
      operation: ImageOperation.CLASSIFY,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    logger.error('图像分类失败:', error);
    next(error);
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * @swagger
 * /api/image/detect-objects:
 *   post:
 *     summary: 检测图像中的对象
 *     description: 识别并定位图像中的对象
 *     tags: [图像处理]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: 
 *                 type: string
 *                 format: binary
 *                 description: 要检测对象的图像
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 对象检测成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/detect-objects', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供图像文件' });
    }

    tempFilePath = req.file.path;
    
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const base64WithPrefix = `data:${req.file.mimetype};base64,${base64Image}`;

    const request: ImageProcessingRequest = {
      image: base64WithPrefix,
      operation: ImageOperation.DETECT_OBJECTS,
      modelId: req.body.modelId,
      provider: req.body.provider
    };

    logger.info('接收对象检测请求', { fileName: req.file.originalname });
    const result = await imageService.detectObjects(request);

    return res.status(200).json({
      success: true,
      operation: ImageOperation.DETECT_OBJECTS,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    logger.error('对象检测失败:', error);
    next(error);
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * @swagger
 * /api/image/extract-text:
 *   post:
 *     summary: 提取图像中的文本
 *     description: 识别图像中的文本内容
 *     tags: [图像处理]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: 
 *                 type: string
 *                 format: binary
 *                 description: 要提取文本的图像
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 文本提取成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/extract-text', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供图像文件' });
    }

    tempFilePath = req.file.path;
    
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const base64WithPrefix = `data:${req.file.mimetype};base64,${base64Image}`;

    const request: ImageProcessingRequest = {
      image: base64WithPrefix,
      operation: ImageOperation.EXTRACT_TEXT,
      modelId: req.body.modelId,
      provider: req.body.provider
    };

    logger.info('接收文本提取请求', { fileName: req.file.originalname });
    const result = await imageService.extractText(request);

    return res.status(200).json({
      success: true,
      operation: ImageOperation.EXTRACT_TEXT,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    logger.error('文本提取失败:', error);
    next(error);
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * @swagger
 * /api/image/enhance:
 *   post:
 *     summary: 增强图像质量
 *     description: 提高图像分辨率和质量
 *     tags: [图像处理]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: 
 *                 type: string
 *                 format: binary
 *                 description: 要增强的图像
 *               enhanceQuality: 
 *                 type: boolean
 *                 default: true
 *                 description: 是否增强质量
 *               resizeWidth: 
 *                 type: number
 *                 description: 调整后的宽度
 *               resizeHeight: 
 *                 type: number
 *                 description: 调整后的高度
 *               modelId:
 *                 type: string
 *                 description: 可选，指定使用的模型ID
 *               provider:
 *                 type: string
 *                 description: 可选，指定AI服务提供商
 *     responses:
 *       200: 
 *         description: 图像增强成功
 *       400: 
 *         description: 请求参数错误
 */
router.post('/enhance', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未提供图像文件' });
    }

    tempFilePath = req.file.path;
    
    const { enhanceQuality = true, resizeWidth, resizeHeight } = z.object({
      enhanceQuality: z.boolean().optional(),
      resizeWidth: z.number().min(1).optional(),
      resizeHeight: z.number().min(1).optional()
    }).parse({
      enhanceQuality: req.body.enhanceQuality ? req.body.enhanceQuality === 'true' : true,
      resizeWidth: req.body.resizeWidth ? parseInt(req.body.resizeWidth) : undefined,
      resizeHeight: req.body.resizeHeight ? parseInt(req.body.resizeHeight) : undefined
    });

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const base64WithPrefix = `data:${req.file.mimetype};base64,${base64Image}`;

    const request: ImageProcessingRequest = {
      image: base64WithPrefix,
      operation: ImageOperation.ENHANCE,
      modelId: req.body.modelId,
      provider: req.body.provider,
      options: { enhanceQuality, resizeWidth, resizeHeight }
    };

    logger.info('接收图像增强请求', { fileName: req.file.originalname, enhanceQuality });
    const result = await imageService.enhanceImage(request);

    // 如果是图像增强，直接返回图像
    if (result && result.enhancedImage) {
      const base64Data = result.enhancedImage.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      res.set('Content-Type', 'image/png');
      return res.send(imageBuffer);
    }

    return res.status(200).json({
      success: true,
      operation: ImageOperation.ENHANCE,
      result,
      modelId: request.modelId,
      provider: request.provider
    });
  } catch (error) {
    logger.error('图像增强失败:', error);
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
  logger.error('图像处理API错误:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  return res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default router;