/**
 * @file YAML/JSON互转工具
 * @description 提供YAML与JSON格式之间的相互转换功能
 * @module lib/converters/yaml/yamlConverter
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-26
 * @updated 2025-10-26
 */

import yaml from 'js-yaml';

/**
 * YAML转JSON选项
 */
export interface YamlToJsonOptions {
  /** 是否将JSON字符串格式化 */
  pretty?: boolean;
  /** 缩进空格数 */
  indent?: number;
}

/**
 * JSON转YAML选项
 */
export interface JsonToYamlOptions {
  /** 是否将YAML字符串格式化 */
  pretty?: boolean;
  /** 缩进空格数 */
  indent?: number;
  /** 行宽限制 */
  lineWidth?: number;
  /** 是否使用引号 */
  quotingType?: '' | 'single' | 'double';
}

/**
 * 将YAML字符串转换为JSON字符串
 * @param yamlStr YAML字符串
 * @param options 转换选项
 * @returns 转换后的JSON字符串
 * @throws {Error} 当YAML格式无效时抛出错误
 */
export function yamlToJson(yamlStr: string, options: YamlToJsonOptions = {}): string {
  try {
    // 解析YAML字符串为JavaScript对象
    const data = yaml.load(yamlStr);
    
    // 根据选项格式化JSON输出
    if (options.pretty) {
      return JSON.stringify(data, null, options.indent || 2);
    }
    
    return JSON.stringify(data);
  } catch (error) {
    // 增强错误信息，提供更友好的提示
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`YAML解析失败: ${errorMessage}`);
  }
}

/**
 * 将JSON字符串转换为YAML字符串
 * @param jsonStr JSON字符串
 * @param options 转换选项
 * @returns 转换后的YAML字符串
 * @throws {Error} 当JSON格式无效时抛出错误
 */
export function jsonToYaml(jsonStr: string, options: JsonToYamlOptions = {}): string {
  try {
    // 解析JSON字符串为JavaScript对象
    const data = JSON.parse(jsonStr);
    
    // 转换为YAML字符串
    const yamlOptions: any = {};
    if (options.lineWidth !== undefined) {
      yamlOptions.lineWidth = options.lineWidth;
    }
    if (options.quotingType) {
      yamlOptions.quotingType = options.quotingType;
    }
    
    return yaml.dump(data, yamlOptions);
  } catch (error) {
    // 增强错误信息，提供更友好的提示
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`JSON解析失败: ${errorMessage}`);
  }
}

/**
 * 验证YAML字符串格式是否有效
 * @param yamlStr YAML字符串
 * @returns 验证结果
 */
export function isValidYaml(yamlStr: string): { valid: boolean; error?: string } {
  try {
    yaml.load(yamlStr);
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
 * 获取YAML语法错误的行号和位置
 * @param yamlStr YAML字符串
 * @returns 错误位置信息或null
 */
export function getYamlErrorLocation(yamlStr: string): { line?: number; column?: number } | null {
  try {
    yaml.load(yamlStr);
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