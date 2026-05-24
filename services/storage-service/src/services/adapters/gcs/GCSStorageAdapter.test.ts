/**
 * @file GCS存储适配器测试
 * @description 测试Google Cloud Storage适配器的核心功能
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { Storage } from '@google-cloud/storage';
import { GCSStorageAdapter } from './GCSStorageAdapter';
import { StorageConfig } from '../../../types';

// Mock Google Cloud Storage
jest.mock('@google-cloud/storage');

const mockStorage = Storage as jest.MockedClass<typeof Storage>;

// 模拟Storage实例方法
const mockBucket = {
  file: jest.fn()
};

const mockFile = {
  save: jest.fn(),
  download: jest.fn(),
  delete: jest.fn(),
  getMetadata: jest.fn(),
  getSignedUrl: jest.fn()
};

const mockGetFiles = jest.fn();

describe('GCSStorageAdapter', () => {
  let adapter: GCSStorageAdapter;
  const testConfig: StorageConfig['gcs'] = {
    enabled: true,
    bucketName: 'test-bucket',
    projectId: 'test-project',
    keyFilename: '/path/to/key.json',
    signedUrlExpiry: 3600,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 配置模拟
    mockStorage.mockImplementation(() => ({
      bucket: () => mockBucket
    } as any));
    
    mockBucket.file.mockReturnValue(mockFile);
    mockBucket.getFiles = mockGetFiles;
    
    adapter = new GCSStorageAdapter(testConfig);
  });

  describe('初始化测试', () => {
    it('应该成功初始化GCS客户端', async () => {
      await expect(adapter.init()).resolves.not.toThrow();
      expect(mockStorage).toHaveBeenCalledWith({
        projectId: testConfig.projectId,
        keyFilename: testConfig.keyFilename,
      });
      expect(mockStorage().bucket).toHaveBeenCalledWith(testConfig.bucketName);
    });

    it('应该使用默认凭证初始化', async () => {
      const configWithoutCredentials = { ...testConfig, keyFilename: '' };
      adapter = new GCSStorageAdapter(configWithoutCredentials);
      
      await expect(adapter.init()).resolves.not.toThrow();
      expect(mockStorage).toHaveBeenCalledWith({
        projectId: testConfig.projectId,
      });
    });
  });

  describe('文件上传测试', () => {
    it('应该成功上传文件到GCS', async () => {
      const fileBuffer = Buffer.from('GCS测试内容');
      const fileMetadata = {
        name: 'test.txt',
        size: 10,
        mimeType: 'text/plain'
      };

      mockFile.save.mockResolvedValueOnce([{}] as any);
      mockFile.getSignedUrl.mockResolvedValueOnce(['https://storage.googleapis.com/test-bucket/test-file-id']);

      const result = await adapter.upload(fileBuffer, fileMetadata);

      expect(result.id).toBeDefined();
      expect(result.url).toBe('https://storage.googleapis.com/test-bucket/test-file-id');
      expect(mockFile.save).toHaveBeenCalledWith(fileBuffer, {
        contentType: 'text/plain',
        metadata: {
          originalName: 'test.txt'
        }
      });
    });

    it('应该在上传失败时抛出错误', async () => {
      const fileBuffer = Buffer.from('测试内容');
      const fileMetadata = { name: 'test.txt', size: 10, mimeType: 'text/plain' };
      
      mockFile.save.mockRejectedValueOnce(new Error('GCS上传失败'));
      
      await expect(adapter.upload(fileBuffer, fileMetadata)).rejects.toThrow('GCS上传失败');
    });
  });

  describe('文件下载测试', () => {
    it('应该成功从GCS下载文件', async () => {
      const fileContent = Buffer.from('下载测试内容');
      mockFile.download.mockResolvedValueOnce([fileContent]);

      const result = await adapter.download('test-file-id');

      expect(result).toBe(fileContent);
      expect(mockFile.download).toHaveBeenCalled();
    });

    it('应该在文件不存在时抛出错误', async () => {
      mockFile.download.mockRejectedValueOnce(new Error('文件不存在'));
      
      await expect(adapter.download('non-existent')).rejects.toThrow('文件不存在');
    });
  });

  describe('文件删除测试', () => {
    it('应该成功删除GCS中的文件', async () => {
      mockFile.delete.mockResolvedValueOnce([{}] as any);
      
      const result = await adapter.delete('test-file-id');
      
      expect(result).toEqual({ success: true });
      expect(mockFile.delete).toHaveBeenCalled();
    });

    it('应该在删除失败时抛出错误', async () => {
      mockFile.delete.mockRejectedValueOnce(new Error('删除失败'));
      
      await expect(adapter.delete('test-file-id')).rejects.toThrow('删除失败');
    });
  });

  describe('文件列表测试', () => {
    it('应该成功列出GCS存储桶中的文件', async () => {
      const mockGcsFiles = [
        { 
          name: 'file1.txt',
          metadata: { size: '1024', updated: '2024-01-01T00:00:00.000Z' }
        },
        { 
          name: 'file2.json',
          metadata: { size: '2048', updated: '2024-01-02T00:00:00.000Z' }
        }
      ];

      mockGetFiles.mockResolvedValueOnce([mockGcsFiles as any]);

      const result = await adapter.listFiles();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        id: 'file1.txt',
        name: 'file1.txt',
        size: 1024,
        updatedAt: new Date('2024-01-01T00:00:00.000Z')
      });
      expect(mockGetFiles).toHaveBeenCalled();
    });

    it('应该在存储桶为空时返回空数组', async () => {
      mockGetFiles.mockResolvedValueOnce([[]]);
      
      const result = await adapter.listFiles();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('文件元数据测试', () => {
    it('应该成功获取GCS文件的元数据', async () => {
      mockFile.getMetadata.mockResolvedValueOnce([{
        size: '1024',
        updated: '2024-01-01T00:00:00.000Z',
        contentType: 'text/plain',
        metadata: {
          originalName: 'test.txt'
        }
      }]);

      const result = await adapter.getFileMetadata('test-file-id');

      expect(result).toEqual({
        id: 'test-file-id',
        name: 'test.txt',
        size: 1024,
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        mimeType: 'text/plain'
      });
    });

    it('应该在获取元数据失败时抛出错误', async () => {
      mockFile.getMetadata.mockRejectedValueOnce(new Error('文件不存在'));
      
      await expect(adapter.getFileMetadata('non-existent')).rejects.toThrow('文件不存在');
    });
  });

  describe('配置验证测试', () => {
    it('应该验证有效的GCS配置', () => {
      const result = GCSStorageAdapter.validateConfig(testConfig);
      
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('应该拒绝缺少必要参数的配置', () => {
      const invalidConfig = { 
        enabled: true,
        bucketName: '',
        projectId: '',
        keyFilename: ''
      };
      const result = GCSStorageAdapter.validateConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('bucketName 不能为空');
      expect(result.errors).toContain('projectId 不能为空');
    });

    it('应该验证签名URL过期时间的有效性', () => {
      const invalidConfig = { ...testConfig, signedUrlExpiry: -1 };
      const result = GCSStorageAdapter.validateConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('signedUrlExpiry 必须大于等于0');
    });
  });
});
