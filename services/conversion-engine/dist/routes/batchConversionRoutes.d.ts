/**
 * @file 批量转换API路由
 * @description 提供批量文件转换任务的RESTful API接口
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { Router } from 'express';
import { BatchConversionService } from '../services/batchConversionService';
declare const router: Router;
/**
 * 初始化批量转换路由
 * @param services - 所需服务实例
 */
export declare function initBatchConversionRoutes(services: {
    batchConversionService: BatchConversionService;
}): Router;
export default router;
//# sourceMappingURL=batchConversionRoutes.d.ts.map