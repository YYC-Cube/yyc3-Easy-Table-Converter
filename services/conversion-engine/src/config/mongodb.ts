/**
 * @file MongoDB配置文件
 * @description 负责与MongoDB数据库的连接和配置
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import mongoose from 'mongoose';

/**
 * 连接MongoDB数据库
 * @returns {Promise<void>}
 */
async function connectMongoDB(): Promise<void> {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/conversion-engine';
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB数据库连接成功');
  } catch (error) {
    console.error('❌ MongoDB数据库连接失败:', error);
    throw error;
  }
}

export default connectMongoDB;