/**
 * @file ConversionEngine单元测试
 * @description 测试转换引擎核心功能
 * @module services/conversion-service/__tests__/engine/ConversionEngine.test
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-22
 * @updated 2024-11-23
 */

import * as Arrow from "apache-arrow";
import { ConversionEngine } from "../../src/engine/ConversionEngine";
import type { ConversionTask, EngineConfig, ConversionRequest, ConversionResponse } from "../../src/engine/ConversionEngine";
import { DataFormat } from "../../src/types";
import { LoggerService } from "../../src/services/LoggerService";

// Mock dependencies
jest.mock("apache-arrow");
jest.mock("../../src/services/LoggerService");

const mockLoggerService = LoggerService as jest.MockedClass<typeof LoggerService>;
const mockArrow = Arrow as jest.Mocked<typeof Arrow>;

describe("ConversionEngine", () => {
  let conversionEngine: ConversionEngine;
  let mockLogger: jest.Mocked<LoggerService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock logger instance
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    mockLoggerService.mockImplementation(() => mockLogger);

    // Simplified mock for Arrow Table
    (mockArrow.Table as any) = jest.fn(() => ({}));

    // Create conversion engine instance
    conversionEngine = new ConversionEngine();
  });

  describe("构造函数初始化", () => {
    it("应该使用默认配置初始化引擎", () => {
      expect(mockLoggerService).toHaveBeenCalledWith("ConversionEngine");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "转换引擎已初始化",
        expect.any(Object),
      );
    });

    it("应该使用自定义配置初始化引擎", () => {
      const customConfig: EngineConfig = {
        maxConcurrentTasks: 10,
        taskTimeoutMs: 600000,
        memoryLimitMb: 1024,
      };

      jest.clearAllMocks();
      new ConversionEngine(customConfig);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "转换引擎已初始化",
        expect.objectContaining({
          maxConcurrentTasks: 10,
          memoryLimitMb: 1024,
        }),
      );
    });
  });

  describe("validateFile方法", () => {
    it("应该正确验证文件格式", async () => {
      const mockFile = Buffer.from("id,name\n1,test");
      
      // Mock successful validation
      const mockParser = { validate: jest.fn().mockResolvedValue({ isValid: true, issues: [] }) };
      conversionEngine["formatHandlers"][DataFormat.CSV] = mockParser;
      
      const result = await conversionEngine.validateFile(mockFile, DataFormat.CSV);
      
      expect(result.isValid).toBe(true);
      expect(mockParser.validate).toHaveBeenCalledWith(mockFile);
    });
    
    it("应该在验证失败时返回错误信息", async () => {
      const mockFile = Buffer.from("invalid,data,with,no,headers");
      
      // Mock validation failure
      const mockParser = {
        validate: jest.fn().mockResolvedValue({
          isValid: false,
          issues: [{ message: "文件格式不正确", line: 1 }]
        })
      };
      conversionEngine["formatHandlers"][DataFormat.CSV] = mockParser;
      
      const result = await conversionEngine.validateFile(mockFile, DataFormat.CSV);
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });
  
  describe("getSupportedFormats方法", () => {
    it("应该返回支持的所有格式列表", () => {
      const formats = conversionEngine.getSupportedFormats();

      expect(Array.isArray(formats)).toBe(true);
      expect(formats.length).toBeGreaterThan(0);
    });
  });

  describe("getEngineStatus方法", () => {
    it("应该返回正确的引擎状态信息", () => {
      const status = conversionEngine.getEngineStatus();

      expect(status).toHaveProperty("activeTasks");
      expect(status).toHaveProperty("supportedFormats");
      expect(status).toHaveProperty("uptime");
      expect(status).toHaveProperty("memoryUsage");
      expect(status.activeTasks).toBe(0);
      expect(Array.isArray(status.supportedFormats)).toBe(true);
    });
  });

  describe("convert方法 - 新API", () => {
    it("应该成功执行转换请求并返回正确的响应格式", () => {
      const mockRequest: ConversionRequest = {
        sourceFormat: DataFormat.CSV,
        targetFormat: DataFormat.JSON,
        sourceData: Buffer.from("id,name\n1,test"),
        options: { headers: true }
      };
      
      // Mock internal format handler
      const originalHandler = (ConversionEngine as any).prototype.registerFormatHandler;
      (ConversionEngine as any).prototype.registerFormatHandler = jest.fn();
      
      // Mock conversion logic
      const mockTransform = jest.fn().mockReturnValue({
        data: Buffer.from(JSON.stringify([{ id: "1", name: "test" }])),
        metadata: { rows: 1, columns: 2 }
      });
      
      conversionEngine["formatHandlers"][DataFormat.CSV] = { parse: jest.fn().mockReturnValue({}) };
      conversionEngine["formatHandlers"][DataFormat.JSON] = { format: mockTransform };
      
      const result = conversionEngine.convert(mockRequest);
      
      expect(result).toBeInstanceOf(Promise);
      expect(mockTransform).toHaveBeenCalled();
      
      // Restore original method
      (ConversionEngine as any).prototype.registerFormatHandler = originalHandler;
    });
    
    it("应该处理转换错误并返回错误响应", async () => {
      const mockRequest: ConversionRequest = {
        sourceFormat: DataFormat.CSV,
        targetFormat: DataFormat.JSON,
        sourceData: Buffer.from("invalid,data"),
        options: {}
      };
      
      // Mock error in conversion
      conversionEngine["formatHandlers"][DataFormat.CSV] = {
        parse: jest.fn().mockRejectedValue(new Error("解析错误"))
      };
      
      const result = await conversionEngine.convert(mockRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
  
  describe("convertTask方法 - 兼容旧API", () => {
    const mockTask: ConversionTask = {
      id: "test-task-1",
      sourceData: "id,name,value\n1,test,100.5\n2,demo,200.8",
      sourceFormat: DataFormat.CSV,
      targetFormat: DataFormat.JSON,
      options: {},
    };

    it("应该成功执行转换任务", async () => {
      // Mock format handlers
      jest.spyOn(conversionEngine as any, "convertToArrow").mockResolvedValue({
        numRows: 2,
        numCols: 3,
        schema: {
          fields: [],
        },
        // Mock necessary methods for memory calculation
        getChild: jest.fn(),
      } as any);

      jest.spyOn(conversionEngine as any, "convertFromArrow").mockResolvedValue(
        Buffer.from(
          JSON.stringify([
            { id: 1, name: "test", value: 100.5 },
            { id: 2, name: "demo", value: 200.8 },
          ]),
        ),
      );

      const result = await conversionEngine.convert(mockTask);

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("metadata");
      expect(result.metadata.rowCount).toBe(2);
      expect(result.metadata.columnCount).toBe(3);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `开始转换任务: ${mockTask.id}`,
        expect.any(Object),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        `转换任务完成: ${mockTask.id}`,
        expect.any(Object),
      );
    });

    it("应该在转换失败时抛出错误并记录日志", async () => {
      const errorMessage = "转换失败测试";

      jest
        .spyOn(conversionEngine as any, "convertToArrow")
        .mockRejectedValue(new Error(errorMessage));

      await expect(conversionEngine.convert(mockTask)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalledWith(
        `转换任务失败: ${mockTask.id}`,
        expect.any(Object),
      );
    });

    it("应该在任务超时时抛出错误", async () => {
      // Mock checkTaskLimits方法抛出超时错误，而不是尝试访问私有config属性
      jest.spyOn(conversionEngine as any, "checkTaskLimits").mockImplementation(() => {
        throw new Error("任务执行超时");
      });

      await expect(conversionEngine.convert(mockTask)).rejects.toThrow("任务执行超时");
    });

    it("应该在不支持的源格式时抛出错误", async () => {
      const unsupportedTask: ConversionTask = {
        ...mockTask,
        sourceFormat: "unsupported-format" as any,
      };

      await expect(conversionEngine.convert(unsupportedTask)).rejects.toThrow(
        "不支持的源格式: unsupported-format",
      );
    });

    it("应该在不支持的目标格式时抛出错误", async () => {
      const unsupportedTask: ConversionTask = {
        ...mockTask,
        targetFormat: "unsupported-format" as any,
      };

      await expect(conversionEngine.convert(unsupportedTask)).rejects.toThrow(
        "不支持的目标格式: unsupported-format",
      );
    });
  });

  describe("estimateConversionTime方法", () => {
    it("应该估算CSV到JSON格式的转换时间", () => {
      const estimatedTime = conversionEngine.estimateConversionTime(
        1024,
        DataFormat.CSV,
        DataFormat.JSON,
      );

      expect(estimatedTime).toBeGreaterThan(0);
    });

    it("应该估算JSON到CSV格式的转换时间", () => {
      const estimatedTime = conversionEngine.estimateConversionTime(
        2048,
        DataFormat.JSON,
        DataFormat.CSV,
      );

      expect(estimatedTime).toBeGreaterThan(0);
    });

    it("应该处理大数据量的估算", () => {
      const estimatedTime = conversionEngine.estimateConversionTime(
        1024 * 1024,
        DataFormat.CSV,
        DataFormat.JSON,
      );

      expect(estimatedTime).toBeGreaterThan(0);
    });
  });

  describe("registerCustomHandler方法", () => {
    it("应该成功注册自定义格式处理器", () => {
      const mockHandler = {
        toArrow: jest.fn().mockResolvedValue({} as any),
        fromArrow: jest.fn().mockResolvedValue(""),
      };

      conversionEngine.registerCustomHandler("custom-format" as DataFormat, mockHandler);

      expect(conversionEngine.getSupportedFormats()).toContain("custom-format");
    });
  });

  describe("shutdown方法", () => {
    it("应该正常关闭引擎", async () => {
      await conversionEngine.shutdown(1000);

      // 验证关闭逻辑是否执行
      expect(mockLogger.info).toHaveBeenCalledWith("转换引擎已成功关闭");
    });
  });
});