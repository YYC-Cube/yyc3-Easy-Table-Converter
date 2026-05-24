/**
 * @file Parquet到JSON转换器
 * @description 实现Parquet格式到JSON格式的转换功能
 * @module services/conversion-service/src/converters/ParquetToJsonConverter
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { BaseConverter } from './BaseConverter';
import { DataFormat } from '../types';
import { ConversionOptions } from './IConverter';

/**
 * Parquet到JSON转换器类
 */
export class ParquetToJsonConverter extends BaseConverter {
  /**
   * 获取支持的源格式
   */
  getSupportedSourceFormat(): DataFormat {
    return DataFormat.PARQUET;
  }

  /**
   * 获取支持的目标格式列表
   */
  getSupportedTargetFormats(): DataFormat[] {
    return [DataFormat.JSON];
  }

  /**
   * 执行Parquet到JSON的转换
   * @param sourceData Parquet源数据
   * @param targetFormat 目标格式
   * @param options 转换选项
   */
  protected async performConversion(
    sourceData: Buffer,
    targetFormat: DataFormat,
    options: ConversionOptions
  ): Promise<{
    data: Buffer;
    metadata: {
      rows: number;
      columns: number;
      [key: string]: any;
    };
  }> {
    this.logger.info(`[ParquetToJsonConverter] 开始Parquet到JSON转换，选项: ${JSON.stringify(options)}`);
    
    // 动态导入parquetjs库以避免依赖问题
    let parquetjs;
    try {
      // 尝试使用不同的导入路径，以支持不同版本的parquet库
      parquetjs = await import('parquetjs');
    } catch (importError) {
      try {
        parquetjs = await import('parquetjs-lite');
      } catch (liteImportError) {
        throw new Error('未找到Parquet解析库，请安装parquetjs或parquetjs-lite');
      }
    }
    
    const { ParquetReader } = parquetjs;
    
    let reader;
    const rows = [];
    let schema = null;
    
    try {
      // 创建缓冲区读取流
      const buffer = Buffer.from(sourceData);
      
      // 创建ParquetReader
      reader = await ParquetReader.openBuffer(buffer);
      
      // 获取模式信息
      schema = reader.schema;
      const columns = Object.keys(schema.fields);
      const columnCount = columns.length;
      
      // 创建游标
      const cursor = reader.getCursor();
      
      // 读取所有数据
      let record;
      while ((record = await cursor.next()) !== null) {
        rows.push(record);
      }
      
      const rowCount = rows.length;
      
      // 转换为JSON字符串
      const jsonString = JSON.stringify(rows, null, options.pretty ? 2 : 0);
      
      this.logger.info(`[ParquetToJsonConverter] Parquet转换完成，解析了 ${rowCount} 行，${columnCount} 列`);
      
      return {
        data: Buffer.from(jsonString),
        metadata: {
          rows: rowCount,
          columns: columnCount,
          schema: this.simplifySchema(schema),
          compression: reader.compression,
          rowGroups: reader.rowGroups.length
        }
      };
    } catch (error) {
      this.logger.error(`[ParquetToJsonConverter] Parquet解析错误: ${error instanceof Error ? error.message : '未知错误'}`);
      throw new Error(`Parquet解析失败: ${error instanceof Error ? error.message : '无效的Parquet格式'}`);
    } finally {
      // 关闭读取器
      if (reader) {
        await reader.close();
      }
    }
  }

  /**
   * 向后兼容：执行Parquet到JSON的转换
   * @param data Parquet数据
   * @param options 转换选项
   */
  protected async performConversionLegacy(
    data: string | Buffer,
    options: ConversionOptions
  ): Promise<string> {
    const bufferData = typeof data === 'string' ? Buffer.from(data) : data;
    const result = await this.performConversion(bufferData, DataFormat.JSON, options);
    return result.data.toString('utf-8');
  }

  /**
   * 验证Parquet文件
   * @param data Parquet数据
   */
  async validate(data: Buffer): Promise<any> {
    try {
      // 动态导入parquetjs库以避免依赖问题
      let parquetjs;
      try {
        parquetjs = await import('parquetjs');
      } catch (importError) {
        try {
          parquetjs = await import('parquetjs-lite');
        } catch (liteImportError) {
          return this.createValidationError('未找到Parquet解析库，请安装parquetjs或parquetjs-lite');
        }
      }
      
      const { ParquetReader } = parquetjs;
      let reader;
      
      try {
        // 创建缓冲区读取流
        const buffer = Buffer.from(data);
        
        // 尝试打开Parquet文件
        reader = await ParquetReader.openBuffer(buffer);
        
        // 验证是否有数据
        const cursor = reader.getCursor();
        const hasData = await cursor.next() !== null;
        
        // 获取模式信息
        const columns = Object.keys(reader.schema.fields);
        
        return this.createValidationSuccess({
          hasData,
          columnCount: columns.length,
          rowGroups: reader.rowGroups.length,
          compression: reader.compression
        });
      } finally {
        if (reader) {
          await reader.close();
        }
      }
    } catch (error) {
      return this.createValidationError(
        error instanceof Error ? error.message : 'Parquet文件格式无效'
      );
    }
  }

  /**
   * 简化Parquet模式信息
   * @param schema Parquet模式对象
   */
  private simplifySchema(schema: any): any {
    if (!schema || !schema.fields) {
      return {};
    }
    
    const simplified: any = {};
    
    for (const [fieldName, field] of Object.entries(schema.fields)) {
      simplified[fieldName] = {
        type: field.originalType || field.type,
        optional: field.optional || false
      };
      
      // 如果是嵌套类型，递归简化
      if (field.fields) {
        simplified[fieldName].fields = this.simplifySchema({ fields: field.fields });
      }
    }
    
    return simplified;
  }
}
