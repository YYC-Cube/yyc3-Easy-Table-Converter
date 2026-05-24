"use strict";
/**
 * @file MongoDB配置文件
 * @description 负责与MongoDB数据库的连接和配置
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * 连接MongoDB数据库
 * @returns {Promise<void>}
 */
async function connectMongoDB() {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/conversion-engine';
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log('✅ MongoDB数据库连接成功');
    }
    catch (error) {
        console.error('❌ MongoDB数据库连接失败:', error);
        throw error;
    }
}
exports.default = connectMongoDB;
//# sourceMappingURL=mongodb.js.map