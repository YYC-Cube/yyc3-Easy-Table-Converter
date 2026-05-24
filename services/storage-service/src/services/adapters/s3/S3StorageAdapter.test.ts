/**
 * @file S3存储适配器测试
 * @description 测试AWS S3存储适配器的核心功能
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3StorageAdapter } from './S3StorageAdapter';
import { StorageConfig } from '../../../types';

// Mock AWS SDK modules
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

const mockS3Client = S3Client as jest.MockedClass<typeof S3Client>;
const mockPutObjectCommand = PutObjectCommand as jest.MockedClass<typeof PutObjectCommand>;
const mockGetObjectCommand = GetObjectCommand as jest.MockedClass<typeof GetObjectCommand>;
const mockDeleteObjectCommand = DeleteObjectCommand as jest.MockedClass<typeof DeleteObjectCommand>;
const mockListObjectsV2Command = ListObjectsV2Command as jest.MockedClass<typeof ListObjectsV2Command>;
const mockHeadObjectCommand = HeadObjectCommand as jest.MockedClass<typeof HeadObjectCommand>;
const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

describe('S3StorageAdapter', () => {
  let adapter: S3StorageAdapter;
  const testConfig: StorageConfig['s3'] = {
    enabled: true,
    bucketName: 'test-bucket',
    region: 'us-east-1',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    endpoint: '',
    usePathStyleEndpoint: false,
    signedUrlExpiry: 3600,
  };

  const mockSend = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Client.mockImplementation(() => ({
      send: mockSend
    } as any));
    
    adapter = new S3StorageAdapter(testConfig);
  });

  describe('初始化测试', () => {
    it('应该成功初始化S3客户端', async () => {
      await expect(adapter.init()).resolves.not.toThrow();
      expect(mockS3Client).toHaveBeenCalledWith({
        region: testConfig.region,
        credentials: {
          accessKeyId: testConfig.accessKeyId,
          secretAccessKey: testConfig.secretAccessKey,
        },
        endpoint: testConfig.endpoint,
        forcePathStyle: testConfig.usePathStyleEndpoint,
      });
    });
  });

  describe('文件上传测试', () => {
    it('应该成功上传文件到S3', async () => {
      const fileBuffer = Buffer.from('S3测试内容');
      const fileMetadata = {
        name: 'test.txt',
        size: 10,
        mimeType: 'text/plain'
      };

      mockSend.mockResolvedValueOnce({});
      mockGetSignedUrl.mockResolvedValueOnce('https://s3.amazonaws.com/test-bucket/test-file-id');

      const result = await adapter.upload(fileBuffer, fileMetadata);

      expect(result.id).toBeDefined();
      expect(result.url).toBe('https://s3.amazonaws.com/test-bucket/test-file-id');
      expect(mockPutObjectCommand).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalled();
    });

    it('应该在上传失败时抛出错误', async () => {
      const fileBuffer = Buffer.from('测试内容');
      const fileMetadata = { name: 'test.txt', size: 10, mimeType: 'text/plain' };
      
      mockSend.mockRejectedValueOnce(new Error('S3上传失败'));
      
      await expect(adapter.upload(fileBuffer, fileMetadata)).rejects.toThrow('S3上传失败');
    });
  });

  describe('文件下载测试', () => {
    it('应该成功从S3下载文件', async () => {
      const fileContent = Buffer.from('下载测试内容');
      mockSend.mockResolvedValueOnce({
        Body: {
          transformToByteArray: jest.fn().mockResolvedValueOnce(fileContent)
        }
      });

      const result = await adapter.download('test-file-id');

      expect(result).toEqual(fileContent);
      expect(mockGetObjectCommand).toHaveBeenCalledWith({
        Bucket: testConfig.bucketName,
        Key: 'test-file-id'
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it('应该在文件不存在时抛出错误', async () => {
      mockSend.mockRejectedValueOnce(new Error('NoSuchKey'));
      
      await expect(adapter.download('non-existent')).rejects.toThrow('NoSuchKey');
    });
  });

  describe('文件删除测试', () => {
    it('应该成功删除S3中的文件', async () => {
      mockSend.mockResolvedValueOnce({});
      
      const result = await adapter.delete('test-file-id');
      
      expect(result).toEqual({ success: true });
      expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: testConfig.bucketName,
        Key: 'test-file-id'
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it('应该在删除失败时抛出错误', async () => {
      mockSend.mockRejectedValueOnce(new Error('删除失败'));
      
      await expect(adapter.delete('test-file-id')).rejects.toThrow('删除失败');
    });
  });

  describe('文件列表测试', () => {
    it('应该成功列出S3存储桶中的文件', async () => {
      mockSend.mockResolvedValueOnce({
        Contents: [
          { Key: 'file1.txt', Size: 1024, LastModified: new Date('2024-01-01') },
          { Key: 'file2.json', Size: 2048, LastModified: new Date('2024-01-02') }
        ]
      });

      const result = await adapter.listFiles();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        id: 'file1.txt',
        name: 'file1.txt',
        size: 1024,
        updatedAt: new Date('2024-01-01')
      });
      expect(mockListObjectsV2Command).toHaveBeenCalledWith({
        Bucket: testConfig.bucketName
      });
    });

    it('应该在存储桶为空时返回空数组', async () => {
      mockSend.mockResolvedValueOnce({ Contents: [] });
      
      const result = await adapter.listFiles();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('文件元数据测试', () => {
    it('应该成功获取S3文件的元数据', async () => {
      mockSend.mockResolvedValueOnce({
        ContentLength: 1024,
        LastModified: new Date('2024-01-01'),
        ContentType: 'text/plain'
      });

      const result = await adapter.getFileMetadata('test-file-id');

      expect(result).toEqual({
        id: 'test-file-id',
        name: 'test-file-id',
        size: 1024,
        updatedAt: new Date('2024-01-01'),
        mimeType: 'text/plain'
      });
      expect(mockHeadObjectCommand).toHaveBeenCalledWith({
        Bucket: testConfig.bucketName,
        Key: 'test-file-id'
      });
    });

    it('应该在获取元数据失败时抛出错误', async () => {
      mockSend.mockRejectedValueOnce(new Error('文件不存在'));
      
      await expect(adapter.getFileMetadata('non-existent')).rejects.toThrow('文件不存在');
    });
  });

  describe('配置验证测试', () => {
    it('应该验证有效的S3配置', () => {
      const result = S3StorageAdapter.validateConfig(testConfig);
      
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('应该拒绝缺少必要参数的配置', () => {
      const invalidConfig = { 
        enabled: true,
        bucketName: '', // 空存储桶名称
        region: '',
        accessKeyId: '',
        secretAccessKey: ''
      };
      const result = S3StorageAdapter.validateConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('bucketName 不能为空');
      expect(result.errors).toContain('region 不能为空');
      expect(result.errors).toContain('accessKeyId 不能为空');
      expect(result.errors).toContain('secretAccessKey 不能为空');
    });

    it('应该验证签名URL过期时间的有效性', () => {
      const invalidConfig = { ...testConfig, signedUrlExpiry: 0 };
      const result = S3StorageAdapter.validateConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('signedUrlExpiry 必须大于0');
    });
  });
});
