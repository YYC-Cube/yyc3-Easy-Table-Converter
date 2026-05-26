/**
 * @file 数据处理核心服务
 * @description 处理大型表格数据的核心业务逻辑
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import csv from 'csv-parser';
import { createWriteStream, createReadStream } from 'fs';
import DataProcessingJob, { DataProcessingJobDocument, JobStatus } from '../models/DataProcessingJob';
import { getRedisClient } from '../config/redis';
import { v4 as uuidv4 } from 'uuid';

// 流式处理配置
const CHUNK_SIZE = 10000; // 每批处理的行数
const MEMORY_THRESHOLD = 70; // 内存使用阈值百分比
const MAX_CONCURRENT_JOBS = 5; // 最大并发任务数

// 导出格式支持
const SUPPORTED_FORMATS = ['csv', 'json', 'xlsx', 'parquet'];

// 处理队列名称
const PROCESSING_QUEUE = 'data:processing:queue';
const ACTIVE_JOBS_SET = 'data:processing:active';

// 流式管道Promise化
const pipelineAsync = promisify(pipeline);

/**
 * 检查系统内存是否充足
 * @returns {boolean} 是否有足够内存继续处理
 */
function isMemoryAvailable(): boolean {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const usagePercent = (memoryUsage.rss / totalMemory) * 100;
    return usagePercent < MEMORY_THRESHOLD;
  } catch (error) {
    console.error('❌ 内存检查失败:', error);
    return true; // 默认允许继续处理
  }
}

/**
 * 大数据处理服务类
 */
export class DataProcessorService {
  private tempDir: string;
  private static instance: DataProcessorService;

  private constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    // 确保临时目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DataProcessorService {
    if (!DataProcessorService.instance) {
      DataProcessorService.instance = new DataProcessorService();
    }
    return DataProcessorService.instance;
  }

  /**
   * 提交处理任务
   * @param userId - 用户ID
   * @param inputFileId - 输入文件ID
   * @param outputFormat - 输出格式
   * @param options - 处理选项
   */
  async submitJob(
    userId: string,
    inputFileId: string,
    outputFormat: string,
    options?: Record<string, any>
  ): Promise<DataProcessingJobDocument> {
    try {
      // 验证输出格式
      if (!SUPPORTED_FORMATS.includes(outputFormat.toLowerCase())) {
        throw new Error(`不支持的输出格式: ${outputFormat}，支持的格式: ${SUPPORTED_FORMATS.join(', ')}`);
      }

      // 创建任务
      const job = await DataProcessingJob.create({
        userId,
        inputFileId,
        outputFormat: outputFormat.toLowerCase(),
        options: options || {},
        priority: options?.priority || 'medium'
      });

      // 将任务添加到队列
      const redisClient = getRedisClient();
      await redisClient.lPush(PROCESSING_QUEUE, job.jobId);
      console.log(`📋 任务已添加到队列: ${job.jobId}`);

      return job;
    } catch (error) {
      console.error('❌ 任务提交失败:', error);
      throw error;
    }
  }

  /**
   * 处理队列中的任务
   */
  async processQueue(): Promise<void> {
    const redisClient = getRedisClient();
    
    // 获取活跃任务数
    const activeJobsCount = await redisClient.sCard(ACTIVE_JOBS_SET);
    
    // 检查是否有空闲槽位
    if (activeJobsCount >= MAX_CONCURRENT_JOBS) {
      console.log(`⏳ 达到最大并发任务数 (${MAX_CONCURRENT_JOBS})，等待...`);
      return;
    }
    
    // 从队列中取出任务
    const jobId = await redisClient.rPop(PROCESSING_QUEUE);
    
    if (!jobId) {
      console.log('📭 队列为空，无任务可处理');
      return;
    }
    
    // 将任务标记为活跃
    await redisClient.sAdd(ACTIVE_JOBS_SET, jobId);
    
    // 异步处理任务，避免阻塞
    this.processJob(jobId)
      .catch(error => {
        console.error(`❌ 任务处理失败 ${jobId}:`, error);
      })
      .finally(async () => {
        // 处理完成后从活跃集合中移除
        await redisClient.sRem(ACTIVE_JOBS_SET, jobId);
        console.log(`✅ 任务已从活跃集合中移除: ${jobId}`);
      });
  }

  /**
   * 处理单个任务
   * @param jobId - 任务ID
   */
  private async processJob(jobId: string): Promise<void> {
    let job: DataProcessingJobDocument | null = null;
    
    try {
      console.log(`🚀 开始处理任务: ${jobId}`);
      
      // 获取任务信息
      job = await DataProcessingJob.findByJobId(jobId);
      if (!job) {
        throw new Error(`任务不存在: ${jobId}`);
      }
      
      // 更新任务状态为处理中
      await DataProcessingJob.updateJobStatus(jobId, 'processing');
      job.status = 'processing';
      
      // 模拟获取输入文件
      // 实际项目中，这里应该从存储服务获取文件
      const inputFilePath = await this.getInputFile(job.inputFileId);
      
      // 根据输出格式选择处理方法
      const outputFilePath = await this.processData(
        inputFilePath,
        job.outputFormat,
        job.options || {},
        (progress) => this.updateProgress(jobId, progress)
      );
      
      // 模拟上传结果文件
      // 实际项目中，这里应该上传到存储服务
      const resultFileId = await this.uploadResultFile(outputFilePath);
      
      // 更新任务状态为完成
      job = await DataProcessingJob.findOneAndUpdate(
        { jobId },
        { 
          status: 'completed' as JobStatus,
          resultFileId,
          endTime: Date.now(),
          processingTime: Date.now() - (job.startTime || Date.now())
        },
        { new: true }
      );
      
      console.log(`🎉 任务处理完成: ${jobId}, 结果文件: ${resultFileId}`);
      
      // 清理临时文件
      this.cleanupTempFiles(inputFilePath, outputFilePath);
    } catch (error) {
      console.error(`❌ 任务处理失败 ${jobId}:`, error);
      
      // 更新任务状态为失败
      await DataProcessingJob.findOneAndUpdate(
        { jobId },
        { 
          status: 'failed' as JobStatus,
          errorMessage: error instanceof Error ? error.message : String(error),
          endTime: Date.now(),
          processingTime: job && job.startTime ? Date.now() - job.startTime : undefined
        }
      );
      
      throw error;
    }
  }

  /**
   * 处理数据文件
   * @param inputFilePath - 输入文件路径
   * @param outputFormat - 输出格式
   * @param options - 处理选项
   * @param progressCallback - 进度回调
   */
  private async processData(
    inputFilePath: string,
    outputFormat: string,
    options: Record<string, any>,
    progressCallback: (progress: { processedRows: number; totalRows: number }) => void
  ): Promise<string> {
    // 生成输出文件路径
    const outputFilePath = path.join(
      this.tempDir,
      `${uuidv4()}.${outputFormat}`
    );
    
    try {
      // 统计总行数
      const totalRows = await this.countRows(inputFilePath);
      let processedRows = 0;
      
      // 根据输出格式选择相应的处理方法
      switch (outputFormat) {
        case 'json':
          await this.convertToJson(inputFilePath, outputFilePath, async (chunkCount) => {
            processedRows += chunkCount;
            progressCallback({ processedRows, totalRows });
            
            // 检查内存使用情况，如果过高则暂停处理
            if (!isMemoryAvailable()) {
              console.log('⏸️  内存使用率过高，暂停处理...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          });
          break;
          
        case 'csv':
        case 'xlsx':
        case 'parquet':
          // 模拟其他格式的转换
          await this.simulateConversion(inputFilePath, outputFilePath, totalRows, progressCallback);
          break;
          
        default:
          throw new Error(`不支持的输出格式: ${outputFormat}`);
      }
      
      return outputFilePath;
    } catch (error) {
      console.error('❌ 数据处理失败:', error);
      throw error;
    }
  }

  /**
   * 将CSV转换为JSON
   * @param inputPath - 输入文件路径
   * @param outputPath - 输出文件路径
   * @param chunkCallback - 每批处理完成回调
   */
  private async convertToJson(
    inputPath: string,
    outputPath: string,
    chunkCallback: (chunkCount: number) => Promise<void>
  ): Promise<void> {
    const results: any[] = [];
    const writeStream = createWriteStream(outputPath);
    
    // 写入JSON数组开始标记
    writeStream.write('[\n');
    
    let isFirst = true;
    let chunkCount = 0;
    
    // 使用流式处理
    await pipelineAsync(
      createReadStream(inputPath),
      csv(),
      async function* (source) {
        for await (const row of source) {
          // 添加逗号分隔符（如果不是第一个元素）
          if (!isFirst) {
            writeStream.write(',\n');
          } else {
            isFirst = false;
          }
          
          // 写入JSON对象
          writeStream.write(JSON.stringify(row));
          
          // 计数并检查是否达到批次大小
          chunkCount++;
          if (chunkCount >= CHUNK_SIZE) {
            await chunkCallback(chunkCount);
            chunkCount = 0;
          }
        }
        
        // 写入剩余的计数
        if (chunkCount > 0) {
          await chunkCallback(chunkCount);
        }
      }
    );
    
    // 写入JSON数组结束标记
    writeStream.write('\n]');
    writeStream.end();
    
    // 确保写入完成
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  /**
   * 模拟数据转换（用于演示）
   */
  private async simulateConversion(
    inputPath: string,
    outputPath: string,
    totalRows: number,
    progressCallback: (progress: { processedRows: number; totalRows: number }) => void
  ): Promise<void> {
    // 创建空文件作为输出
    fs.writeFileSync(outputPath, '', 'utf8');
    
    // 模拟进度更新
    let processedRows = 0;
    const step = Math.min(CHUNK_SIZE, totalRows / 10); // 分10步更新进度
    
    while (processedRows < totalRows) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟处理延迟
      processedRows += step;
      if (processedRows > totalRows) processedRows = totalRows;
      progressCallback({ processedRows, totalRows });
    }
  }

  /**
   * 统计CSV文件行数
   * @param filePath - 文件路径
   */
  private async countRows(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let count = 0;
      const readStream = createReadStream(filePath, 'utf8');
      
      readStream.on('data', (chunk) => {
        // 简单的行数统计（不考虑CSV中的换行符）
        count += (chunk as string).split('\n').length - 1;
      });
      
      readStream.on('end', () => {
        resolve(Math.max(0, count)); // 确保至少返回0
      });
      
      readStream.on('error', reject);
    });
  }

  /**
   * 更新任务进度
   * @param jobId - 任务ID
   * @param progress - 进度信息
   */
  private async updateProgress(jobId: string, progress: { processedRows: number; totalRows: number }): Promise<void> {
    const percentComplete = progress.totalRows > 0
      ? Math.min(100, Math.round((progress.processedRows / progress.totalRows) * 100))
      : 0;
    
    // 简单估算剩余时间（基于已处理行和时间）
    const estimatedTimeRemaining = this.calculateEstimatedTime(
      progress.processedRows,
      progress.totalRows
    );
    
    await DataProcessingJob.updateJobProgress(jobId, {
      processedRows: progress.processedRows,
      totalRows: progress.totalRows,
      percentComplete,
      estimatedTimeRemaining
    });
  }

  /**
   * 计算估计剩余时间
   */
  private calculateEstimatedTime(processedRows: number, totalRows: number): number {
    // 简单的线性估算
    if (processedRows === 0 || totalRows === 0) return 0;
    
    const startTime = Date.now() - 30000; // 假设30秒前开始（用于演示）
    const elapsedTime = Date.now() - startTime;
    const rowsPerSecond = processedRows / (elapsedTime / 1000);
    const remainingRows = totalRows - processedRows;
    
    return Math.round(remainingRows / rowsPerSecond);
  }

  /**
   * 获取输入文件（模拟）
   */
  private async getInputFile(fileId: string): Promise<string> {
    // 模拟从存储服务获取文件
    // 实际项目中，这里应该调用存储服务的API
    const tempFilePath = path.join(this.tempDir, `${fileId}.csv`);
    
    // 创建一个示例CSV文件
    fs.writeFileSync(tempFilePath, 'id,name,age,city\n1,John,30,New York\n2,Jane,25,Boston\n', 'utf8');
    
    return tempFilePath;
  }

  /**
   * 上传结果文件（模拟）
   */
  private async uploadResultFile(filePath: string): Promise<string> {
    // 模拟上传到存储服务
    // 实际项目中，这里应该调用存储服务的API
    return `result-${uuidv4()}`;
  }

  /**
   * 清理临时文件
   */
  private cleanupTempFiles(...filePaths: string[]): void {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  临时文件已删除: ${filePath}`);
        }
      } catch (error) {
        console.error(`❌ 清理临时文件失败 ${filePath}:`, error);
      }
    });
  }

  /**
   * 获取任务状态
   * @param jobId - 任务ID
   */
  async getJobStatus(jobId: string): Promise<DataProcessingJobDocument | null> {
    return DataProcessingJob.findByJobId(jobId);
  }

  /**
   * 取消任务
   * @param jobId - 任务ID
   */
  async cancelJob(jobId: string): Promise<DataProcessingJobDocument | null> {
    const job = await DataProcessingJob.findByJobId(jobId);
    
    if (!job) return null;
    
    // 只能取消等待中的任务
    if (job.status !== 'pending') {
      throw new Error(`无法取消任务: ${job.status}`);
    }
    
    // 从队列中移除
    const redisClient = getRedisClient();
    await redisClient.lRem(PROCESSING_QUEUE, 0, jobId);
    
    // 更新任务状态
    return DataProcessingJob.updateJobStatus(jobId, 'cancelled');
  }

  /**
   * 启动队列处理器
   * @param intervalMs - 检查间隔（毫秒）
   */
  startQueueProcessor(intervalMs: number = 1000): NodeJS.Timeout {
    console.log(`🔄 启动任务队列处理器，检查间隔: ${intervalMs}ms`);
    
    return setInterval(async () => {
      try {
        await this.processQueue();
      } catch (error) {
        console.error('❌ 队列处理器错误:', error);
      }
    }, intervalMs);
  }
}

// 导出服务实例
export default DataProcessorService.getInstance();