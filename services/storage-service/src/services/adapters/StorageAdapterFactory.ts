/**
 * @file 存储适配器工厂类
 * @description 根据配置动态创建不同类型的存储适配器实例
 * @module storage/adapters
 * @author YYC
 * @version 2.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { IStorageAdapter, StorageOptions } from './IStorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { S3StorageAdapter } from './S3StorageAdapter';
import { GCSStorageAdapter } from './GCSStorageAdapter';

/**
 * 存储适配器类型
 */
export type StorageType = 'local' | 's3' | 'gcs';

/**
 * 存储适配器配置
 */
export interface StorageAdapterConfig {
  type: StorageType;
  options: StorageOptions;
}

/**
 * 存储适配器工厂类
 * 负责创建不同类型的存储适配器实例
 */
export class StorageAdapterFactory {
  /**
   * 根据配置创建存储适配器实例
   * @param config 存储适配器配置
   * @returns 存储适配器实例
   * @throws {Error} 当配置的存储类型不支持时抛出错误
   */
  static createAdapter(config: StorageAdapterConfig): IStorageAdapter {
    const { type, options } = config;
    
    switch (type) {
      case 'local':
        return new LocalStorageAdapter(options);
      
      case 's3':
        return new S3StorageAdapter(options);
      
      case 'gcs':
        return new GCSStorageAdapter(options);
      
      default:
        throw new Error(`不支持的存储类型: ${type}`);
    }
  }

  /**
   * 验证存储适配器配置
   * @param config 存储适配器配置
   * @returns 是否有效
   */
  static validateConfig(config: StorageAdapterConfig): boolean {
    if (!config || !config.type) {
      return false;
    }

    const { type, options } = config;
    
    // 基础验证
    if (!['local', 's3', 'gcs'].includes(type)) {
      return false;
    }

    // 根据不同类型进行特定验证
    switch (type) {
      case 'local':
        return !!options.localPath;
      
      case 's3':
        return !!options.bucketName && 
               !!options.region && 
               !!options.accessKeyId && 
               !!options.secretAccessKey;
      
      case 'gcs':
        return !!options.bucketName && 
               (!!options.keyFilename || !!options.projectId);
      
      default:
        return false;
    }
  }

  /**
   * 获取默认存储适配器配置
   * @returns 默认存储适配器配置
   */
  static getDefaultConfig(): StorageAdapterConfig {
    return {
      type: 'local',
      options: {
        localPath: './uploads',
        maxFileSize: 50 * 1024 * 1024, // 50MB
        fileExpiryDays: 7
      }
    };
  }

  /**
   * 从环境变量构建存储适配器配置
   * @returns 存储适配器配置
   */
  static buildConfigFromEnv(): StorageAdapterConfig {
    const type = (process.env.STORAGE_TYPE || 'local') as StorageType;
    
    const config: StorageAdapterConfig = {
      type,
      options: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 默认50MB
        fileExpiryDays: parseInt(process.env.FILE_EXPIRY_DAYS || '7')
      }
    };

    // 根据不同类型添加特定配置
    switch (type) {
      case 'local':
        config.options.localPath = process.env.LOCAL_STORAGE_PATH || './uploads';
        break;
      
      case 's3':
        config.options.bucketName = process.env.S3_BUCKET_NAME;
        config.options.region = process.env.S3_REGION;
        config.options.accessKeyId = process.env.S3_ACCESS_KEY_ID;
        config.options.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
        config.options.endpoint = process.env.S3_ENDPOINT;
        config.options.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
        break;
      
      case 'gcs':
        config.options.bucketName = process.env.GCS_BUCKET_NAME;
        config.options.keyFilename = process.env.GCS_KEY_FILENAME;
        config.options.projectId = process.env.GCS_PROJECT_ID;
        break;
    }

    return config;
  }
}