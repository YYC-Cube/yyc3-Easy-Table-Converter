"use strict";
/**
 * @file 批量转换API路由
 * @description 提供批量文件转换任务的RESTful API接口
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBatchConversionRoutes = initBatchConversionRoutes;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const errorHandler_1 = require("../utils/errorHandler");
const inputValidator_1 = require("../utils/inputValidator");
// 批量转换路由配置
const router = express_1.default.Router();
// 服务实例（将通过依赖注入或工厂函数提供）
let batchConversionService = null;
/**
 * 初始化批量转换路由
 * @param services - 所需服务实例
 */
function initBatchConversionRoutes(services) {
    batchConversionService = services.batchConversionService;
    return router;
}
/**
 * 确保批量转换服务已初始化的中间件
 */
function ensureServiceInitialized(req, res, next) {
    if (!batchConversionService) {
        return next(new errorHandler_1.ApiError('服务未初始化', 503));
    }
    next();
}
// ====== API 路由 ======
/**
 * @swagger
 * /api/batch/convert: POST
 *   summary: 提交批量转换任务
 *   description: 提交多个文件进行批量转换
 *   tags: [Batch Conversion]
 *   security:
 *     - bearerAuth: []
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             tasks:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   inputFileId:
 *                     type: string
 *                   outputFormat:
 *                     type: string
 *               minItems: 1
 *               maxItems: 100
 *             options:
 *               type: object
 *   responses:
 *     200: 成功创建批量任务
 *     400: 请求参数错误
 *     401: 未授权
 *     500: 服务器错误
 */
router.post('/convert', [
    authMiddleware_1.authMiddleware,
    ensureServiceInitialized,
    (0, inputValidator_1.validateInput)([
        (0, express_validator_1.body)('tasks').isArray().withMessage('tasks必须是数组'),
        (0, express_validator_1.body)('tasks').custom(tasks => tasks.length > 0 && tasks.length <= 100).withMessage('批量任务数量必须在1-100之间'),
        (0, express_validator_1.body)('tasks.*.inputFileId').isString().trim().notEmpty().withMessage('inputFileId必须是非空字符串'),
        (0, express_validator_1.body)('tasks.*.outputFormat').isString().trim().notEmpty().withMessage('outputFormat必须是非空字符串')
    ])
], async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { tasks, options = {} } = req.body;
        // 提交批量转换任务
        const batchTask = await batchConversionService.submitBatchTask(userId, tasks, options);
        res.status(200).json({
            success: true,
            message: '批量转换任务已成功提交',
            data: {
                batchJobId: batchTask.batchJobId,
                status: batchTask.status,
                totalTasks: batchTask.subTasks.length,
                createdAt: batchTask.createdAt,
                estimatedTime: '处理时间将根据文件大小和复杂度而定'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/batch/tasks/{batchJobId}: GET
 *   summary: 获取批量任务状态
 *   description: 根据批量任务ID获取任务详情和状态
 *   tags: [Batch Conversion]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: path
 *       name: batchJobId
 *       required: true
 *       schema:
 *         type: string
 *   responses:
 *     200: 返回任务状态
 *     401: 未授权
 *     404: 任务不存在或无权访问
 */
router.get('/tasks/:batchJobId', [
    authMiddleware_1.authMiddleware,
    ensureServiceInitialized,
    (0, inputValidator_1.validateInput)([
        (0, express_validator_1.param)('batchJobId').isString().trim().notEmpty().withMessage('batchJobId必须是非空字符串')
    ])
], async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { batchJobId } = req.params;
        // 获取批量任务状态
        const task = await batchConversionService.getBatchTaskStatus(batchJobId, userId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: '任务不存在或无权访问'
            });
        }
        // 构建响应数据
        const responseData = {
            batchJobId: task.batchJobId,
            status: task.status,
            progress: task.progress,
            subTasks: task.subTasks.map(subTask => ({
                subTaskId: subTask.subTaskId,
                inputFileId: subTask.inputFileId,
                outputFormat: subTask.outputFormat,
                status: subTask.status,
                resultFileId: subTask.resultFileId,
                errorMessage: subTask.errorMessage,
                processingTime: subTask.processingTime
            })),
            createdAt: task.createdAt,
            startTime: task.startTime,
            endTime: task.endTime,
            processingTime: task.processingTime,
            errorMessage: task.errorMessage
        };
        res.status(200).json({
            success: true,
            data: responseData
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/batch/tasks/{batchJobId}/cancel: POST
 *   summary: 取消批量任务
 *   description: 取消正在进行或待处理的批量转换任务
 *   tags: [Batch Conversion]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: path
 *       name: batchJobId
 *       required: true
 *       schema:
 *         type: string
 *   responses:
 *     200: 任务已取消
 *     401: 未授权
 *     404: 任务不存在或无权访问
 */
router.post('/tasks/:batchJobId/cancel', [
    authMiddleware_1.authMiddleware,
    ensureServiceInitialized,
    (0, inputValidator_1.validateInput)([
        (0, express_validator_1.param)('batchJobId').isString().trim().notEmpty().withMessage('batchJobId必须是非空字符串')
    ])
], async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { batchJobId } = req.params;
        // 取消批量任务
        const task = await batchConversionService.cancelBatchTask(batchJobId, userId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: '任务不存在或无权访问'
            });
        }
        if (task.status !== 'cancelled') {
            return res.status(400).json({
                success: false,
                message: '只有进行中或待处理的任务可以取消'
            });
        }
        res.status(200).json({
            success: true,
            message: '批量转换任务已成功取消',
            data: {
                batchJobId: task.batchJobId,
                status: task.status
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/batch/tasks: GET
 *   summary: 获取用户的批量任务列表
 *   description: 获取当前用户的所有批量转换任务
 *   tags: [Batch Conversion]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: query
 *       name: page
 *       schema:
 *         type: integer
 *         default: 1
 *     - in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         default: 10
 *     - in: query
 *       name: status
 *       schema:
 *         type: string
 *   responses:
 *     200: 返回任务列表
 *     401: 未授权
 */
router.get('/tasks', [
    authMiddleware_1.authMiddleware,
    ensureServiceInitialized,
    (0, inputValidator_1.validateInput)([
        (0, express_validator_1.query)('page').isInt({ min: 1 }).optional().toInt(),
        (0, express_validator_1.query)('limit').isInt({ min: 1, max: 100 }).optional().toInt(),
        (0, express_validator_1.query)('status').isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'partial']).optional()
    ])
], async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        // 获取用户的批量任务列表
        const result = await batchConversionService.getUserBatchTasks(userId, page, limit);
        // 过滤状态（如果提供）
        let tasks = result.tasks;
        if (status) {
            tasks = tasks.filter(task => task.status === status);
        }
        // 构建响应数据
        const responseData = {
            tasks: tasks.map(task => ({
                batchJobId: task.batchJobId,
                status: task.status,
                totalTasks: task.subTasks.length,
                completedTasks: task.progress.completedTasks,
                percentComplete: task.progress.percentComplete,
                createdAt: task.createdAt,
                processingTime: task.processingTime
            })),
            pagination: {
                page,
                limit,
                total: status ? tasks.length : result.total,
                totalPages: Math.ceil((status ? tasks.length : result.total) / limit)
            }
        };
        res.status(200).json({
            success: true,
            data: responseData
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/batch/statistics: GET
 *   summary: 获取批量转换服务统计信息
 *   description: 获取批量转换服务的运行统计信息
 *   tags: [Batch Conversion]
 *   security:
 *     - bearerAuth: []
 *   responses:
 *     200: 返回统计信息
 *     401: 未授权
 *     403: 权限不足
 */
router.get('/statistics', [
    authMiddleware_1.authMiddleware,
    ensureServiceInitialized
], async (req, res, next) => {
    try {
        // 检查是否为管理员（示例逻辑，实际应根据系统权限设计调整）
        const isAdmin = req.user?.role === 'admin';
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足，需要管理员权限'
            });
        }
        // 获取统计信息
        const stats = batchConversionService.getStatistics();
        res.status(200).json({
            success: true,
            data: {
                activeTasks: stats.activeTasks,
                runningSubTasks: stats.runningSubTasks,
                memoryUsage: {
                    heapUsed: Math.round(stats.memoryUsage.heapUsed / 1024 / 1024), // MB
                    heapTotal: Math.round(stats.memoryUsage.heapTotal / 1024 / 1024),
                    external: Math.round(stats.memoryUsage.external / 1024 / 1024)
                },
                config: {
                    maxConcurrentTasks: stats.config.maxConcurrentTasks,
                    maxRetries: stats.config.maxRetries,
                    batchSizeLimit: stats.config.batchSizeLimit
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/batch/formats: GET
 *   summary: 获取支持的批量转换格式
 *   description: 获取系统支持的批量文件转换格式列表
 *   tags: [Batch Conversion]
 *   security:
 *     - bearerAuth: []
 *   responses:
 *     200: 返回支持的格式列表
 */
router.get('/formats', async (req, res, next) => {
    try {
        // 返回支持的批量转换格式
        // 注意：这里应该从转换服务获取实际支持的格式列表
        // 此处为示例实现
        const supportedFormats = [
            { input: 'csv', output: ['json', 'xlsx', 'xml', 'parquet'] },
            { input: 'json', output: ['csv', 'xlsx', 'xml', 'yaml'] },
            { input: 'xlsx', output: ['csv', 'json', 'xml', 'parquet'] },
            { input: 'xls', output: ['csv', 'json', 'xml', 'parquet'] },
            { input: 'xml', output: ['csv', 'json', 'xlsx'] },
            { input: 'yaml', output: ['json', 'xml'] },
            { input: 'tsv', output: ['csv', 'json', 'xlsx'] },
            { input: 'parquet', output: ['csv', 'json', 'xlsx'] }
        ];
        res.status(200).json({
            success: true,
            data: {
                supportedFormats,
                note: '批量转换支持与单个文件转换相同的格式'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 全局错误处理中间件
router.use(errorHandler_1.errorHandler);
exports.default = router;
//# sourceMappingURL=batchConversionRoutes.js.map