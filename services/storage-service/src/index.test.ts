/**
 * @file 存储服务主模块测试
 * @description 测试存储服务的API端点和核心功能
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import request from 'supertest';
import { app } from './index';
import { StorageAdapterFactory } from './services/adapters/StorageAdapterFactory';
import { StorageType } from './types';

// Mock StorageAdapterFactory
jest.mock('./services/adapters/StorageAdapterFactory', () => ({
  StorageAdapterFactory: {
    createAdapter: jest.fn(),
    validateConfig: jest.fn(),
    getDefaultConfig: jest.fn(),
    buildConfigFromEnv: jest.fn(),
  },
}));

// Mock适配器
const mockAdapter = {
  upload: jest.fn().mockResolvedValue({ url: 'http://example.com/file.txt', id: '123' }),
  download: jest.fn().mockResolvedValue(Buffer.from('test content')),
  delete: jest.fn().mockResolvedValue({ success: true }),
  listFiles: jest.fn().mockResolvedValue([{ id: '123', name: 'file.txt', size: 1024 }]),
  getFileMetadata: jest.fn().mockResolvedValue({ id: '123', name: 'file.txt', size: 1024 }),
};

(StorageAdapterFactory.createAdapter as jest.Mock).mockReturnValue(mockAdapter);
(StorageAdapterFactory.buildConfigFromEnv as jest.Mock).mockReturnValue({
  local: { path: './uploads' },
  s3: { enabled: false },
  gcs: { enabled: false },
  defaultType: 'local',
  maxFileSize: 100 * 1024 * 1024,
  fileExpiryDays: 30,
});

describe('存储服务 API 测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('健康检查端点', () => {
    it('应该返回健康状态和可用的存储类型', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('availableStorageTypes');
      expect(response.body.availableStorageTypes).toContain('local');
    });
  });

  describe('配置信息端点', () => {
    it('应该返回存储配置信息', async () => {
      const response = await request(app).get('/config');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('storage');
      expect(response.body.storage).toHaveProperty('defaultType');
      expect(response.body.storage).toHaveProperty('maxFileSize');
      expect(response.body.storage).toHaveProperty('fileExpiryDays');
    });
  });

  describe('文件上传端点', () => {
    it('应该成功上传文件', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('file', Buffer.from('test content'), { filename: 'test.txt' })
        .field('storageType', 'local');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('fileId');
      expect(response.body).toHaveProperty('fileUrl');
      expect(mockAdapter.upload).toHaveBeenCalledTimes(1);
    });

    it('应该在没有文件时返回错误', async () => {
      const response = await request(app)
        .post('/upload')
        .field('storageType', 'local');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('文件下载端点', () => {
    it('应该成功下载文件', async () => {
      const response = await request(app).get('/download/123');
      
      expect(response.status).toBe(200);
      expect(mockAdapter.download).toHaveBeenCalledWith('123');
    });

    it('应该在文件不存在时返回错误', async () => {
      mockAdapter.download.mockRejectedValueOnce(new Error('File not found'));
      
      const response = await request(app).get('/download/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('文件删除端点', () => {
    it('应该成功删除文件', async () => {
      const response = await request(app).delete('/delete/123');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(mockAdapter.delete).toHaveBeenCalledWith('123');
    });
  });

  describe('文件列表端点', () => {
    it('应该返回文件列表', async () => {
      const response = await request(app).get('/files');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files');
      expect(Array.isArray(response.body.files)).toBe(true);
      expect(mockAdapter.listFiles).toHaveBeenCalledTimes(1);
    });

    it('应该支持按存储类型过滤', async () => {
      const response = await request(app).get('/files?s3');
      
      expect(response.status).toBe(200);
      expect(mockAdapter.listFiles).toHaveBeenCalledTimes(1);
    });
  });

  describe('文件元数据端点', () => {
    it('应该返回文件元数据', async () => {
      const response = await request(app).get('/file/123');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '123');
      expect(response.body).toHaveProperty('name', 'file.txt');
      expect(mockAdapter.getFileMetadata).toHaveBeenCalledWith('123');
    });
  });

  describe('存储配置验证', () => {
    it('应该验证存储配置', async () => {
      const config = {
        type: 's3' as StorageType,
        config: {
          bucketName: 'test-bucket',
          region: 'us-east-1',
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      };

      (StorageAdapterFactory.validateConfig as jest.Mock).mockReturnValue(true);
      
      const response = await request(app)
        .post('/validate-config')
        .send(config);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', true);
    });

    it('应该拒绝无效的存储配置', async () => {
      const config = {
        type: 's3' as StorageType,
        config: {
          bucketName: '', // 空存储桶名称
          region: 'us-east-1',
        },
      };

      (StorageAdapterFactory.validateConfig as jest.Mock).mockReturnValue(false);
      
      const response = await request(app)
        .post('/validate-config')
        .send(config);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('valid', false);
      expect(response.body).toHaveProperty('errors');
    });
  });
});
