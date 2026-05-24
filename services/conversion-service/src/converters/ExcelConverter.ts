/**
 * @file Excel 转换器
 * @description 提供 Excel 格式与其他格式之间的相互转换功能
 * @module converters/ExcelConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 * @updated 2024-01-16
 */

import { logger } from '../utils/logger';
import { BaseConverter } from './BaseConverter';
import { DataFormat, ConversionResponse, ConversionOptions } from '../types';

// 动态导入xlsx库
const loadXlsx = async () => {
  try {
    const xlsx = await import('xlsx');
    return xlsx.default || xlsx;
  } catch (error) {
    logger.error('无法加载 xlsx 库，请确保已安装：npm install xlsx');
    throw new Error('xlsx 库未安装');
  }
};

/**
 * Excel 转换器类
 */
export class ExcelConverter extends BaseConverter {
  /**
   * 构造函数
   */
  constructor() {
    super();
  }
  
  // convertExcelToJson方法已整合到performConversion中
  
  /**
   * 获取支持的源数据格式
   * @returns 支持的源数据格式数组
   */
  public getSupportedSourceFormats(): DataFormat[] {
    return [DataFormat.XLSX, DataFormat.XLS, DataFormat.CSV, DataFormat.JSON];
  }
  
  /**
   * 获取支持的目标数据格式
   * @returns 支持的目标数据格式数组
   */
  public getSupportedTargetFormats(): DataFormat[] {
    return [DataFormat.XLSX, DataFormat.CSV, DataFormat.JSON];
  }
  
  /**
   * 执行转换
   * @param sourceData 源数据
   * @param sourceFormat 源数据格式
   * @param targetFormat 目标数据格式
   * @param options 转换选项
   * @returns 转换响应
   */
  protected async performConversion(
    sourceData: string | Buffer,
    sourceFormat: DataFormat,
    targetFormat: DataFormat,
    options: ConversionOptions = {}
  ): Promise<ConversionResponse> {
    try {
      // 验证输入
      this.validateInput(sourceData);
      
      // 加载 xlsx 库
      const xlsxLib = await loadXlsx();
      
      // 检查目标格式是否支持
      if (!this.getSupportedTargetFormats().includes(targetFormat)) {
        throw new Error(`不支持将${sourceFormat}转换为${targetFormat}`);
      }
      
      // 根据源格式和目标格式执行不同的转换逻辑
      if (sourceFormat === DataFormat.XLSX || sourceFormat === DataFormat.XLS) {
        // Excel 转 CSV/JSON
        const workbookOptions = {
          type: sourceData instanceof Buffer ? 'buffer' : 'string',
          cellDates: true,
          cellText: false
        };
        
        const workbook = xlsxLib.read(sourceData, workbookOptions);
        const sheetName = options.sheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          throw new Error(`未找到工作表: ${sheetName}`);
        }
        
        return this.excelToOther(sourceData, targetFormat, options, xlsxLib);
      } else if (sourceFormat === DataFormat.CSV || sourceFormat === DataFormat.JSON) {
        // CSV/JSON 转 Excel
        return this.otherToExcel(sourceData, sourceFormat, targetFormat, options, xlsxLib);
      }
      
      throw new Error(`不支持从 ${sourceFormat} 转换到 ${targetFormat}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '转换过程中发生未知错误';
      logger.error(`Excel 转换失败: ${errorMessage}`, { sourceFormat, targetFormat });
      throw new Error(`转换失败: ${errorMessage}`);
    }
  }
  
  /**
   * Excel 转换为 CSV/JSON
   * @param excelData Excel 数据
   * @param targetFormat 目标数据格式
   * @param options 转换选项
   * @param xlsxLib xlsx 库实例
   * @returns 转换响应
   */
  private async excelToOther(
    excelData: string | Buffer,
    targetFormat: DataFormat,
    options?: ConversionOptions,
    xlsxLib?: any
  ): Promise<ConversionResponse> {
    try {
      if (!xlsxLib) {
        xlsxLib = await loadXlsx();
      }
      
      // 读取 Excel 文件
      const workbook = xlsxLib.read(excelData, {
        type: excelData instanceof Buffer ? 'buffer' : 'string',
        cellDates: true,
        cellNF: false,
        cellText: false
      });
      
      // 获取工作表名称
      const sheetName = options?.sheetName || workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Excel 文件中没有找到工作表');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        throw new Error(`未找到工作表: ${sheetName}`);
      }
      
      let result: string;
      let rowCount = 0;
      let columnCount = 0;
      
      if (targetFormat === DataFormat.JSON) {
        // 转换为 JSON
        const jsonData = xlsxLib.utils.sheet_to_json(worksheet, {
          raw: options?.rawData !== false,
          header: options?.headers === false ? 1 : 'A',
          dateNF: options?.dateFormat || 'yyyy-mm-dd'
        });
        
        result = JSON.stringify(jsonData, null, options?.jsonIndent || 2);
        rowCount = Array.isArray(jsonData) ? jsonData.length : 0;
        columnCount = rowCount > 0 && typeof jsonData[0] === 'object' ? 
                      Object.keys(jsonData[0]).length : 0;
      } else if (targetFormat === DataFormat.CSV) {
        // 转换为 CSV
        result = xlsxLib.utils.sheet_to_csv(worksheet, {
          FS: options?.delimiter || ',',
          dateNF: options?.dateFormat || 'yyyy-mm-dd'
        });
        
        // 计算行数和列数
        const lines = result.split(/\r?\n/);
        rowCount = lines.length;
        if (rowCount > 0) {
          const firstLine = lines[0];
          const delimiter = options?.delimiter || ',';
          columnCount = firstLine.split(delimiter).length;
        }
      } else {
        throw new Error(`不支持的目标格式: ${targetFormat}`);
      }
      
      return this.createSuccessResponse(
        result,
        targetFormat,
        { rowCount, columnCount }
      );
    } catch (error) {
      throw new Error(`Excel 转 ${targetFormat} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * CSV/JSON 转换为 Excel
   * @param sourceData 源数据
   * @param sourceFormat 源数据格式
   * @param targetFormat 目标数据格式
   * @param options 转换选项
   * @param xlsxLib xlsx 库实例
   * @returns 转换响应
   */
  private async otherToExcel(
    sourceData: string | Buffer,
    sourceFormat: DataFormat,
    targetFormat: DataFormat,
    options?: ConversionOptions,
    xlsxLib?: any
  ): Promise<ConversionResponse> {
    try {
      if (!xlsxLib) {
        xlsxLib = await loadXlsx();
      }
      
      // 转换为字符串
      const data = this.toString(sourceData);
      
      let worksheet: any;
      let rowCount = 0;
      let columnCount = 0;
      
      if (sourceFormat === DataFormat.CSV) {
        // 从 CSV 创建工作表
        worksheet = xlsxLib.utils.csv_to_sheet(data, {
          FS: options?.delimiter || ',',
          dateNF: options?.dateFormat || 'yyyy-mm-dd'
        });
        
        // 计算行数和列数
        const lines = data.split(/\r?\n/);
        rowCount = lines.length;
        if (rowCount > 0) {
          const firstLine = lines[0];
          const delimiter = options?.delimiter || ',';
          columnCount = firstLine.split(delimiter).length;
        }
      } else if (sourceFormat === DataFormat.JSON) {
        // 解析 JSON
        const jsonData = JSON.parse(data);
        
        if (!Array.isArray(jsonData)) {
          throw new Error('JSON 数据必须是数组格式');
        }
        
        // 从 JSON 创建工作表
        worksheet = xlsxLib.utils.json_to_sheet(jsonData, {
          skipHeader: options?.headers === false,
          dateNF: options?.dateFormat || 'yyyy-mm-dd'
        });
        
        rowCount = jsonData.length;
        columnCount = rowCount > 0 && typeof jsonData[0] === 'object' ? 
                      Object.keys(jsonData[0]).length : 0;
      } else {
        throw new Error(`不支持的源格式: ${sourceFormat}`);
      }
      
      // 创建工作簿
      const workbook = xlsxLib.utils.book_new();
      const sheetName = options?.sheetName || 'Sheet1';
      xlsxLib.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // 写入 Excel 文件
      const excelBuffer = xlsxLib.write(workbook, {
        bookType: targetFormat === DataFormat.XLSX ? 'xlsx' : 'xls',
        type: 'buffer'
      });
      
      // 如果需要返回字符串（Base64）
      if (options?.returnType === 'string') {
        const result = excelBuffer.toString('base64');
        return this.createSuccessResponse(
          result,
          targetFormat,
          { rowCount, columnCount, isBase64: true }
        );
      }
      
      // 默认返回 Buffer
      return this.createSuccessResponse(
        excelBuffer,
        targetFormat,
        { rowCount, columnCount, isBuffer: true }
      );
    } catch (error) {
      throw new Error(`${sourceFormat} 转 Excel 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 获取 Excel 文件中的所有工作表名称
   * @param excelData Excel 数据
   * @returns 工作表名称数组
   */
  public async getSheetNames(excelData: string | Buffer): Promise<string[]> {
    try {
      const xlsxLib = await loadXlsx();
      const workbook = xlsxLib.read(excelData, {
        type: excelData instanceof Buffer ? 'buffer' : 'string'
      });
      return workbook.SheetNames;
    } catch (error) {
      logger.error('获取工作表名称失败', { error });
      throw error;
    }
  }
  
  /**
   * 验证源数据
   * @param sourceData 源数据
   * @param sourceFormat 源数据格式
   * @returns 是否有效
   */
  protected validateInput(data: string | Buffer): void {
    if (!data) {
      throw new Error('输入数据不能为空');
    }
  }
  
  protected validateSourceData(sourceData: string | Buffer, sourceFormat: DataFormat): boolean {
    // 先调用通用验证方法
    try {
      this.validateInput(sourceData);
    } catch (error) {
      return false;
    }
    
    // 对于 Excel 格式，需要确保数据是 Buffer 或者可以转换为 Buffer 的字符串
    if ((sourceFormat === DataFormat.XLSX || sourceFormat === DataFormat.XLS) && typeof sourceData === 'string') {
      try {
        // 尝试将字符串视为 Base64 并转换为 Buffer
        Buffer.from(sourceData, 'base64');
        return true;
      } catch (error) {
        return false;
      }
    }
    
    // 其他格式的数据只要不为空即可通过验证
    return true;
  }
}
