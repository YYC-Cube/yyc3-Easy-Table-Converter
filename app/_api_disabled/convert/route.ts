/**
 * @file 转换API路由
 * @description 处理表格转换的核心逻辑，支持多种格式的转换
 * @module app/api/convert/route
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * 转换请求参数验证模式
 */
const convertSchema = z.object({
  format: z.string().min(1).max(50),
  data: z.any(),
  options: z.object({
    delimiter: z.string().optional(),
    headers: z.boolean().optional().default(true),
    precision: z.number().optional().default(2),
  }).optional().default({}),
});

/**
 * 转换API处理函数
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    
    // 验证请求参数
    const validated = convertSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        { error: '参数验证失败', details: validated.error.errors },
        { status: 400 }
      );
    }

    const { format, data, options } = validated.data;
    
    // 执行转换逻辑（这里是模拟实现）
    let result: any;
    
    switch (format.toLowerCase()) {
      case 'csv':
        result = convertToCSV(data, options);
        break;
      case 'json':
        result = convertToJSON(data, options);
        break;
      case 'xml':
        result = convertToXML(data, options);
        break;
      case 'markdown':
        result = convertToMarkdown(data, options);
        break;
      default:
        return NextResponse.json(
          { error: `不支持的转换格式: ${format}` },
          { status: 400 }
        );
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: result,
      format,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('转换过程中出现错误:', error);
    return NextResponse.json(
      { error: '转换过程中出现错误', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * 转换为CSV格式
 */
function convertToCSV(data: any, options: any): string {
  if (!Array.isArray(data)) {
    throw new Error('数据必须是数组格式');
  }

  const delimiter = options.delimiter || ',';
  
  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  let csvContent = headers.join(delimiter) + '\n';

  data.forEach((row) => {
    const values = headers.map(header => {
      let value = row[header];
      
      // 处理数字精度
      if (typeof value === 'number' && options.precision !== undefined) {
        value = Number(value.toFixed(options.precision));
      }
      
      // 处理字符串中的特殊字符
      if (typeof value === 'string') {
        // 如果字符串包含分隔符、引号或换行符，则用引号包裹
        if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
      }
      
      return value;
    });
    
    csvContent += values.join(delimiter) + '\n';
  });

  return csvContent;
}

/**
 * 转换为JSON格式
 */
function convertToJSON(data: any, options: any): string {
  // 确保数据是数组格式
  const processedData = Array.isArray(data) ? data : [data];
  
  // 根据精度选项处理数字
  const processData = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'number' && options.precision !== undefined) {
        return Number(obj.toFixed(options.precision));
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(processData);
    }
    
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = processData(value);
    }
    return result;
  };
  
  return JSON.stringify(processData(processedData), null, 2);
}

/**
 * 转换为XML格式
 */
function convertToXML(data: any, options: any): string {
  if (!Array.isArray(data)) {
    throw new Error('数据必须是数组格式');
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<root>\n';
  
  data.forEach((item, index) => {
    xml += '  <item id="' + (index + 1) + '">\n';
    
    for (const [key, value] of Object.entries(item)) {
      xml += '    <' + key + '>';
      
      if (typeof value === 'number' && options.precision !== undefined) {
        xml += Number(value.toFixed(options.precision));
      } else if (typeof value === 'string') {
        // 转义XML特殊字符
        xml += value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      } else {
        xml += String(value);
      }
      
      xml += '</' + key + '>\n';
    }
    
    xml += '  </item>\n';
  });
  
  xml += '</root>';
  return xml;
}

/**
 * 转换为Markdown表格格式
 */
function convertToMarkdown(data: any, options: any): string {
  if (!Array.isArray(data)) {
    throw new Error('数据必须是数组格式');
  }

  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  
  // 创建表头
  let md = '| ' + headers.join(' | ') + ' |\n';
  
  // 创建分隔线
  md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  
  // 创建表格内容
  data.forEach((row) => {
    const values = headers.map(header => {
      let value = row[header];
      
      // 处理数字精度
      if (typeof value === 'number' && options.precision !== undefined) {
        value = Number(value.toFixed(options.precision));
      }
      
      // 处理换行符（在Markdown中替换为空格）
      if (typeof value === 'string') {
        value = value.replace(/\n/g, ' ');
      }
      
      return value;
    });
    
    md += '| ' + values.join(' | ') + ' |\n';
  });

  return md;
}
