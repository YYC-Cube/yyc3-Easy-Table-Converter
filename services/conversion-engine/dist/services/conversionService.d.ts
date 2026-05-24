/**
 * @file 转换服务核心实现
 * @description 提供各种数据格式之间的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { QueueManager } from '../utils/queueManager';
interface ConversionOptions {
    delimiter?: string;
    header?: boolean;
    encoding?: string;
    indent?: number;
    [key: string]: any;
}
interface FileInfo {
    id: string;
    name: string;
    format: string;
    path: string;
    size: number;
    uploadedAt: Date;
}
interface ConversionResult {
    outputFile: FileInfo;
    status: 'success' | 'failed';
    message?: string;
    metadata?: Record<string, any>;
}
export type SupportedFormat = 'csv' | 'json' | 'xml' | 'yaml' | 'toml' | 'html' | 'markdown' | 'xlsx' | 'xls' | 'parquet';
/**
 * 转换服务类
 */
interface ConversionTask {
    _id: string;
    inputFile: FileInfo;
    outputFormat: string;
    options: ConversionOptions;
    userId?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    outputFile?: FileInfo;
    error?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
/**
 * 转换服务类
 */
export declare class ConversionService {
    private storagePath;
    private maxFileSize;
    private supportedFormats;
    private queueManager;
    private tasks;
    constructor(storageService: any, queueManager: QueueManager);
    /**
     * 初始化转换队列
     */
    private initializeQueues;
    /**
     * 处理转换任务
     * @param job 任务对象
     */
    private processConversionTask;
    /**
     * 执行数据转换
     * @param inputFile 输入文件信息
     * @param outputFormat 输出格式
     * @param options 转换选项
     * @returns Promise<ConversionResult> 转换结果
     */
    convertData(inputFile: FileInfo, outputFormat: string, options?: ConversionOptions): Promise<ConversionResult>;
    /**
     * 获取转换策略
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @returns 转换函数
     */
    private getConversionStrategy;
    /**
     * 转换为JSON格式
     * @param content 输入内容
     * @param inputFormat 输入格式
     * @param options 转换选项
     */
    private convertToJSON;
    /**
     * 转换为CSV格式
     * @param content 输入内容
     * @param inputFormat 输入格式
     * @param options 转换选项
     */
    private convertToCSV;
    /**
     * 转换为XML格式
     * @param content 输入内容
     * @param inputFormat 输入格式
     * @param options 转换选项
     */
    private convertToXML;
    /**
     * 转换为YAML格式
     * @param content 输入内容
     * @param inputFormat 输入格式
     * @param options 转换选项
     */
    private convertToYAML;
    /**
     * 转换为TOML格式
     * @param content 输入内容
     * @param inputFormat 输入格式
     * @param options 转换选项
     */
    private convertToTOML;
    /**
     * 转换为HTML格式
     * @param content 输入内容
     * @param inputFormat 输入格式
     * @param options 转换选项
     */
    private convertToHTML;
    /**
     * 转换为Markdown格式
     * @param content 输入内容
     * @param inputFormat 输入格式
     * @param options 转换选项
     */
    private convertToMarkdown;
    /**
     * 计算记录数量
     * @param data 转换后的数据
     * @param format 输出格式
     */
    private countRecords;
    /**
     * 创建转换任务
     * @param inputFile 输入文件信息
     * @param outputFormat 输出格式
     * @param options 转换选项
     * @param userId 用户ID
     * @returns Promise<string> 任务ID
     */
    createConversionTask(inputFile: FileInfo, outputFormat: string, options?: ConversionOptions, userId?: string): Promise<string>;
    /**
     * 获取转换任务状态
     * @param taskId 任务ID
     */
    getConversionTask(taskId: string): Promise<ConversionTask | null>;
    /**
     * 更新转换任务状态
     * @param taskId 任务ID
     * @param updates 更新内容
     */
    updateConversionTask(taskId: string, updates: Partial<any>): Promise<{
        updatedAt: Date;
        _id: string;
        inputFile: FileInfo;
        outputFormat: string;
        options: ConversionOptions;
        userId?: string;
        status: "pending" | "processing" | "completed" | "failed";
        outputFile?: FileInfo;
        error?: string;
        metadata?: Record<string, any>;
        createdAt: Date;
        completedAt?: Date;
    } | null>;
    /**
     * 获取支持的转换格式
     */
    getSupportedFormats(): SupportedFormat[];
    /**
     * 取消转换任务
     * @param taskId 任务ID
     */
    cancelConversionTask(taskId: string): Promise<boolean>;
    /**
     * 批量创建转换任务
     * @param tasks 任务列表
     * @param userId 用户ID
     */
    batchCreateConversionTasks(tasks: Array<{
        inputFile: FileInfo;
        outputFormat: string;
        options?: ConversionOptions;
    }>, userId?: string): Promise<string[]>;
}
/**
 * 导出服务实例创建函数
 */
export declare function createConversionService(storageService: any, queueManager: QueueManager): ConversionService;
export {};
//# sourceMappingURL=conversionService.d.ts.map