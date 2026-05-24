"use strict";
/**
 * @file 批量转换任务模型
 * @description 定义批量文件转换任务的数据结构
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
// 批量任务进度默认值
const DEFAULT_BATCH_PROGRESS = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    processingTasks: 0,
    percentComplete: 0,
    estimatedTimeRemaining: 0,
    lastUpdated: Date.now()
};
// 批量转换任务Schema
const BatchConversionTaskSchema = new mongoose_1.Schema({
    batchJobId: {
        type: String,
        unique: true,
        required: true,
        default: () => (0, uuid_1.v4)()
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'partial'],
        default: 'pending',
        required: true,
        index: true
    },
    subTasks: {
        type: [
            {
                subTaskId: {
                    type: String,
                    required: true,
                    default: () => (0, uuid_1.v4)()
                },
                inputFileId: {
                    type: String,
                    required: true
                },
                outputFormat: {
                    type: String,
                    required: true
                },
                status: {
                    type: String,
                    enum: ['pending', 'processing', 'completed', 'failed'],
                    default: 'pending'
                },
                resultFileId: String,
                errorMessage: String,
                startTime: Number,
                endTime: Number,
                processingTime: Number
            }
        ],
        required: true,
        validate: { validator: (arr) => arr.length > 0, message: '至少需要一个子任务' }
    },
    progress: {
        type: Object,
        default: DEFAULT_BATCH_PROGRESS,
        required: true
    },
    options: {
        type: Object,
        default: {}
    },
    errorMessage: { type: String },
    startTime: { type: Number },
    endTime: { type: Number },
    processingTime: { type: Number }
}, {
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
    toObject: { virtuals: true }
});
// 索引优化
BatchConversionTaskSchema.index({ userId: 1, status: 1 });
BatchConversionTaskSchema.index({ status: 1, createdAt: 1 });
// 虚拟属性 - 成功任务数量
BatchConversionTaskSchema.virtual('successfulTasks').get(function () {
    return this.subTasks.filter(task => task.status === 'completed').length;
});
// 虚拟属性 - 失败任务数量
BatchConversionTaskSchema.virtual('failedTasksCount').get(function () {
    return this.subTasks.filter(task => task.status === 'failed').length;
});
// 虚拟属性 - 总任务数量
BatchConversionTaskSchema.virtual('totalTasksCount').get(function () {
    return this.subTasks.length;
});
// 预保存中间件
BatchConversionTaskSchema.pre('save', function (next) {
    // 初始化进度中的总任务数
    if (!this.progress.totalTasks) {
        this.progress.totalTasks = this.subTasks.length;
    }
    // 更新进度信息
    this.updateProgressInfo();
    // 状态管理
    if (this.isModified('status')) {
        // 当状态变为processing时，记录开始时间
        if (this.status === 'processing' && !this.startTime) {
            this.startTime = Date.now();
        }
        // 当状态变为completed或failed时，记录结束时间和处理时长
        if ((['completed', 'failed', 'partial'].includes(this.status)) && !this.endTime) {
            this.endTime = Date.now();
            if (this.startTime) {
                this.processingTime = this.endTime - this.startTime;
            }
        }
    }
    next();
});
// 实例方法 - 更新进度信息
BatchConversionTaskSchema.methods.updateProgressInfo = function () {
    const totalTasks = this.subTasks.length;
    const completedTasks = this.subTasks.filter(task => task.status === 'completed').length;
    const failedTasks = this.subTasks.filter(task => task.status === 'failed').length;
    const processingTasks = this.subTasks.filter(task => task.status === 'processing').length;
    this.progress = {
        totalTasks,
        completedTasks,
        failedTasks,
        processingTasks,
        percentComplete: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        estimatedTimeRemaining: this.calculateEstimatedTime(),
        lastUpdated: Date.now()
    };
    // 自动更新整体状态
    if (this.status !== 'cancelled') {
        if (completedTasks === totalTasks) {
            this.status = 'completed';
        }
        else if (completedTasks + failedTasks === totalTasks && failedTasks > 0) {
            this.status = 'partial';
        }
        else if (processingTasks > 0) {
            this.status = 'processing';
        }
    }
};
// 实例方法 - 计算估计剩余时间
BatchConversionTaskSchema.methods.calculateEstimatedTime = function () {
    // 基于已完成任务和平均处理时间估算
    const completedTasks = this.subTasks.filter(task => task.status === 'completed' && task.processingTime);
    if (completedTasks.length === 0)
        return 0;
    // 计算平均处理时间
    const avgProcessingTime = completedTasks.reduce((sum, task) => sum + (task.processingTime || 0), 0) / completedTasks.length;
    // 计算剩余任务数
    const remainingTasks = this.subTasks.filter(task => ['pending', 'processing'].includes(task.status)).length;
    return Math.round((avgProcessingTime * remainingTasks) / 1000); // 转换为秒
};
// 静态方法
BatchConversionTaskSchema.statics.findByBatchJobId = async function (batchJobId) {
    return this.findOne({ batchJobId }).exec();
};
BatchConversionTaskSchema.statics.findPendingBatchJobs = async function (limit = 5) {
    return this.find({ status: 'pending' })
        .sort({ createdAt: 1 })
        .limit(limit)
        .exec();
};
BatchConversionTaskSchema.statics.updateBatchJobStatus = async function (batchJobId, status) {
    const updateData = { status };
    // 当状态变为processing时，记录开始时间
    if (status === 'processing') {
        updateData.startTime = Date.now();
        updateData.$set = {
            'subTasks.$[elem].status': 'processing',
            'subTasks.$[elem].startTime': Date.now()
        };
        updateData.arrayFilters = [{ 'elem.status': 'pending' }];
    }
    // 当状态变为completed、failed或partial时，记录结束时间和处理时长
    if (['completed', 'failed', 'partial'].includes(status)) {
        updateData.endTime = Date.now();
        updateData.$expr = {
            $set: { processingTime: { $subtract: [updateData.endTime, '$startTime'] } }
        };
    }
    const task = await this.findOneAndUpdate({ batchJobId }, updateData, { new: true }).exec();
    // 如果任务存在，更新进度信息
    if (task) {
        task.updateProgressInfo();
        await task.save();
    }
    return task;
};
BatchConversionTaskSchema.statics.updateSubTaskStatus = async function (batchJobId, subTaskId, status, resultFileId, errorMessage) {
    const updateData = {
        'subTasks.$[elem].status': status
    };
    // 设置开始时间
    if (status === 'processing') {
        updateData['subTasks.$[elem].startTime'] = Date.now();
    }
    // 设置结束时间和处理时长
    if (status === 'completed' || status === 'failed') {
        updateData['subTasks.$[elem].endTime'] = Date.now();
        updateData['subTasks.$[elem].processingTime'] = {
            $subtract: [Date.now(), '$subTasks.$[elem].startTime']
        };
        if (resultFileId)
            updateData['subTasks.$[elem].resultFileId'] = resultFileId;
        if (errorMessage)
            updateData['subTasks.$[elem].errorMessage'] = errorMessage;
    }
    const task = await this.findOneAndUpdate({ batchJobId }, updateData, {
        new: true,
        arrayFilters: [{ 'elem.subTaskId': subTaskId }]
    }).exec();
    // 如果任务存在，更新进度信息
    if (task) {
        task.updateProgressInfo();
        await task.save();
    }
    return task;
};
BatchConversionTaskSchema.statics.updateBatchJobProgress = async function (batchJobId) {
    const task = await this.findOne({ batchJobId }).exec();
    if (task) {
        task.updateProgressInfo();
        await task.save();
        return task;
    }
    return null;
};
// 创建并导出模型
const BatchConversionTask = (0, mongoose_1.model)('BatchConversionTask', BatchConversionTaskSchema);
exports.default = BatchConversionTask;
//# sourceMappingURL=BatchConversionTask.js.map