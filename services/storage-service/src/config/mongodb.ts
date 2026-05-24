/**
 * @file MongoDB连接配置
 * @description 管理MongoDB数据库连接
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-20
 * @updated 2024-11-23
 */

import mongoose from 'mongoose';

/**
 * MongoDB连接选项接口
 */
interface MongoDBConfig {
  uri?: string;
  options?: mongoose.ConnectOptions;
}

/**
 * 连接MongoDB数据库
 * @param config - MongoDB连接配置
 * @returns Promise<void>
 */
const connectMongoDB = async (config?: MongoDBConfig): Promise<void> => {
  try {
    const uri = config?.uri || process.env.MONGO_URI || 'mongodb://localhost:27017/storage-service';
    const options: mongoose.ConnectOptions = {
      ...config?.options,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    await mongoose.connect(uri, options);
    console.log('✅ MongoDB连接成功');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    throw new Error('数据库连接失败');
  }
};

/**
 * 断开MongoDB连接
 * @returns Promise<void>
 */
const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB连接已断开');
  } catch (error) {
    console.error('❌ 断开MongoDB连接失败:', error);
  }
};

/**
 * 检查MongoDB连接状态
 * @returns boolean - 是否已连接
 */
const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export { connectMongoDB, disconnectMongoDB, isConnected };
export default connectMongoDB;