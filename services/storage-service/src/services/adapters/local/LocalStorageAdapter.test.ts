/**
 * @file 本地存储适配器测试
 * @description 测试本地文件系统存储适配器的核心功能
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import fs from 'fs';
import path from 'path';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { StorageConfig } from '../../../types';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
  },
  existsSync: jest.fn(),
}));

const mockFs = fs.promises as jest.Mocked<typeof fs.promises>;
const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;
  const testConfig: StorageConfig['local'] = {
    path: '/tmp/test-uploads',
    baseUrl: 'http://localhost:3100/uploads',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    adapter = new LocalStorageAdapter(testConfig);
  });

  describe('初始化测试', () => {
    it('应该成功初始化并创建上传目录', async () => {
      mockExistsSync.mockReturnValue(false);
      
      await expect(adapter.init()).resolves.not.toThrow();
      expect(mockFs.mkdir).toHaveBeenCalledWith(testConfig.path, { recursive: true });
    });

    it('应该在目录已存在时不创建', async () => {
      mockExistsSync.mockReturnValue(true);
      
      await expect(adapter.init()).resolves.not.toThrow();
      expect(mockFs.mkdir).not.toHaveBeenCalled();
    });

    it('应该在初始化失败时抛出错误', async () => {
      mockExistsSync.mockReturnValue(false);
      mockFs.mkdir.mockRejectedValueOnce(new Error('权限被拒绝'));
      
      await expect(adapter.init()).rejects.toThrow('权限被拒绝');
    });
  });

  describe('文件上传测试', () => {
    it('应该成功上传文件', async () => {
      const fileBuffer = Buffer.from('测试内容');
      const fileMetadata = { 
        name: 'test.txt', 
        size: 10,
        mimeType: 'text/plain'
      };

      const result = await adapter.upload(fileBuffer, fileMetadata);

      expect(result.id).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.url).toContain(testConfig.baseUrl);
      expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
      
      const writeFileCall = mockFs.writeFile.mock.calls[0];
      expect(writeFileCall[0]).toContain(testConfig.path);
      expect(writeFileCall[1]).toBe(fileBuffer);
    });

    it('应该在上传失败时抛出错误', async () => {
      const fileBuffer = Buffer.from('测试内容');
      const fileMetadata = { name: 'test.txt', size: 10, mimeType: 'text/plain' };
      
      mockFs.writeFile.mockRejectedValueOnce(new Error('写入失败'));
      
      await expect(adapter.upload(fileBuffer, fileMetadata)).rejects.toThrow('写入失败');
    });
  });

  describe('文件下载测试', () => {
    it('应该成功下载文件', async () => {
      const fileContent = Buffer.from('下载测试内容');
      mockFs.readFile.mockResolvedValueOnce(fileContent);

      const result = await adapter.download('test-file-id');

      expect(result).toBe(fileContent);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(testConfig.path, 'test-file-id')
      );
    });

    it('应该在文件不存在时抛出错误', async () => {
      mockFs.readFile.mockRejectedValueOnce(new Error('文件不存在'));
      
      await expect(adapter.download('non-existent')).rejects.toThrow('文件不存在');
    });
  });

  describe('文件删除测试', () => {
    it('应该成功删除文件', async () => {
      const result = await adapter.delete('test-file-id');
      
      expect(result).toEqual({ success: true });
      expect(mockFs.unlink).toHaveBeenCalledWith(
        path.join(testConfig.path, 'test-file-id')
      );
    });

    it('应该在删除失败时抛出错误', async () => {
      mockFs.unlink.mockRejectedValueOnce(new Error('删除失败'));
      
      await expect(adapter.delete('test-file-id')).rejects.toThrow('删除失败');
    });
  });

  describe('文件列表测试', () => {
    it('应该成功列出文件', async () => {
      const mockFiles = ['file1.txt', 'file2.json'];
      mockFs.readdir.mockResolvedValueOnce(mockFiles);
      
      mockFs.stat.mockResolvedValueOnce({
        size: 1024,
        mtime: new Date('2024-01-01'),
      } as fs.Stats);
      mockFs.stat.mockResolvedValueOnce({
        size: 2048,
        mtime: new Date('2024-01-02'),
      } as fs.Stats);

      const result = await adapter.listFiles();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('id', 'file1.txt');
      expect(result[0]).toHaveProperty('name', 'file1.txt');
      expect(result[1]).toHaveProperty('id', 'file2.json');
    });

    it('应该在目录为空时返回空数组', async () => {
      mockFs.readdir.mockResolvedValueOnce([]);
      
      const result = await adapter.listFiles();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('文件元数据测试', () => {
    it('应该成功获取文件元数据', async () => {
      mockFs.stat.mockResolvedValueOnce({
        size: 1024,
        mtime: new Date('2024-01-01'),
      } as fs.Stats);

      const result = await adapter.getFileMetadata('test-file-id');

      expect(result).toHaveProperty('id', 'test-file-id');
      expect(result).toHaveProperty('name', 'test-file-id');
      expect(result).toHaveProperty('size', 1024);
      expect(result).toHaveProperty('updatedAt');
    });

    it('应该在获取元数据失败时抛出错误', async () => {
      mockFs.stat.mockRejectedValueOnce(new Error('文件不存在'));
      
      await expect(adapter.getFileMetadata('non-existent')).rejects.toThrow('文件不存在');
    });
  });

  describe('配置验证测试', () => {
    it('应该验证有效的配置', () => {
      const result = LocalStorageAdapter.validateConfig(testConfig);
      
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('应该拒绝无效的配置', () => {
      const invalidConfig = { path: '', baseUrl: '' };
      const result = LocalStorageAdapter.validateConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
