/**
 * @file 转换任务数据模型
 * @description 定义转换任务的数据结构和存储模型
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import mongoose, { Document, Schema } from 'mongoose';

// 定义文件信息接口
interface FileInfo {
  id: string;
  name: string;
  format: string;
  path: string;
  size: number;
  uploadedAt: Date;
}

// 定义转换任务接口
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

// 创建转换任务Schema
const ConversionTaskSchema = new Schema<ConversionTask>({
  inputFile: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    format: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, required: true }
  },
  outputFormat: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: Schema.Types.Mixed,
    default: {}
  },
  userId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  outputFile: {
    id: { type: String },
    name: { type: String },
    format: { type: String },
    path: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date }
  },
  errorMessage: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// 更新updatedAt字段的中间件
ConversionTaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 创建和导出模型
export const ConversionTaskModel = mongoose.model<ConversionTask>('ConversionTask', ConversionTaskSchema);