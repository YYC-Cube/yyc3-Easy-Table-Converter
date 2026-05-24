/**
 * @file 文件数据模型
 * @description 定义文件的数据结构和存储模型
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import mongoose, { Document, Schema } from 'mongoose';

// 定义文件接口
export interface FileDocument extends Document {
  id: string;
  name: string;
  originalName: string;
  format: string;
  mimeType: string;
  path: string;
  size: number;
  userId?: string;
  metadata: Record<string, any>;
  storageType: 'local' | 's3' | 'gcs';
  isPublic: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  accessedAt?: Date;
  accessCount: number;
}

// 创建文件Schema
const FileSchema = new Schema<FileDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  format: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  mimeType: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  userId: {
    type: String,
    trim: true,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  storageType: {
    type: String,
    required: true,
    enum: ['local', 's3', 'gcs'],
    default: 'local'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  accessedAt: {
    type: Date
  },
  accessCount: {
    type: Number,
    default: 0,
    min: 0
  }
});

// 更新updatedAt字段的中间件
FileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 静态方法：根据ID查找文件并更新访问信息
FileSchema.statics.findByIdAndUpdateAccess = async function(id: string) {
  return this.findByIdAndUpdate(id, {
    $set: { accessedAt: new Date() },
    $inc: { accessCount: 1 }
  }, { new: true });
};

// 静态方法：查找过期文件
FileSchema.statics.findExpired = function() {
  return this.find({
    expiresAt: { $lte: new Date() }
  });
};

// 创建和导出模型
export const FileModel = mongoose.model<FileDocument>('File', FileSchema);