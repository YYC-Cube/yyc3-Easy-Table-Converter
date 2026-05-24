/**
 * @file 转换服务路由配置
 * @description 定义转换服务的API端点和请求处理逻辑
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import express from 'express';
import { ConversionService } from '../services/conversionService';
interface ConversionRoutesOptions {
    conversionService: ConversionService;
}
/**
 * 创建转换路由
 * @param options 路由选项
 */
export declare const conversionRoutes: (options: ConversionRoutesOptions) => express.Router;
export default conversionRoutes;
//# sourceMappingURL=conversionRoutes.d.ts.map