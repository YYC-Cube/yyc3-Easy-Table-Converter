/**
 * @file 数据处理Web Worker
 * @description 用于在后台线程处理大型数据文件解析
 * @module utils/dataWorker
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

// Worker消息类型定义
interface WorkerMessage {
  type: string;
  payload?: any;
}

// CSV解析配置
interface CSVParseOptions {
  delimiter?: string;
  hasHeaders?: boolean;
  skipLines?: number;
  maxRows?: number;
}

// 解析结果接口
interface ParseResult {
  data: any[];
  headers?: string[];
  totalRows: number;
  format: string;
  error?: string;
}

/**
 * 处理CSV数据解析
 * @param content CSV内容字符串
 * @param options 解析选项
 * @returns 解析结果
 */
function parseCSV(content: string, options: CSVParseOptions = {}): ParseResult {
  try {
    const {
      delimiter = ',',
      hasHeaders = true,
      skipLines = 0,
      maxRows
    } = options;

    // 分割行
    const lines = content.trim().split(/\r?\n/).slice(skipLines);
    if (lines.length === 0) {
      return {
        data: [],
        headers: [],
        totalRows: 0,
        format: 'csv'
      };
    }

    // 提取表头
    const headers = hasHeaders ? lines[0].split(delimiter).map(h => h.trim()) : 
      Array.from({ length: lines[0].split(delimiter).length }, (_, i) => `column_${i}`);
    
    // 解析数据行
    const dataLines = hasHeaders ? lines.slice(1) : lines;
    const rowsToParse = maxRows ? dataLines.slice(0, maxRows) : dataLines;
    
    // 分批处理以避免内存问题
    const BATCH_SIZE = 1000;
    const data: any[] = [];
    
    for (let i = 0; i < rowsToParse.length; i += BATCH_SIZE) {
      const batch = rowsToParse.slice(i, i + BATCH_SIZE);
      
      for (const line of batch) {
        if (line.trim()) {
          const values = parseCSVLine(line, delimiter);
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = index < values.length ? values[index].trim() : '';
          });
          
          data.push(row);
        }
      }
      
      // 发送进度更新
      self.postMessage({
        type: 'progress',
        payload: {
          progress: Math.floor(((i + BATCH_SIZE) / rowsToParse.length) * 100),
          rowsProcessed: data.length
        }
      });
      
      // 让出控制权，避免长时间运行
      if (i + BATCH_SIZE < rowsToParse.length) {
        // 模拟yield
        self.postMessage({
          type: 'yield'
        });
        // 短暂延迟
        const startTime = Date.now();
        while (Date.now() - startTime < 10) {}
      }
    }
    
    return {
      data,
      headers,
      totalRows: data.length,
      format: 'csv'
    };
  } catch (error) {
    return {
      data: [],
      headers: [],
      totalRows: 0,
      format: 'csv',
      error: error instanceof Error ? error.message : 'CSV解析失败'
    };
  }
}

/**
 * 解析CSV行，处理引号和转义字符
 * @param line CSV行
 * @param delimiter 分隔符
 * @returns 解析后的值数组
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const results: string[] = [];
  let current = '';
  let inQuotes = false;
  let escaped = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // 处理双引号转义
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\\') {
      escaped = true;
    } else if (char === delimiter && !inQuotes) {
      results.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  results.push(current);
  return results;
}

/**
 * 处理JSON数据解析
 * @param content JSON内容字符串
 * @param options 解析选项
 * @returns 解析结果
 */
function parseJSON(content: string, options: { maxItems?: number } = {}): ParseResult {
  try {
    const parsed = JSON.parse(content);
    let data: any[] = [];
    let headers: string[] = [];
    
    if (Array.isArray(parsed)) {
      data = options.maxItems ? parsed.slice(0, options.maxItems) : parsed;
      // 尝试从第一个对象提取键作为表头
      if (data.length > 0 && typeof data[0] === 'object') {
        headers = Object.keys(data[0]);
      }
    } else if (typeof parsed === 'object' && parsed !== null) {
      // 如果是对象，转换为单元素数组
      data = [parsed];
      headers = Object.keys(parsed);
    }
    
    return {
      data,
      headers,
      totalRows: data.length,
      format: 'json'
    };
  } catch (error) {
    return {
      data: [],
      headers: [],
      totalRows: 0,
      format: 'json',
      error: error instanceof Error ? error.message : 'JSON解析失败'
    };
  }
}

/**
 * 处理TSV数据解析
 * @param content TSV内容字符串
 * @param options 解析选项
 * @returns 解析结果
 */
function parseTSV(content: string, options: CSVParseOptions = {}): ParseResult {
  return parseCSV(content, { ...options, delimiter: '\t' });
}

/**
 * 检测文件格式
 * @param content 文件内容
 * @returns 检测到的格式
 */
function detectFormat(content: string): string {
  content = content.trim();
  
  // 尝试检测JSON
  if ((content.startsWith('{') && content.endsWith('}')) ||
      (content.startsWith('[') && content.endsWith(']'))) {
    try {
      JSON.parse(content);
      return 'json';
    } catch {
      // 不是有效的JSON
    }
  }
  
  // 检查是否有制表符来识别TSV
  if (content.includes('\t')) {
    const lines = content.split(/\r?\n/);
    const tabCount = lines[0].split('\t').length;
    const commaCount = lines[0].split(',').length;
    
    // 如果制表符更多，可能是TSV
    if (tabCount > commaCount) {
      return 'tsv';
    }
  }
  
  // 默认作为CSV处理
  return 'csv';
}

/**
 * 主处理函数
 * @param message 来自主线程的消息
 */
function handleMessage(message: WorkerMessage): void {
  try {
    const { type, payload } = message;
    
    switch (type) {
      case 'parse':
        const { content, format, options } = payload;
        let result: ParseResult;
        
        // 如果未指定格式，自动检测
        const targetFormat = format || detectFormat(content);
        
        switch (targetFormat) {
          case 'csv':
            result = parseCSV(content, options);
            break;
          case 'json':
            result = parseJSON(content, options);
            break;
          case 'tsv':
            result = parseTSV(content, options);
            break;
          default:
            throw new Error(`不支持的格式: ${targetFormat}`);
        }
        
        // 发送解析结果
        self.postMessage({
          type: 'result',
          payload: result
        });
        break;
        
      case 'ping':
        // 响应心跳检测
        self.postMessage({
          type: 'pong'
        });
        break;
        
      default:
        throw new Error(`未知的消息类型: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: {
        message: error instanceof Error ? error.message : '未知错误'
      }
    });
  }
}

// 设置消息监听器
self.onmessage = (e) => handleMessage(e.data);

// 响应主线程的错误
self.onerror = (errorEvent) => {
  self.postMessage({
    type: 'error',
    payload: {
      message: errorEvent.message || 'Worker错误',
      filename: errorEvent.filename,
      lineno: errorEvent.lineno,
      colno: errorEvent.colno
    }
  });
  return true; // 防止默认错误处理
};

// 向主线程发送准备就绪消息
self.postMessage({
  type: 'ready'
});
