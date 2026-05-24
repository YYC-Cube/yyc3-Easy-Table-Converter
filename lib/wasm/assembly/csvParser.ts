/**
 * @file WebAssembly CSV解析器
 * @description 高性能CSV数据解析实现
 * @module lib/wasm/csvParser
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-22
 */

// 定义CSV解析结果结构
export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  rowCount: i32;
  columnCount: i32;
}

/**
 * CSV解析器类
 */
@unmanaged
class CSVParser {
  private _delimiter: u8;
  private _quoteChar: u8;
  private _escapeChar: u8;

  constructor(delimiter: u8 = 44, quoteChar: u8 = 34, escapeChar: u8 = 34) {
    this._delimiter = delimiter;
    this._quoteChar = quoteChar;
    this._escapeChar = escapeChar;
  }

  /**
   * 解析CSV字符串
   * @param data CSV字符串数据
   * @param start 起始位置
   * @param length 数据长度
   * @returns 解析结果
   */
  parse(data: string, start: i32 = 0, length: i32 = -1): CSVParseResult {
    // 处理默认长度
    if (length === -1) {
      length = data.length;
    }

    const headers: string[] = [];
    const rows: string[][] = [];
    
    let currentField = '';
    let currentRow: string[] = [];
    let inQuotes = false;
    let escaped = false;
    
    // 解析过程
    for (let i: i32 = start; i < start + length; i++) {
      const char: u8 = data.charCodeAt(i);
      
      if (escaped) {
        // 处理转义字符
        currentField += String.fromCharCode(char);
        escaped = false;
        continue;
      }
      
      if (char === this._escapeChar && inQuotes) {
        // 检测转义
        escaped = true;
        continue;
      }
      
      if (char === this._quoteChar) {
        // 引号处理
        inQuotes = !inQuotes;
        continue;
      }
      
      if (char === 10 || (char === 13 && i + 1 < start + length && data.charCodeAt(i + 1) === 10)) {
        // 行结束处理
        if (char === 13) {
          // 跳过CRLF的LF部分
          i++;
        }
        
        // 添加当前字段到行
        currentRow.push(currentField);
        currentField = '';
        
        if (headers.length === 0) {
          // 第一行是表头
          for (let j: i32 = 0; j < currentRow.length; j++) {
            headers.push(currentRow[j]);
          }
        } else {
          // 添加到数据行
          rows.push(currentRow);
        }
        
        currentRow = [];
        continue;
      }
      
      if (char === this._delimiter && !inQuotes) {
        // 字段分隔符处理
        currentRow.push(currentField);
        currentField = '';
        continue;
      }
      
      // 普通字符添加到当前字段
      currentField += String.fromCharCode(char);
    }
    
    // 处理最后一行（如果没有换行符结束）
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField);
      
      if (headers.length === 0) {
        // 只有一行的情况
        for (let j: i32 = 0; j < currentRow.length; j++) {
          headers.push(currentRow[j]);
        }
      } else {
        rows.push(currentRow);
      }
    }
    
    // 返回解析结果
    return {
      headers: headers,
      rows: rows,
      rowCount: rows.length,
      columnCount: headers.length
    };
  }

  /**
   * 将解析结果格式化为JSON字符串
   * @param result CSV解析结果
   * @returns JSON字符串
   */
  toJSON(result: CSVParseResult): string {
    let json = '[';
    
    for (let i: i32 = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      json += '{';
      
      for (let j: i32 = 0; j < result.headers.length; j++) {
        if (j > 0) json += ',';
        
        const header = result.headers[j];
        const value = j < row.length ? row[j] : '';
        
        json += `"${header}":"${value}"`;
      }
      
      json += '}';
      if (i < result.rows.length - 1) json += ',';
    }
    
    json += ']';
    return json;
  }
}

/**
 * CSV解析器实例
 */
const parser = new CSVParser();

/**
 * 导出解析CSV的函数
 * @param csv CSV字符串
 * @returns JSON字符串
 */
export function parseCSV(csv: string): string {
  const result = parser.parse(csv);
  return parser.toJSON(result);
}

/**
 * 计算CSV行数的快速方法
 * @param csv CSV字符串
 * @returns 行数
 */
export function countCSVLines(csv: string): i32 {
  let count: i32 = 0;
  let inQuotes: boolean = false;
  
  for (let i: i32 = 0; i < csv.length; i++) {
    const char = csv.charCodeAt(i);
    
    if (char === 34) { // "
      inQuotes = !inQuotes;
    }
    
    if ((char === 10 || (char === 13 && i + 1 < csv.length && csv.charCodeAt(i + 1) === 10)) && !inQuotes) {
      count++;
      if (char === 13) i++; // 跳过CRLF的LF部分
    }
  }
  
  // 如果没有换行符但有内容，也算一行
  if (count === 0 && csv.length > 0) {
    count = 1;
  }
  
  return count;
}
