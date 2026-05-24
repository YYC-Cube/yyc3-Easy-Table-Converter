/**
 * @file 转换服务
 * @description 提供数据格式转换的核心服务
 * @module services/ConversionService
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 * @updated 2024-01-16
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  IConversionService, 
  ConversionRequest, 
  ConversionResponse, 
  DataFormat, 
  BatchConversionTask,
  ConversionStatus 
} from '../types';

/**
 * 转换格式对类型
 */
interface ConversionFormat {
  from: DataFormat;
  to: DataFormat;
}
import { ConverterFactory } from '../converters/ConverterFactory';
import { logger } from '../utils/logger';

/**
 * 转换服务实现类
 */
export class ConversionService implements IConversionService {
  private batchTasks: Map<string, BatchConversionTask> = new Map();
  
  /**
   * 获取支持的转换格式对
   * @returns 支持的转换格式对列表
   */
  public async getSupportedConversions(): Promise<ConversionFormat[]> {
    // 调用工厂方法获取支持的转换格式
    return ConverterFactory.getSupportedConversions();
  }
  
  /**
   * 检查是否支持指定的格式转换
   * @param sourceFormat 源数据格式
   * @param targetFormat 目标数据格式
   * @returns 是否支持转换
   */
  public async isConversionSupported(sourceFormat: DataFormat, targetFormat: DataFormat): Promise<boolean> {
    // 直接使用工厂的方法检查转换支持
    return ConverterFactory.isConversionSupported(sourceFormat, targetFormat);
  }
  
  /**
   * 执行转换
   * @param request 转换请求
   * @returns 转换响应
   */
  public async convert(request: ConversionRequest): Promise<ConversionResponse> {
    const startTime = Date.now();
    
    try {
      // 验证请求参数
      if (!request.sourceData) {
        throw new Error('源数据不能为空');
      }
      
      // 使用工厂获取合适的转换器
      const converter = await ConverterFactory.getConverterByFormats(
        request.sourceFormat,
        request.targetFormat
      );
      
      // 执行转换
      logger.info(`开始转换: ${request.sourceFormat} -> ${request.targetFormat}`);
      const result = await converter.convert(
        request.sourceData,
        { ...request.options, sourceFormat: request.sourceFormat, targetFormat: request.targetFormat }
      );
      
      // 计算处理时间
      const processingTime = Date.now() - startTime;
      logger.info(`转换完成: ${request.sourceFormat} -> ${request.targetFormat}, 耗时: ${processingTime}ms`);
      
      // 构建响应
      return {
        data: result,
        format: request.targetFormat,
        success: true,
        stats: {
          rowCount: 0, // 这里可能需要从转换结果中获取，暂时设为默认值
          columnCount: 0,
          processingTime
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error(`转换失败: ${errorMessage}`);
      return {
        data: '',
        format: request.targetFormat,
        stats: {
          rowCount: 0,
          columnCount: 0,
          processingTime: Date.now() - startTime
        },
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * 批量转换
   * @param requests 转换请求数组
   * @returns 批量转换任务ID
   */
  public async batchConvert(requests: ConversionRequest[]): Promise<string> {
    const taskId = uuidv4();
    const task: BatchConversionTask = {
      id: taskId,
      requests,
      responses: [],
      status: ConversionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.batchTasks.set(taskId, task);
    logger.info(`创建批量转换任务: ${taskId}, 请求数: ${requests.length}`);
    
    // 异步执行批量转换
    this.executeBatchTask(taskId).catch(error => {
      logger.error(`批量转换任务执行失败: ${taskId}, 错误: ${error}`);
    });
    
    return taskId;
  }
  
  /**
   * 执行批量转换任务
   * @param taskId 任务ID
   */
  private async executeBatchTask(taskId: string): Promise<void> {
    const task = this.batchTasks.get(taskId);
    if (!task) {
      logger.error(`找不到批量转换任务: ${taskId}`);
      return;
    }
    
    // 更新任务状态为处理中
    task.status = ConversionStatus.PROCESSING;
    task.updatedAt = new Date();
    
    try {
      // 逐个执行转换请求
      const responses = await Promise.all(
        task.requests.map(request => this.convert(request))
      );
      
      // 更新任务结果
      task.responses = responses;
      task.status = ConversionStatus.COMPLETED;
      task.completedAt = new Date();
      task.updatedAt = new Date();
      
      logger.info(`批量转换任务完成: ${taskId}, 成功: ${responses.filter(r => r.success).length}, 失败: ${responses.filter(r => !r.success).length}`);
    } catch (error) {
      task.status = ConversionStatus.FAILED;
      task.updatedAt = new Date();
      logger.error(`批量转换任务执行异常: ${taskId}, 错误: ${error}`);
    }
    
    // 保存任务结果
    this.batchTasks.set(taskId, task);
    
    // 设置任务过期（24小时后自动清理）
    setTimeout(() => {
      this.batchTasks.delete(taskId);
      logger.info(`批量转换任务已过期并清理: ${taskId}`);
    }, 24 * 60 * 60 * 1000);
  }
  
  /**
   * 获取批量转换任务状态
   * @param taskId 任务ID
   * @returns 任务信息或null
   */
  public getBatchTaskStatus(taskId: string): BatchConversionTask | null {
    return this.batchTasks.get(taskId) || null;
  }
  
  /**
   * 获取当前活跃的批量转换任务数量
   * @returns 活跃任务数量
   */
  public getActiveBatchTaskCount(): number {
    return Array.from(this.batchTasks.values()).filter(
      task => task.status === ConversionStatus.PENDING || 
              task.status === ConversionStatus.PROCESSING
    ).length;
  }
  

}

/**
 * 转换服务单例实例
 */
export const conversionService = new ConversionService();
