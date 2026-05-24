/**
 * @file Apache Arrow 数据处理器
 * @description 基于Apache Arrow的高性能数据处理模块
 * @module lib/table
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-22
 */

import * as Arrow from 'apache-arrow';

/**
 * Arrow数据处理器类
 */
export class ArrowDataProcessor {
  /**
   * 将JavaScript数组转换为Arrow表格
   * @param data JavaScript对象数组
   * @returns Arrow表格对象
   */
  static convertToArrow(data: any[]): Arrow.Table {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('数据必须是非空数组');
      }

      // 从JSON数据创建Arrow表格
      const table = Arrow.tableFromJSON(data);
      return table;
    } catch (error) {
      console.error('转换为Arrow格式失败:', error);
      throw error;
    }
  }

  /**
   * 将Arrow表格转换为JavaScript数组
   * @param table Arrow表格对象
   * @returns JavaScript对象数组
   */
  static convertFromArrow(table: Arrow.Table): any[] {
    try {
      if (!table || !(table instanceof Arrow.Table)) {
        throw new Error('无效的Arrow表格对象');
      }

      // 转换为JavaScript对象数组
      return table.toArray();
    } catch (error) {
      console.error('从Arrow格式转换失败:', error);
      throw error;
    }
  }

  /**
   * 序列化Arrow表格以便在网络传输或存储
   * @param table Arrow表格对象
   * @returns 序列化后的ArrayBuffer
   */
  static serializeArrow(table: Arrow.Table): ArrayBuffer {
    try {
      // 合并批次并序列化
      const buffer = Arrow.makeIpcWriter(table.schema, table.batches).toUint8Array();
      return buffer.buffer;
    } catch (error) {
      console.error('序列化Arrow数据失败:', error);
      throw error;
    }
  }

  /**
   * 反序列化Arrow数据
   * @param buffer ArrayBuffer数据
   * @returns Arrow表格对象
   */
  static deserializeArrow(buffer: ArrayBuffer): Arrow.Table {
    try {
      // 从Uint8Array创建读取器并解析数据
      const reader = Arrow.makeIpcReader(new Uint8Array(buffer));
      const batches = [];
      
      while (!reader.isFinished) {
        batches.push(reader.readNext());
      }
      
      if (batches.length === 0) {
        throw new Error('没有找到有效的Arrow数据批次');
      }
      
      return new Arrow.Table(batches[0].schema, batches);
    } catch (error) {
      console.error('反序列化Arrow数据失败:', error);
      throw error;
    }
  }

  /**
   * 从CSV字符串创建Arrow表格
   * @param csvData CSV字符串
   * @param delimiter 分隔符，默认为逗号
   * @returns Arrow表格对象
   */
  static fromCSV(csvData: string, delimiter: string = ','): Arrow.Table {
    try {
      // 解析CSV为二维数组
      const lines = csvData.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('CSV数据为空');
      }

      // 提取表头
      const headers = lines[0].split(delimiter).map(h => h.trim());
      
      // 构建数据对象数组
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index] || '';
          // 尝试自动类型转换
          row[header] = ArrowDataProcessor.autoTypeConvert(value);
        });
        
        data.push(row);
      }

      // 转换为Arrow表格
      return this.convertToArrow(data);
    } catch (error) {
      console.error('从CSV转换到Arrow失败:', error);
      throw error;
    }
  }

  /**
   * 将Arrow表格转换为CSV字符串
   * @param table Arrow表格对象
   * @param delimiter 分隔符，默认为逗号
   * @returns CSV字符串
   */
  static toCSV(table: Arrow.Table, delimiter: string = ','): string {
    try {
      // 获取表头
      const headers = table.schema.fields.map(field => field.name);
      
      // 构建CSV内容
      let csvContent = headers.join(delimiter) + '\n';
      
      // 处理每一行数据
      table.scan().forEach((row: any) => {
        const values = headers.map(header => {
          const value = row[header];
          // 处理特殊情况：需要引号的值
          if (typeof value === 'string' && (value.includes(delimiter) || value.includes('\n') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          // 处理null和undefined
          if (value === null || value === undefined) {
            return '';
          }
          // 日期格式化
          if (value instanceof Date) {
            return value.toISOString();
          }
          return String(value);
        });
        
        csvContent += values.join(delimiter) + '\n';
      });
      
      return csvContent;
    } catch (error) {
      console.error('从Arrow转换到CSV失败:', error);
      throw error;
    }
  }

  /**
   * 自动类型转换辅助函数
   * @param value 字符串值
   * @returns 转换后的值
   */
  private static autoTypeConvert(value: string): any {
    // 空值处理
    if (value === '' || value.toLowerCase() === 'null') {
      return null;
    }
    
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // 数字处理
    if (!isNaN(Number(value)) && value.trim() !== '') {
      const num = Number(value);
      // 区分整数和浮点数
      return Number.isInteger(num) ? num : parseFloat(value);
    }
    
    // 日期处理（简单尝试）
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // 默认返回字符串
    return value;
  }

  /**
   * 对Arrow表格执行过滤操作
   * @param table 原始Arrow表格
   * @param filterFunction 过滤函数
   * @returns 过滤后的Arrow表格
   */
  static filterTable(table: Arrow.Table, filterFunction: (row: any) => boolean): Arrow.Table {
    try {
      // 转换为JS数组进行过滤
      const data = table.toArray();
      const filteredData = data.filter(filterFunction);
      
      // 转换回Arrow表格
      return this.convertToArrow(filteredData);
    } catch (error) {
      console.error('过滤Arrow表格失败:', error);
      throw error;
    }
  }

  /**
   * 获取Arrow表格的内存使用情况
   * @param table Arrow表格对象
   * @returns 内存使用统计
   */
  static getMemoryUsage(table: Arrow.Table): { totalBytes: number; rows: number; columns: number } {
    try {
      let totalBytes = 0;
      
      // 计算每个批次的内存使用
      table.batches.forEach(batch => {
        batch.data.forEach(vector => {
          totalBytes += vector.array.buffer.byteLength;
        });
      });
      
      return {
        totalBytes,
        rows: table.numRows,
        columns: table.numCols
      };
    } catch (error) {
      console.error('获取内存使用情况失败:', error);
      return { totalBytes: 0, rows: 0, columns: 0 };
    }
  }
}

export default ArrowDataProcessor;