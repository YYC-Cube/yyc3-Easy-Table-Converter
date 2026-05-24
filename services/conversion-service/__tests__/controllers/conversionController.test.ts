/**
 * @file 转换控制器单元测试
 * @description 测试转换服务控制器功能
 * @module services/conversion-service/__tests__/controllers/conversionController.test
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { Request, Response } from 'express';
import { ConversionController } from '../../src/controllers/conversionController';
import { ConversionEngine } from '../../src/engine/ConversionEngine';
import { DataFormat } from '../../src/types';

// Mock dependencies
jest.mock('../../src/engine/ConversionEngine');

const mockConversionEngine = ConversionEngine as jest.MockedClass<typeof ConversionEngine>;

describe('ConversionController', () => {
  let controller: ConversionController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockEngine: any;
  let sendMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup response mocks
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({
      send: sendMock,
      json: sendMock
    });
    
    mockResponse = {
      send: sendMock,
      json: sendMock,
      status: statusMock,
      setHeader: jest.fn()
    };
    
    // Mock engine instance
    mockEngine = {
      convert: jest.fn(),
      getSupportedFormats: jest.fn(),
      validateFile: jest.fn()
    };
    
    mockConversionEngine.getInstance.mockReturnValue(mockEngine);
    
    // Create controller instance
    controller = new ConversionController();
  });

  describe('convertFile方法', () => {
    it('应该成功处理文件转换请求', async () => {
      // Setup mock request
      mockRequest = {
        file: {
          buffer: Buffer.from('id,name\n1,test'),
          originalname: 'test.csv'
        },
        body: {
          fromFormat: DataFormat.CSV,
          toFormat: DataFormat.JSON,
          options: JSON.stringify({ headers: true })
        }
      };
      
      // Mock engine response
      const mockEngineResponse = {
        success: true,
        data: Buffer.from(JSON.stringify([{ id: '1', name: 'test' }])),
        metadata: { rows: 1, columns: 2 },
        taskId: 'test-task-id'
      };
      
      mockEngine.convert.mockResolvedValue(mockEngineResponse);
      
      // Execute test
      await controller.convertFile(mockRequest as Request, mockResponse as Response);
      
      // Verify engine was called correctly
      expect(mockEngine.convert).toHaveBeenCalledWith({
        sourceFormat: DataFormat.CSV,
        targetFormat: DataFormat.JSON,
        sourceData: expect.any(Buffer),
        options: { headers: true }
      });
      
      // Verify response
      expect(sendMock).toHaveBeenCalledWith({
        success: true,
        data: mockEngineResponse.data.toString('base64'),
        metadata: mockEngineResponse.metadata,
        taskId: mockEngineResponse.taskId
      });
    });
    
    it('应该处理文件上传缺失的错误', async () => {
      // Setup mock request without file
      mockRequest = {
        file: undefined,
        body: {
          fromFormat: DataFormat.CSV,
          toFormat: DataFormat.JSON
        }
      };
      
      // Execute test
      await controller.convertFile(mockRequest as Request, mockResponse as Response);
      
      // Verify error response
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({
        success: false,
        error: { code: 'FILE_REQUIRED', message: '上传文件不能为空' }
      });
    });
    
    it('应该处理引擎转换错误', async () => {
      // Setup mock request
      mockRequest = {
        file: { buffer: Buffer.from('data'), originalname: 'test.csv' },
        body: {
          fromFormat: DataFormat.CSV,
          toFormat: DataFormat.JSON
        }
      };
      
      // Mock engine error
      const mockError = new Error('转换失败');
      mockEngine.convert.mockRejectedValue(mockError);
      
      // Execute test
      await controller.convertFile(mockRequest as Request, mockResponse as Response);
      
      // Verify error response
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith({
        success: false,
        error: { code: 'CONVERSION_FAILED', message: '转换过程中发生错误' }
      });
    });
  });

  describe('convertData方法', () => {
    it('应该成功处理内存数据转换', async () => {
      // Setup mock request
      mockRequest = {
        body: {
          sourceFormat: DataFormat.CSV,
          targetFormat: DataFormat.JSON,
          sourceData: 'id,name\n1,test',
          options: { headers: true }
        }
      };
      
      // Mock engine response
      const mockEngineResponse = {
        success: true,
        data: Buffer.from(JSON.stringify([{ id: '1', name: 'test' }])),
        metadata: { rows: 1, columns: 2 },
        taskId: 'test-task-id'
      };
      
      mockEngine.convert.mockResolvedValue(mockEngineResponse);
      
      // Execute test
      await controller.convertData(mockRequest as Request, mockResponse as Response);
      
      // Verify engine call
      expect(mockEngine.convert).toHaveBeenCalledWith({
        sourceFormat: DataFormat.CSV,
        targetFormat: DataFormat.JSON,
        sourceData: expect.any(Buffer),
        options: { headers: true }
      });
      
      // Verify response
      expect(sendMock).toHaveBeenCalledWith({
        success: true,
        data: mockEngineResponse.data.toString('base64'),
        metadata: mockEngineResponse.metadata,
        taskId: mockEngineResponse.taskId
      });
    });
    
    it('应该处理数据缺失错误', async () => {
      // Setup mock request without sourceData
      mockRequest = {
        body: {
          sourceFormat: DataFormat.CSV,
          targetFormat: DataFormat.JSON
        }
      };
      
      // Execute test
      await controller.convertData(mockRequest as Request, mockResponse as Response);
      
      // Verify error response
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({
        success: false,
        error: { code: 'DATA_REQUIRED', message: '源数据不能为空' }
      });
    });
  });

  describe('getSupportedFormats方法', () => {
    it('应该返回支持的格式列表', async () => {
      // Mock supported formats
      const mockFormats = [DataFormat.CSV, DataFormat.JSON, DataFormat.PARQUET];
      mockEngine.getSupportedFormats.mockReturnValue(mockFormats);
      
      // Execute test
      await controller.getSupportedFormats(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(sendMock).toHaveBeenCalledWith({
        success: true,
        formats: mockFormats
      });
    });
  });

  describe('validateFile方法', () => {
    it('应该成功验证文件格式', async () => {
      // Setup mock request
      mockRequest = {
        file: { buffer: Buffer.from('id,name\n1,test'), originalname: 'test.csv' },
        body: { format: DataFormat.CSV }
      };
      
      // Mock engine validation result
      const mockValidation = { isValid: true, issues: [] };
      mockEngine.validateFile.mockResolvedValue(mockValidation);
      
      // Execute test
      await controller.validateFile(mockRequest as Request, mockResponse as Response);
      
      // Verify engine call
      expect(mockEngine.validateFile).toHaveBeenCalledWith(
        mockRequest.file!.buffer,
        DataFormat.CSV
      );
      
      // Verify response
      expect(sendMock).toHaveBeenCalledWith({
        success: true,
        isValid: true,
        issues: []
      });
    });
    
    it('应该处理验证失败的情况', async () => {
      // Setup mock request
      mockRequest = {
        file: { buffer: Buffer.from('invalid,data'), originalname: 'test.csv' },
        body: { format: DataFormat.CSV }
      };
      
      // Mock engine validation result
      const mockValidation = {
        isValid: false,
        issues: [{ message: '格式错误', line: 1 }]
      };
      mockEngine.validateFile.mockResolvedValue(mockValidation);
      
      // Execute test
      await controller.validateFile(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(sendMock).toHaveBeenCalledWith({
        success: true,
        isValid: false,
        issues: mockValidation.issues
      });
    });
  });
});
