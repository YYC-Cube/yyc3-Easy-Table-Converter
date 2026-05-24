/**
 * @file 转换路由单元测试
 * @description 测试转换服务API路由
 * @module services/conversion-service/__tests__/routes/conversionRoutes.test
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import request from 'supertest';
import { app } from '../../src/app';
import { ConversionEngine } from '../../src/engine/ConversionEngine';
import { DataFormat } from '../../src/types';

// Mock the ConversionEngine
jest.mock('../../src/engine/ConversionEngine');

const mockConversionEngine = ConversionEngine as jest.MockedClass<typeof ConversionEngine>;

describe('Conversion Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mock implementation
    mockConversionEngine.getInstance.mockReturnValue({
      convert: jest.fn().mockResolvedValue({ success: true, data: {} }),
      estimate: jest.fn().mockResolvedValue({ duration: 1000, memory: 512 }),
      registerCustomHandler: jest.fn().mockResolvedValue(true),
      shutdown: jest.fn().mockResolvedValue(true)
    } as any);
  });

  describe('POST /api/conversion/convert', () => {
    it('should convert data successfully', async () => {
      const mockResponse = {
        success: true,
        data: Buffer.from(JSON.stringify([{ id: '1', name: 'test' }])),
        metadata: { rows: 1, columns: 2 },
        taskId: 'test-task-id'
      };
      
      // Mock the conversion engine
      mockConversionEngine.getInstance.mockReturnValue({
        convert: jest.fn().mockResolvedValue(mockResponse),
        convertTask: jest.fn().mockResolvedValue(mockResponse),
        getSupportedFormats: jest.fn().mockReturnValue(Object.values(DataFormat)),
        validateFile: jest.fn().mockResolvedValue({ isValid: true, issues: [] })
      } as any);

      const response = await request(app)
        .post('/api/conversion/convert')
        .attach('file', Buffer.from('id,name\n1,test'), 'test.csv')
        .field('fromFormat', DataFormat.CSV)
        .field('toFormat', DataFormat.JSON)
        .field('options', JSON.stringify({ headers: true }));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/conversion/convert')
        .send({
          fromFormat: 'invalid-format',
          toFormat: DataFormat.JSON
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/conversion/data', () => {
    it('should convert in-memory data successfully', async () => {
      const mockResponse = {
        success: true,
        data: Buffer.from(JSON.stringify([{ id: '1', name: 'test' }])),
        metadata: { rows: 1, columns: 2 },
        taskId: 'test-task-id'
      };
      
      // Mock the conversion engine
      mockConversionEngine.getInstance.mockReturnValue({
        convert: jest.fn().mockResolvedValue(mockResponse),
        getSupportedFormats: jest.fn().mockReturnValue(Object.values(DataFormat))
      } as any);

      const response = await request(app)
        .post('/api/conversion/data')
        .send({
          sourceFormat: DataFormat.CSV,
          targetFormat: DataFormat.JSON,
          sourceData: 'id,name\n1,test',
          options: { headers: true }
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid source format', async () => {
      const response = await request(app)
        .post('/api/conversion/data')
        .send({
          sourceFormat: 'invalid-format',
          targetFormat: DataFormat.JSON,
          sourceData: 'some data'
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/conversion/formats', () => {
    it('should return supported formats list', async () => {
      const mockFormats = [DataFormat.CSV, DataFormat.JSON, DataFormat.PARQUET];
      
      mockConversionEngine.getInstance.mockReturnValue({
        getSupportedFormats: jest.fn().mockReturnValue(mockFormats)
      } as any);

      const response = await request(app)
        .get('/api/conversion/formats')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.formats)).toBe(true);
      expect(response.body.formats).toContain(DataFormat.CSV);
    });
  });

  describe('POST /api/conversion/validate', () => {
    it('should validate file successfully', async () => {
      const mockResponse = {
        isValid: true,
        issues: []
      };
      
      mockConversionEngine.getInstance.mockReturnValue({
        validateFile: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      const response = await request(app)
        .post('/api/conversion/validate')
        .attach('file', Buffer.from('id,name\n1,test'), 'test.csv')
        .field('format', DataFormat.CSV);

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(true);
    });

    it('should return validation issues when file is invalid', async () => {
      const mockResponse = {
        isValid: false,
        issues: [{ message: '文件格式不正确', line: 1 }]
      };
      
      mockConversionEngine.getInstance.mockReturnValue({
        validateFile: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      const response = await request(app)
        .post('/api/conversion/validate')
        .attach('file', Buffer.from('invalid,data,with,no,headers'), 'test.csv')
        .field('format', DataFormat.CSV);

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(false);
      expect(response.body.issues.length).toBeGreaterThan(0);
    });
  });
});