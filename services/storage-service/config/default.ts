/**
 * @file 默认配置
 * @description 存储服务默认配置
 * @module config
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 * @updated 2024-11-23
 */

import { StorageType } from '../src/services/adapters/types';

export interface DefaultConfig {
  port: number;
  nodeEnv: string;
  storage: {
    type: StorageType;
    maxFileSize: number;
    fileExpiryDays: number;
    local?: {
      path: string;
    };
    s3?: {
      bucketName: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      endpoint?: string;
      forcePathStyle?: boolean;
    };
    gcs?: {
      bucketName: string;
      projectId?: string;
      keyFilename?: string;
    };
  };
  mongodb: {
    uri: string;
  };
  cors: {
    origin: string[];
    methods: string[];
    allowedHeaders: string[];
  };
  logging: {
    level: string;
    format: string;
  };
}

/**
 * 默认配置
 * @description 所有配置项的默认值
 */
export const defaultConfig: DefaultConfig = {
  port: 3100,
  nodeEnv: 'development',
  storage: {
    type: 'local' as StorageType,
    maxFileSize: 52428800, // 50MB
    fileExpiryDays: 7,
    local: {
      path: './storage'
    },
    s3: {
      bucketName: '',
      region: 'us-east-1',
      accessKeyId: '',
      secretAccessKey: '',
      endpoint: '',
      forcePathStyle: false
    },
    gcs: {
      bucketName: '',
      projectId: '',
      keyFilename: ''
    }
  },
  mongodb: {
    uri: 'mongodb://localhost:27017/storage-service'
  },
  cors: {
    origin: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  logging: {
    level: 'info',
    format: 'json'
  }
};

/**
 * 配置验证规则
 * @description 用于验证配置的有效性
 */
export const configValidation = {
  storageType: (type: string): boolean => {
    return ['local', 's3', 'gcs'].includes(type);
  },
  maxFileSize: (size: number): boolean => {
    return size > 0 && size <= 5368709120; // 最大 5GB
  },
  fileExpiryDays: (days: number): boolean => {
    return days >= 1 && days <= 365; // 1天到1年
  },
  bucketName: (name: string): boolean => {
    return name && name.length >= 3 && name.length <= 63;
  },
  region: (region: string): boolean => {
    return region && region.match(/^[a-z0-9-]+$/);
  }
};

/**
 * 获取环境变量
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 环境变量值或默认值
 */
export const getEnv = <T>(key: string, defaultValue: T): T => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  
  // 根据默认值类型进行转换
  if (typeof defaultValue === 'number') {
    return Number(value) as unknown as T;
  }
  if (typeof defaultValue === 'boolean') {
    return (value.toLowerCase() === 'true' || value === '1') as unknown as T;
  }
  if (Array.isArray(defaultValue)) {
    return value.split(',').map(v => v.trim()) as unknown as T;
  }
  
  return value as unknown as T;
};

/**
 * 构建配置
 * @description 从环境变量构建配置对象
 * @returns 完整配置对象
 */
export const buildConfig = (): DefaultConfig => {
  const storageType = getEnv('STORAGE_TYPE', defaultConfig.storage.type);
  
  return {
    port: getEnv('PORT', defaultConfig.port),
    nodeEnv: getEnv('NODE_ENV', defaultConfig.nodeEnv),
    storage: {
      type: storageType,
      maxFileSize: getEnv('MAX_FILE_SIZE', defaultConfig.storage.maxFileSize),
      fileExpiryDays: getEnv('FILE_EXPIRY_DAYS', defaultConfig.storage.fileExpiryDays),
      local: {
        path: getEnv('LOCAL_STORAGE_PATH', defaultConfig.storage.local?.path || './storage')
      },
      s3: {
        bucketName: getEnv('S3_BUCKET_NAME', defaultConfig.storage.s3?.bucketName || ''),
        region: getEnv('S3_REGION', defaultConfig.storage.s3?.region || 'us-east-1'),
        accessKeyId: getEnv('S3_ACCESS_KEY_ID', defaultConfig.storage.s3?.accessKeyId || ''),
        secretAccessKey: getEnv('S3_SECRET_ACCESS_KEY', defaultConfig.storage.s3?.secretAccessKey || ''),
        endpoint: getEnv('S3_ENDPOINT', defaultConfig.storage.s3?.endpoint || ''),
        forcePathStyle: getEnv('S3_FORCE_PATH_STYLE', defaultConfig.storage.s3?.forcePathStyle || false)
      },
      gcs: {
        bucketName: getEnv('GCS_BUCKET_NAME', defaultConfig.storage.gcs?.bucketName || ''),
        projectId: getEnv('GCS_PROJECT_ID', defaultConfig.storage.gcs?.projectId || ''),
        keyFilename: getEnv('GCS_KEY_FILENAME', defaultConfig.storage.gcs?.keyFilename || '')
      }
    },
    mongodb: {
      uri: getEnv('MONGODB_URI', defaultConfig.mongodb.uri)
    },
    cors: {
      origin: getEnv<string[]>('CORS_ORIGIN', defaultConfig.cors.origin),
      methods: getEnv<string[]>('CORS_METHODS', defaultConfig.cors.methods),
      allowedHeaders: getEnv<string[]>('CORS_ALLOWED_HEADERS', defaultConfig.cors.allowedHeaders)
    },
    logging: {
      level: getEnv('LOG_LEVEL', defaultConfig.logging.level),
      format: getEnv('LOG_FORMAT', defaultConfig.logging.format)
    }
  };
};

/**
 * 验证配置
 * @param config 配置对象
 * @returns 是否有效
 */
export const validateConfig = (config: DefaultConfig): boolean => {
  try {
    // 验证存储类型
    if (!configValidation.storageType(config.storage.type)) {
      throw new Error(`无效的存储类型: ${config.storage.type}`);
    }
    
    // 验证文件大小限制
    if (!configValidation.maxFileSize(config.storage.maxFileSize)) {
      throw new Error(`无效的文件大小限制: ${config.storage.maxFileSize}`);
    }
    
    // 验证文件过期天数
    if (!configValidation.fileExpiryDays(config.storage.fileExpiryDays)) {
      throw new Error(`无效的文件过期天数: ${config.storage.fileExpiryDays}`);
    }
    
    // 验证特定存储类型的配置
    if (config.storage.type === 's3') {
      if (!configValidation.bucketName(config.storage.s3?.bucketName || '')) {
        throw new Error('S3 存储桶名称无效');
      }
      if (!configValidation.region(config.storage.s3?.region || '')) {
        throw new Error('S3 区域无效');
      }
      if (!config.storage.s3?.accessKeyId || !config.storage.s3?.secretAccessKey) {
        throw new Error('S3 访问密钥缺失');
      }
    } else if (config.storage.type === 'gcs') {
      if (!configValidation.bucketName(config.storage.gcs?.bucketName || '')) {
        throw new Error('GCS 存储桶名称无效');
      }
    }
    
    return true;
  } catch (error) {
    console.error('配置验证失败:', error);
    return false;
  }
};