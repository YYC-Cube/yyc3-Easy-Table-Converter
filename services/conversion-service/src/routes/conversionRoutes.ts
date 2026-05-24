/**
 * @file 转换服务路由配置
 * @description 处理表格转换相关的API路由
 * @module routes/conversionRoutes
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-15
 * @updated 2024-11-15
 */

import { Router } from 'express'
import { conversionController } from '../controllers/conversionController'
import { authMiddleware } from '../middleware/authMiddleware'
import { validationMiddleware } from '../middleware/validationMiddleware'
import { conversionSchema } from '../schemas/conversionSchema'
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware'
import { loggerMiddleware } from '../middleware/loggerMiddleware'
import { corsMiddleware } from '../middleware/corsMiddleware'
import { fileUploadMiddleware } from '../middleware/fileUploadMiddleware'

/**
 * @file 转换服务路由配置
 * @description 处理表格转换相关的API路由
 * @module routes/conversionRoutes
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-15
 * @updated 2024-11-15
 */

const router = Router()

// 应用中间件
router.use(corsMiddleware)
router.use(loggerMiddleware)
router.use(rateLimitMiddleware(100, 15 * 60 * 1000)) // 100 requests per 15 minutes

/**
 * @swagger
 * /api/conversion/formats: 
 *   get:
 *     summary: 获取支持的文件格式
 *     description: 返回系统支持的所有文件格式列表
 *     tags: [Conversion]
 *     responses:
 *       200: 
 *         description: 成功返回支持的格式列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 formats: { type: array, items: { type: string } }
 */
router.get('/formats', conversionController.getSupportedFormats)

/**
 * @swagger
 * /api/conversion/data:
 *   post:
 *     summary: 内存数据转换
 *     description: 直接转换内存中的数据，不需要文件上传
 *     tags: [Conversion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceFormat: { type: string, required: true }
 *               targetFormat: { type: string, required: true }
 *               sourceData: { type: string, required: true }
 *               options: { type: object }
 *     responses:
 *       200: { description: '数据转换成功' }
 *       400: { description: '无效的请求参数' }
 *       401: { description: '未授权' }
 *       500: { description: '转换失败' }
 */
router.post('/data', authMiddleware, validationMiddleware(conversionSchema.data), conversionController.convertData)

/**
 * @swagger
 * /api/conversion/convert:
 *   post:
 *     summary: 转换表格文件
 *     description: 将表格文件从一种格式转换为另一种格式
 *     tags: [Conversion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary, required: true }
 *               fromFormat: { type: string, required: true }
 *               toFormat: { type: string, required: true }
 *               options: { type: object }
 *     responses:
 *       200: { description: 'File converted successfully' }
 *       400: { description: 'Invalid request parameters' }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Conversion failed' }
 */
router.post(
  '/convert',
  authMiddleware,
  fileUploadMiddleware({ 
    allowedTypes: ['xlsx', 'xls', 'csv', 'tsv', 'json', 'xml'],
    maxSize: 20 * 1024 * 1024 // 20MB limit
  }),
  validationMiddleware(conversionSchema.convert),
  conversionController.convertFile
)

/**
 * @swagger
 * /api/conversion/validate:
 *   post:
 *     summary: 验证表格文件
 *     description: 验证表格文件的格式和内容是否有效
 *     tags: [Conversion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary, required: true }
 *               format: { type: string, required: true }
 *     responses:
 *       200: { description: 'File validated successfully' }
 *       400: { description: 'Invalid file format or content' }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Validation failed' }
 */
router.post(
  '/validate',
  authMiddleware,
  fileUploadMiddleware({ 
    allowedTypes: ['xlsx', 'xls', 'csv', 'tsv', 'json', 'xml'],
    maxSize: 20 * 1024 * 1024
  }),
  validationMiddleware(conversionSchema.validate),
  conversionController.validateFile
)

/**
 * @swagger
 * /api/conversion/supported-formats:
 *   get:
 *     summary: 获取支持的格式列表
 *     description: 获取系统支持的所有输入和输出格式
 *     tags: [Conversion]
 *     responses:
 *       200: { description: 'Supported formats retrieved successfully' }
 *       500: { description: 'Failed to retrieve formats' }
 */
router.get('/supported-formats', conversionController.getSupportedFormats)

/**
 * @swagger
 * /api/conversion/batch-convert:
 *   post:
 *     summary: 批量转换文件
 *     description: 批量将多个表格文件从一种格式转换为另一种格式
 *     tags: [Conversion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files: { type: array, items: { type: string, format: binary }, required: true }
 *               fromFormat: { type: string, required: true }
 *               toFormat: { type: string, required: true }
 *               batchOptions: { type: object }
 *     responses:
 *       200: { description: 'Batch conversion completed successfully' }
 *       400: { description: 'Invalid request parameters' }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Batch conversion failed' }
 */
router.post(
  '/batch-convert',
  authMiddleware,
  fileUploadMiddleware({ 
    allowedTypes: ['xlsx', 'xls', 'csv', 'tsv', 'json', 'xml'],
    maxSize: 50 * 1024 * 1024, // 50MB total for batch conversion
    multiple: true
  }),
  validationMiddleware(conversionSchema.batchConvert),
  conversionController.batchConvertFiles
)

/**
 * @swagger
 * /api/conversion/template:
 *   get:
 *     summary: 获取转换模板
 *     description: 获取指定格式的转换模板文件
 *     tags: [Conversion]
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema: { type: string }
 *         description: 模板格式 (xlsx, csv, json等)
 *     responses:
 *       200: { description: 'Template file downloaded successfully' }
 *       400: { description: 'Unsupported template format' }
 *       500: { description: 'Failed to generate template' }
 */
router.get('/template', validationMiddleware(conversionSchema.getTemplate), conversionController.getTemplate)

/**
 * @swagger
 * /api/conversion/history:
 *   get:
 *     summary: 获取转换历史
 *     description: 获取用户的转换历史记录
 *     tags: [Conversion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: number, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: number, default: 20 }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: 'Conversion history retrieved successfully' }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Failed to retrieve history' }
 */
router.get('/history', authMiddleware, conversionController.getConversionHistory)

/**
 * @swagger
 * /api/conversion/preview:
 *   post:
 *     summary: 预览文件内容
 *     description: 获取表格文件的预览内容（前N行）
 *     tags: [Conversion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary, required: true }
 *               format: { type: string, required: true }
 *               rows: { type: number, default: 10 }
 *     responses:
 *       200: { description: 'File preview retrieved successfully' }
 *       400: { description: 'Invalid file or format' }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Failed to generate preview' }
 */
router.post(
  '/preview',
  authMiddleware,
  fileUploadMiddleware({ 
    allowedTypes: ['xlsx', 'xls', 'csv', 'tsv', 'json', 'xml'],
    maxSize: 20 * 1024 * 1024
  }),
  validationMiddleware(conversionSchema.preview),
  conversionController.previewFile
)

/**
 * @swagger
 * /api/conversion/stats:
 *   get:
 *     summary: 获取转换统计
 *     description: 获取用户的转换统计信息
 *     tags: [Conversion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: ['today', 'week', 'month', 'year'] }
 *         description: 统计周期
 *     responses:
 *       200: { description: 'Conversion statistics retrieved successfully' }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Failed to retrieve statistics' }
 */
router.get('/stats', authMiddleware, conversionController.getConversionStats)

/**
 * @swagger
 * /api/conversion/optimize:
 *   post:
 *     summary: 优化表格文件
 *     description: 优化表格文件大小和性能
 *     tags: [Conversion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary, required: true }
 *               format: { type: string, required: true }
 *               optimizationLevel: { type: string, enum: ['basic', 'standard', 'aggressive'] }
 *     responses:
 *       200: { description: 'File optimized successfully' }
 *       400: { description: 'Invalid file or format' }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Failed to optimize file' }
 */
router.post(
  '/optimize',
  authMiddleware,
  fileUploadMiddleware({ 
    allowedTypes: ['xlsx', 'xls', 'csv'],
    maxSize: 20 * 1024 * 1024
  }),
  validationMiddleware(conversionSchema.optimize),
  conversionController.optimizeFile
)

// 错误处理中间件
router.use(errorHandlerMiddleware)

export default router