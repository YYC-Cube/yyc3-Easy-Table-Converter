/**
 * @file WebAssembly 数据格式化器
 * @description 高性能数据类型转换和格式化实现
 * @module lib/wasm/dataFormatter
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-22
 */

/**
 * 数据类型枚举
 */
export enum DataType {
  STRING,
  NUMBER,
  INTEGER,
  BOOLEAN,
  DATE,
  NULL
}

/**
 * 格式化选项接口
 */
export interface FormatOptions {
  dateFormat: string;
  decimalPlaces: i32;
  thousandSeparator: string;
  decimalSeparator: string;
}

/**
 * 默认格式化选项
 */
const DEFAULT_OPTIONS: FormatOptions = {
  dateFormat: 'YYYY-MM-DD',
  decimalPlaces: 2,
  thousandSeparator: ',',
  decimalSeparator: '.'
};

/**
 * 数据格式化器类
 */
@unmanaged
class DataFormatter {
  private _options: FormatOptions;

  constructor(options: FormatOptions = DEFAULT_OPTIONS) {
    this._options = options;
  }

  /**
   * 检测数据类型
   * @param value 输入值
   * @returns 数据类型
   */
  detectType(value: string): DataType {
    // 处理空值
    if (value === '' || value === 'null' || value === 'NULL') {
      return DataType.NULL;
    }

    // 处理布尔值
    if (value === 'true' || value === 'TRUE') return DataType.BOOLEAN;
    if (value === 'false' || value === 'FALSE') return DataType.BOOLEAN;

    // 处理数字
    const isInteger = this.isInteger(value);
    const isNumber = isInteger || this.isNumber(value);
    
    if (isNumber) {
      return isInteger ? DataType.INTEGER : DataType.NUMBER;
    }

    // 尝试检测日期（简单实现）
    if (this.isDate(value)) {
      return DataType.DATE;
    }

    // 默认返回字符串
    return DataType.STRING;
  }

  /**
   * 检查是否为整数
   * @param value 输入值
   * @returns 是否为整数
   */
  private isInteger(value: string): boolean {
    if (value.length === 0) return false;

    let i: i32 = 0;
    // 处理负号
    if (value.charCodeAt(0) === 45) {
      i = 1;
      if (value.length === 1) return false;
    }

    // 检查所有字符是否为数字
    for (; i < value.length; i++) {
      const char = value.charCodeAt(i);
      if (char < 48 || char > 57) return false;
    }

    return true;
  }

  /**
   * 检查是否为数字（包括小数）
   * @param value 输入值
   * @returns 是否为数字
   */
  private isNumber(value: string): boolean {
    if (value.length === 0) return false;

    let i: i32 = 0;
    let dotCount: i32 = 0;

    // 处理负号
    if (value.charCodeAt(0) === 45) {
      i = 1;
      if (value.length === 1) return false;
    }

    for (; i < value.length; i++) {
      const char = value.charCodeAt(i);
      
      // 小数点处理
      if (char === 46 || char === 44) {
        dotCount++;
        if (dotCount > 1) return false;
        continue;
      }

      if (char < 48 || char > 57) return false;
    }

    return dotCount <= 1;
  }

  /**
   * 简单的日期检测
   * @param value 输入值
   * @returns 是否为日期
   */
  private isDate(value: string): boolean {
    // 支持的日期格式：YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
    const len = value.length;
    
    // 检查长度
    if (len !== 10) return false;
    
    // 检查分隔符位置和字符
    if (
      (value.charCodeAt(4) === 45 && value.charCodeAt(7) === 45) || // YYYY-MM-DD
      (value.charCodeAt(2) === 47 && value.charCodeAt(5) === 47) || // DD/MM/YYYY 或 MM/DD/YYYY
      (value.charCodeAt(2) === 45 && value.charCodeAt(5) === 45)    // DD-MM-YYYY 或 MM-DD-YYYY
    ) {
      return true;
    }

    return false;
  }

  /**
   * 格式化数字
   * @param value 数字字符串
   * @param options 格式化选项
   * @returns 格式化后的字符串
   */
  formatNumber(value: string, options: FormatOptions = this._options): string {
    // 转换为数值
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    // 四舍五入到指定小数位
    const rounded = num.toFixed(options.decimalPlaces);
    
    // 替换小数点分隔符
    const parts = rounded.split('.');
    
    // 添加千位分隔符
    let integerPart = parts[0];
    const regex = /\B(?=(\d{3})+(?!\d))/g;
    integerPart = integerPart.replace(regex, options.thousandSeparator);
    
    // 重建数字字符串
    if (parts.length > 1 && options.decimalPlaces > 0) {
      return integerPart + options.decimalSeparator + parts[1];
    }
    
    return integerPart;
  }

  /**
   * 批量处理数字格式化
   * @param values 数字字符串数组
   * @param options 格式化选项
   * @returns 格式化后的字符串数组
   */
  formatNumbers(values: string[], options: FormatOptions = this._options): string[] {
    const result: string[] = [];
    
    for (let i: i32 = 0; i < values.length; i++) {
      result.push(this.formatNumber(values[i], options));
    }
    
    return result;
  }

  /**
   * 压缩数值显示（如 1000 -> 1k）
   * @param value 数字字符串
   * @returns 压缩后的字符串
   */
  compressNumber(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }

    return value;
  }
}

/**
 * 数据格式化器实例
 */
const formatter = new DataFormatter();

/**
 * 导出检测数据类型的函数
 * @param value 输入值
 * @returns 数据类型枚举值
 */
export function detectDataType(value: string): i32 {
  return formatter.detectType(value);
}

/**
 * 导出格式化数字的函数
 * @param value 数字字符串
 * @param decimalPlaces 小数位数
 * @returns 格式化后的字符串
 */
export function formatNumberWithOptions(value: string, decimalPlaces: i32): string {
  const options: FormatOptions = {
    ...DEFAULT_OPTIONS,
    decimalPlaces
  };
  return formatter.formatNumber(value, options);
}

/**
 * 导出压缩数字显示的函数
 * @param value 数字字符串
 * @returns 压缩后的字符串
 */
export function compressNumberDisplay(value: string): string {
  return formatter.compressNumber(value);
}
