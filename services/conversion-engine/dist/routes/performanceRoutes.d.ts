/**
 * @file 性能监控路由
 * @description 提供服务性能指标的接口
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { Router } from 'express';
import { SystemMonitor } from '../utils/systemMonitor';
interface PerformanceRoutesOptions {
    systemMonitor: SystemMonitor;
}
/**
 * 创建性能监控路由
 * @param options 路由选项
 */
export declare const performanceRoutes: (options: PerformanceRoutesOptions) => Router;
export default performanceRoutes;
//# sourceMappingURL=performanceRoutes.d.ts.map