/**
 * @file 存储适配器工厂测试
 * @description 测试存储适配器工厂类的功能和行为
 * @module storage/adapters/tests
 * @author YYC
 * @version 2.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { StorageAdapterFactory, StorageAdapterConfig } from './StorageAdapterFactory';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { S3StorageAdapter } from './S3StorageAdapter';
import { GCSStorageAdapter } from './GCSStorageAdapter';

// 模拟环境变量
const originalEnv = process.env;

describe('StorageAdapterFactory', () => {
  beforeEach(() => {
    // 清除环境变量
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // 恢复原始环境变量
    process.env = originalEnv;
  });

  describe('createAdapter', () => {
    it('应该创建LocalStorageAdapter实例', () => {
      const config: StorageAdapterConfig = {
        type: 'local',
        options: {
          localPath: './uploads',
          maxFileSize: 50 * 1024 * 1024,
          fileExpiryDays: 7
        }
      };

      const adapter = StorageAdapterFactory.createAdapter(config);
      expect(adapter).toBeInstanceOf(LocalStorageAdapter);
    });

    it('应该创建S3StorageAdapter实例', () => {
      const config: StorageAdapterConfig = {
        type: 's3',
        options: {
          bucketName: 'test-bucket',
          region: 'us-east-1',
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
          maxFileSize: 50 * 1024 * 1024,
          fileExpiryDays: 7
        }
      };

      const adapter = StorageAdapterFactory.createAdapter(config);
      expect(adapter).toBeInstanceOf(S3StorageAdapter);
    });

    it('应该创建GCSStorageAdapter实例', () => {
      const config: StorageAdapterConfig = {
        type: 'gcs',
        options: {
          bucketName: 'test-bucket',
          projectId: 'test-project',
          maxFileSize: 50 * 1024 * 1024,
          fileExpiryDays: 7
        }
      };

      const adapter = StorageAdapterFactory.createAdapter(config);
      expect(adapter).toBeInstanceOf(GCSStorageAdapter);
    });

    it('应该在类型不支持时抛出错误', () => {
      const config = {
        type: 'invalid-type',
        options: {}
      } as any;

      expect(() => StorageAdapterFactory.createAdapter(config)).toThrow('不支持的存储类型');
    });
  });

  describe('validateConfig', () => {
    it('应该验证有效的local配置', () => {
      const config: StorageAdapterConfig = {
        type: 'local',
        options: {
          localPath: './uploads'
        }
      };

      const isValid = StorageAdapterFactory.validateConfig(config);
      expect(isValid).toBe(true);
    });

    it('应该验证有效的s3配置', () => {
      const config: StorageAdapterConfig = {
        type: 's3',
        options: {
          bucketName: 'test-bucket',
          region: 'us-east-1',
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret'
        }
      };

      const isValid = StorageAdapterFactory.validateConfig(config);
      expect(isValid).toBe(true);
    });

    it('应该验证有效的gcs配置', () => {
      const config: StorageAdapterConfig = {
        type: 'gcs',
        options: {
          bucketName: 'test-bucket',
          projectId: 'test-project'
        }
      };

      const isValid = StorageAdapterFactory.validateConfig(config);
      expect(isValid).toBe(true);
    });

    it('应该验证无效的配置', () => {
      // 缺少必要字段的local配置
      const invalidLocalConfig: StorageAdapterConfig = {
        type: 'local',
        options: {}
      };
      expect(StorageAdapterFactory.validateConfig(invalidLocalConfig)).toBe(false);

      // 缺少必要字段的s3配置
      const invalidS3Config: StorageAdapterConfig = {
        type: 's3',
        options: {
          bucketName: 'test-bucket'
          // 缺少region, accessKeyId, secretAccessKey
        }
      };
      expect(StorageAdapterFactory.validateConfig(invalidS3Config)).toBe(false);

      // 无效的存储类型
      const invalidTypeConfig = {
        type: 'invalid-type',
        options: {}
      } as any;
      expect(StorageAdapterFactory.validateConfig(invalidTypeConfig)).toBe(false);
    });
  });

  describe('getDefaultConfig', () => {
    it('应该返回默认配置', () => {
      const defaultConfig = StorageAdapterFactory.getDefaultConfig();
      
      expect(defaultConfig.type).toBe('local');
      expect(defaultConfig.options.localPath).toBe('./uploads');
      expect(defaultConfig.options.maxFileSize).toBe(50 * 1024 * 1024);
      expect(defaultConfig.options.fileExpiryDays).toBe(7);
    });
  });

  describe('buildConfigFromEnv', () => {
    it('应该从环境变量构建默认配置', () => {
      // 清除相关环境变量
      delete process.env.STORAGE_TYPE;
      delete process.env.MAX_FILE_SIZE;
      delete process.env.FILE_EXPIRY_DAYS;
      delete process.env.LOCAL_STORAGE_PATH;
      
      const config = StorageAdapterFactory.buildConfigFromEnv();
      
      expect(config.type).toBe('local');
      expect(config.options.localPath).toBe('./uploads');
      expect(config.options.maxFileSize).toBe(52428800); // 50MB
      expect(config.options.fileExpiryDays).toBe(7);
    });

    it('应该从环境变量构建S3配置', () => {
      process.env.STORAGE_TYPE = 's3';
      process.env.S3_BUCKET_NAME = 'env-bucket';
      process.env.S3_REGION = 'us-west-2';
      process.env.S3_ACCESS_KEY_ID = 'env-key';
      process.env.S3_SECRET_ACCESS_KEY = 'env-secret';
      process.env.S3_ENDPOINT = 'https://custom-endpoint';
      process.env.S3_FORCE_PATH_STYLE = 'true';
      
      const config = StorageAdapterFactory.buildConfigFromEnv();
      
      expect(config.type).toBe('s3');
      expect(config.options.bucketName).toBe('env-bucket');
      expect(config.options.region).toBe('us-west-2');
      expect(config.options.accessKeyId).toBe('env-key');
      expect(config.options.secretAccessKey).toBe('env-secret');
      expect(config.options.endpoint).toBe('https://custom-endpoint');
      expect(config.options.forcePathStyle).toBe(true);
    });

    it('应该从环境变量构建GCS配置', () => {
      process.env.STORAGE_TYPE = 'gcs';
      process.env.GCS_BUCKET_NAME = 'env-gcs-bucket';
      process.env.GCS_PROJECT_ID = 'env-project';
      process.env.GCS_KEY_FILENAME = '/path/to/key.json';
      
      const config = StorageAdapterFactory.buildConfigFromEnv();
      
      expect(config.type).toBe('gcs');
      expect(config.options.bucketName).toBe('env-gcs-bucket');
      expect(config.options.projectId).toBe('env-project');
      expect(config.options.keyFilename).toBe('/path/to/key.json');
    });
  });
});