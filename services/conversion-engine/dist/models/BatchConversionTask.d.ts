/**
 * @file 批量转换任务模型
 * @description 定义批量文件转换任务的数据结构
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { Document } from 'mongoose';
export type BatchJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'partial';
export type SubTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export interface SubTask {
    subTaskId: string;
    inputFileId: string;
    outputFormat: string;
    status: SubTaskStatus;
    resultFileId?: string;
    errorMessage?: string;
    startTime?: number;
    endTime?: number;
    processingTime?: number;
}
export interface BatchJobProgress {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    processingTasks: number;
    percentComplete: number;
    estimatedTimeRemaining: number;
    lastUpdated: number;
}
export interface BatchConversionTaskDocument extends Document {
    batchJobId: string;
    userId: string;
    status: BatchJobStatus;
    subTasks: SubTask[];
    progress: BatchJobProgress;
    options?: Record<string, any>;
    errorMessage?: string;
    startTime?: number;
    endTime?: number;
    processingTime?: number;
    createdAt: Date;
    updatedAt: Date;
    findByBatchJobId(batchJobId: string): Promise<BatchConversionTaskDocument | null>;
    findPendingBatchJobs(limit?: number): Promise<BatchConversionTaskDocument[]>;
    updateBatchJobStatus(batchJobId: string, status: BatchJobStatus): Promise<BatchConversionTaskDocument | null>;
    updateSubTaskStatus(batchJobId: string, subTaskId: string, status: SubTaskStatus): Promise<BatchConversionTaskDocument | null>;
    updateBatchJobProgress(batchJobId: string): Promise<BatchConversionTaskDocument | null>;
}
declare const BatchConversionTask: any;
export default BatchConversionTask;
//# sourceMappingURL=BatchConversionTask.d.ts.map