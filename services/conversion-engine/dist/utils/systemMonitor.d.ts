/**
 * @file 系统监控工具
 * @description 监控服务的性能和资源使用情况
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
export interface SystemMonitorConfig {
    checkInterval?: number;
    memoryThreshold?: number;
    cpuThreshold?: number;
    diskThreshold?: number;
}
export interface SystemStatus {
    timestamp: number;
    uptime: number;
    memory: {
        total: number;
        free: number;
        used: number;
        usagePercent: number;
    };
    cpu: {
        usagePercent: number;
        cores: number;
        model: string;
    };
    disk: {
        total: number;
        free: number;
        used: number;
        usagePercent: number;
    };
    network: {
        interfaces: string[];
    };
    loadAverage: number[];
}
/**
 * 系统监控类
 */
export declare class SystemMonitor {
    private config;
    private isMonitoring;
    private checkInterval;
    private previousCPUUsage;
    constructor(config?: SystemMonitorConfig);
    /**
     * 开始监控
     */
    startMonitoring(): void;
    /**
     * 停止监控
     */
    stopMonitoring(): void;
    /**
     * 检查系统状态
     */
    private checkSystemStatus;
    /**
     * 获取系统状态
     */
    getSystemStatus(): SystemStatus;
    /**
     * 获取内存状态
     */
    private getMemoryStatus;
    /**
     * 获取CPU状态
     */
    private getCPUStatus;
    /**
     * 获取磁盘状态
     */
    private getDiskStatus;
    /**
     * 记录系统状态
     * @param status 系统状态
     */
    private logSystemStatus;
    /**
     * 检查阈值并发出警报
     * @param status 系统状态
     */
    private checkThresholds;
    /**
     * 获取当前系统状态
     */
    getCurrentStatus(): SystemStatus;
}
//# sourceMappingURL=systemMonitor.d.ts.map