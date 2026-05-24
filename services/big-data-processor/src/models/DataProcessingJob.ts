/**
 * @file 数据处理任务模型
 * @description 定义用于大数据处理的任务数据结构
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import { Schema, Document, model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// 任务状态类型
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// 任务优先级
export type JobPriority = 'low' | 'medium' | 'high' | 'critical';

// 任务进度接口
export interface JobProgress {
  processedRows: number;
  totalRows: number;
  percentComplete: number;
  estimatedTimeRemaining: number; // 估计剩余时间（秒）
  lastUpdated: number; // 最后更新时间戳
}

// 数据处理任务文档接口
export interface DataProcessingJobDocument extends Document {
  jobId: string;
  userId: string;
  inputFileId: string;
  outputFormat: string;
  status: JobStatus;
  priority: JobPriority;
  progress: JobProgress;
  options?: Record<string, any>;
  errorMessage?: string;
  resultFileId?: string;
  startTime?: number;
  endTime?: number;
  processingTime?: number; // 处理耗时（毫秒）
  createdAt: Date;
  updatedAt: Date;
  
  // 静态方法
  findByJobId(jobId: string): Promise<DataProcessingJobDocument | null>;
  findPendingJobs(limit?: number): Promise<DataProcessingJobDocument[]>;
  updateJobStatus(jobId: string, status: JobStatus): Promise<DataProcessingJobDocument | null>;
  updateJobProgress(jobId: string, progress: Partial<JobProgress>): Promise<DataProcessingJobDocument | null>;
}

// 任务进度默认值
const DEFAULT_PROGRESS: JobProgress = {
  processedRows: 0,
  totalRows: 0,
  percentComplete: 0,
  estimatedTimeRemaining: 0,
  lastUpdated: Date.now()
};

// 数据处理任务Schema
const DataProcessingJobSchema = new Schema<DataProcessingJobDocument>(
  {
    jobId: {
      type: String,
      unique: true,
      required: true,
      default: () => uuidv4()
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    inputFileId: {
      type: String,
      required: true,
      index: true
    },
    outputFormat: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      required: true,
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      required: true,
      index: true
    },
    progress: {
      type: Object,
      default: DEFAULT_PROGRESS,
      required: true,
      validate: {
        validator: (progress: any) => {
          return (
            typeof progress.processedRows === 'number' &&
            typeof progress.totalRows === 'number' &&
            typeof progress.percentComplete === 'number' &&
            typeof progress.estimatedTimeRemaining === 'number' &&
            typeof progress.lastUpdated === 'number'
          );
        },
        message: '进度信息格式不正确'
      }
    },
    options: {
      type: Object,
      default: {}
    },
    errorMessage: {
      type: String
    },
    resultFileId: {
      type: String,
      index: true
    },
    startTime: {
      type: Number
    },
    endTime: {
      type: Number
    },
    processingTime: {
      type: Number
    }
  },
  {
    timestamps: true,
    versionKey: '__v',
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// 索引优化
DataProcessingJobSchema.index({ userId: 1, status: 1 });
DataProcessingJobSchema.index({ status: 1, priority: -1, createdAt: 1 });

// 预保存中间件
DataProcessingJobSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    // 当状态变为processing时，记录开始时间
    if (this.status === 'processing' && !this.startTime) {
      this.startTime = Date.now();
    }
    
    // 当状态变为completed或failed时，记录结束时间和处理时长
    if ((this.status === 'completed' || this.status === 'failed') && !this.endTime) {
      this.endTime = Date.now();
      if (this.startTime) {
        this.processingTime = this.endTime - this.startTime;
      }
    }
  }
  
  // 更新进度的最后更新时间
  if (this.isModified('progress')) {
    this.progress.lastUpdated = Date.now();
  }
  
  next();
});

// 静态方法
DataProcessingJobSchema.statics.findByJobId = async function(jobId: string): Promise<DataProcessingJobDocument | null> {
  return this.findOne({ jobId }).exec();
};

DataProcessingJobSchema.statics.findPendingJobs = async function(limit: number = 10): Promise<DataProcessingJobDocument[]> {
  return this.find({ status: 'pending' })
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit)
    .exec();
};

DataProcessingJobSchema.statics.updateJobStatus = async function(
  jobId: string,
  status: JobStatus
): Promise<DataProcessingJobDocument | null> {
  const updateData: any = { status };
  
  // 当状态变为processing时，记录开始时间
  if (status === 'processing') {
    updateData.startTime = Date.now();
  }
  
  // 当状态变为completed或failed时，记录结束时间和处理时长
  if ((status === 'completed' || status === 'failed')) {
    updateData.endTime = Date.now();
    updateData.$expr = {
      $set: { processingTime: { $subtract: [updateData.endTime, '$startTime'] } }
    };
  }
  
  return this.findOneAndUpdate({ jobId }, updateData, { new: true }).exec();
};

DataProcessingJobSchema.statics.updateJobProgress = async function(
  jobId: string,
  progress: Partial<JobProgress>
): Promise<DataProcessingJobDocument | null> {
  const updateData = {
    ...progress,
    lastUpdated: Date.now()
  };
  
  return this.findOneAndUpdate(
    { jobId },
    { $set: { 'progress': { $mergeObjects: ['$progress', updateData] } } },
    { new: true }
  ).exec();
};

// 创建并导出模型
const DataProcessingJob = model<DataProcessingJobDocument>('DataProcessingJob', DataProcessingJobSchema);

export default DataProcessingJob;