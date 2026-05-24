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
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/big-data-processor';
  const MONGODB_OPTIONS = {
    maxPoolSize: 10,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    useNewUrlParser: true,
    useUnifiedTopology: true
  };
  
  try {
    await mongoose.connect(MONGO_URI, MONGODB_OPTIONS);
    console.log('✅ MongoDB数据库连接成功');
    
    // 配置连接事件
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB连接错误:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB连接断开，尝试重新连接...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB重新连接成功');
    });
    
  } catch (error) {
    console.error('❌ MongoDB数据库连接失败:', error);
    // 指数退避重试
    setTimeout(async () => {
      console.log('🔄 重试MongoDB连接...');
      try {
        await mongoose.connect(MONGO_URI, MONGODB_OPTIONS);
        console.log('✅ MongoDB数据库重连成功');
      } catch (retryError) {
        console.error('❌ MongoDB数据库重连失败:', retryError);
        throw retryError;
      }
    }, 2000);
    throw error;
  }
}

export default connectMongoDB;