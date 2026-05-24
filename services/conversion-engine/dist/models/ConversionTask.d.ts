/**
 * @file 转换任务数据模型
 * @description 定义转换任务的数据结构和存储模型
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import mongoose, { Document } from 'mongoose';
interface FileInfo {
    id: string;
    name: string;
    format: string;
    path: string;
    size: number;
    uploadedAt: Date;
}
export interface ConversionTask extends Document {
    inputFile: FileInfo;
    outputFormat: string;
    options: Record<string, any>;
    userId?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    outputFile?: FileInfo;
    errorMessage?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export declare const ConversionTaskModel: mongoose.Model<ConversionTask, {}, {}, {}, mongoose.Document<unknown, {}, ConversionTask> & ConversionTask & {
    _id: mongoose.Types.ObjectId;
}, any>;
export {};
//# sourceMappingURL=ConversionTask.d.ts.map