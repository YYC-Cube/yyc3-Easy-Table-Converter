/**
 * @file TOML/JSON互转工具
 * @description 提供TOML与JSON格式之间的相互转换功能
 * @module lib/converters/toml/tomlConverter
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-26
 * @updated 2025-10-26
 */

import { parse, stringify } from '@iarna/toml';

/**
 * TOML转JSON选项
 */
export interface TomlToJsonOptions {
  /** 是否将JSON字符串格式化 */
  pretty?: boolean;
  /** 缩进空格数 */
  indent?: number;
}

/**
 * JSON转TOML选项
 */
export interface JsonToTomlOptions {
  /** 是否保留注释（如果支持） */
  keepComments?: boolean;
}

/**
 * 将TOML字符串转换为JSON字符串
 * @param tomlStr TOML字符串
 * @param options 转换选项
 * @returns 转换后的JSON字符串
 * @throws {Error} 当TOML格式无效时抛出错误
 */
export function tomlToJson(tomlStr: string, options: TomlToJsonOptions = {}): string {
  try {
    // 解析TOML字符串为JavaScript对象
    const data = parse(tomlStr);
    
    // 根据选项格式化JSON输出
    if (options.pretty) {
      return JSON.stringify(data, null, options.indent || 2);
    }
    
    return JSON.stringify(data);
  } catch (error) {
    // 增强错误信息，提供更友好的提示
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`TOML解析失败: ${errorMessage}`);
  }
}

/**
 * 将JSON字符串转换为TOML字符串
 * @param jsonStr JSON字符串
 * @param options 转换选项
 * @returns 转换后的TOML字符串
 * @throws {Error} 当JSON格式无效时抛出错误
 */
export function jsonToToml(jsonStr: string, options: JsonToTomlOptions = {}): string {
  try {
    // 解析JSON字符串为JavaScript对象
    const data = JSON.parse(jsonStr);
    
    // 转换为TOML字符串
    return stringify(data);
  } catch (error) {
    // 增强错误信息，提供更友好的提示
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`JSON解析失败: ${errorMessage}`);
  }
}

/**
 * 验证TOML字符串格式是否有效
 * @param tomlStr TOML字符串
 * @returns 验证结果
 */
export function isValidToml(tomlStr: string): { valid: boolean; error?: string } {
  try {
    parse(tomlStr);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 验证JSON字符串格式是否有效
 * @param jsonStr JSON字符串
 * @returns 验证结果
 */
export function isValidJson(jsonStr: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(jsonStr);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 获取TOML语法错误的行号和位置
 * @param tomlStr TOML字符串
 * @returns 错误位置信息或null
 */
export function getTomlErrorLocation(tomlStr: string): { line?: number; column?: number } | null {
  try {
    parse(tomlStr);
    return null;
  } catch (error) {
    if (error instanceof Error) {
      // 尝试从错误消息中提取行号信息
      const lineMatch = error.message.match(/line (\d+)/i);
      if (lineMatch) {
        return {
          line: parseInt(lineMatch[1], 10),
          column: undefined
        };
      }
    }
    return null;
  }
}
