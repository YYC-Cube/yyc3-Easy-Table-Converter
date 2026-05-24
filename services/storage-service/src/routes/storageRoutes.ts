import { Router } from 'express'
import { storageController } from '../controllers/storageController'
import { authMiddleware } from '../middleware/authMiddleware'
import { fileUploadMiddleware } from '../middleware/fileUploadMiddleware'
import { validationMiddleware } from '../middleware/validationMiddleware'
import { storageSchema } from '../schemas/storageSchema'
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware'
import { loggerMiddleware } from '../middleware/loggerMiddleware'
import { errorHandlerMiddleware } from '../middleware/errorHandlerMiddleware'
import { corsMiddleware } from '../middleware/corsMiddleware'
import { config } from '../config/config'

/**
 * @file 存储服务路由配置
 * @description 处理文件存储相关的API路由
 * @module routes/storageRoutes
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
 * /api/storage/upload:
 *   post:
 *     summary: 上传文件
 *     description: 上传文件到存储服务
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               metadata: { type: object }
 *               folderId: { type: string }
 *     responses:
 *       200: { description: 'File uploaded successfully' }
 *       400: { description: 'Invalid request' }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Server error' }
 */
router.post(
  '/upload',
  authMiddleware,
  fileUploadMiddleware({ 
    maxSize: config.upload.maxSize, 
    allowedTypes: config.upload.allowedTypes 
  }),
  validationMiddleware(storageSchema.upload),
  storageController.uploadFile
)

/**
 * @swagger
 * /api/storage/files/{fileId}:
 *   get:
 *     summary: 获取文件详情
 *     description: 根据文件ID获取文件详细信息
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: 'File details retrieved successfully' }
 *       404: { description: 'File not found' }
 *       500: { description: 'Server error' }
 */
router.get('/files/:fileId', authMiddleware, storageController.getFileDetails)

/**
 * @swagger
 * /api/storage/files/{fileId}/download:
 *   get:
 *     summary: 下载文件
 *     description: 下载指定文件
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: 'File downloaded successfully' }
 *       404: { description: 'File not found' }
 *       500: { description: 'Server error' }
 */
router.get('/files/:fileId/download', authMiddleware, storageController.downloadFile)

/**
 * @swagger
 * /api/storage/files/{fileId}:
 *   delete:
 *     summary: 删除文件
 *     description: 删除指定文件
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: 'File deleted successfully' }
 *       404: { description: 'File not found' }
 *       500: { description: 'Server error' }
 */
router.delete('/files/:fileId', authMiddleware, storageController.deleteFile)

/**
 * @swagger
 * /api/storage/folders:
 *   post:
 *     summary: 创建文件夹
 *     description: 创建新的存储文件夹
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, required: true }
 *               parentId: { type: string }
 *               metadata: { type: object }
 *     responses:
 *       201: { description: 'Folder created successfully' }
 *       400: { description: 'Invalid request' }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Server error' }
 */
router.post(
  '/folders',
  authMiddleware,
  validationMiddleware(storageSchema.createFolder),
  storageController.createFolder
)

/**
 * @swagger
 * /api/storage/folders/{folderId}/files:
 *   get:
 *     summary: 获取文件夹内容
 *     description: 获取指定文件夹中的文件和子文件夹列表
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: number, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: number, default: 50 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: 'createdAt' }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, default: 'desc' }
 *     responses:
 *       200: { description: 'Folder content retrieved successfully' }
 *       404: { description: 'Folder not found' }
 *       500: { description: 'Server error' }
 */
router.get('/folders/:folderId/files', authMiddleware, storageController.getFolderContent)

/**
 * @swagger
 * /api/storage/search:
 *   get:
 *     summary: 搜索文件
 *     description: 根据关键词搜索用户的文件
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: ['file', 'folder', 'all'] }
 *       - in: query
 *         name: page
 *         schema: { type: number, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: number, default: 50 }
 *     responses:
 *       200: { description: 'Search results retrieved successfully' }
 *       400: { description: 'Invalid request' }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Server error' }
 */
router.get('/search', authMiddleware, validationMiddleware(storageSchema.search), storageController.searchFiles)

/**
 * @swagger
 * /api/storage/files/{fileId}/share:
 *   post:
 *     summary: 分享文件
 *     description: 创建文件分享链接
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiry: { type: string, format: date-time }
 *               password: { type: string }
 *               accessType: { type: string, enum: ['view', 'download'] }
 *     responses:
 *       200: { description: 'Share link created successfully' }
 *       404: { description: 'File not found' }
 *       500: { description: 'Server error' }
 */
router.post(
  '/files/:fileId/share',
  authMiddleware,
  validationMiddleware(storageSchema.shareFile),
  storageController.createShareLink
)

/**
 * @swagger
 * /api/storage/share/{shareId}:
 *   get:
 *     summary: 通过分享链接访问文件
 *     description: 使用分享链接ID和密码（如果需要）访问分享的文件
 *     tags: [Storage]
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: password
 *         schema: { type: string }
 *     responses:
 *       200: { description: 'File accessed successfully' }
 *       401: { description: 'Invalid password or expired link' }
 *       404: { description: 'Share link not found' }
 *       500: { description: 'Server error' }
 */
router.get('/share/:shareId', storageController.accessSharedFile)

/**
 * @swagger
 * /api/storage/stats:
 *   get:
 *     summary: 获取存储统计信息
 *     description: 获取用户存储空间使用情况统计
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'Storage stats retrieved successfully' }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Server error' }
 */
router.get('/stats', authMiddleware, storageController.getStorageStats)

// 错误处理中间件
router.use(errorHandlerMiddleware)

export default router