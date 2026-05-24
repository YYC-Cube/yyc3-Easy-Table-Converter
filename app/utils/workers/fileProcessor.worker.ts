/**
 * @file 文件处理Web Worker
 * @description 在后台线程中处理大型文件，避免阻塞主线程
 * @module utils/workers/fileProcessor.worker
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

// 定义消息类型
interface ProcessFileRequest {
  type: 'PROCESS_FILE';
  fileContent: string;
  fileType: string;
  action: 'parse' | 'convert' | 'validate';
  options?: any;
}

interface ProcessBatchRequest {
  type: 'PROCESS_BATCH';
  files: Array<{ content: string; type: string; name: string }>;
  action: 'parse' | 'convert' | 'validate';
  options?: any;
}

interface ProgressUpdate {
  type: 'PROGRESS';
  percentage: number;
  status: string;
  fileIndex?: number;
}

interface ProcessResult {
  type: 'RESULT';
  data: any;
  error?: string;
}

// 模拟文件解析函数
function parseFile(content: string, fileType: string, options?: any): any {
  try {
    switch (fileType.toLowerCase()) {
      case 'json':
        return JSON.parse(content);
      case 'yaml':
      case 'yml':
        // 简单的YAML解析（实际项目中应使用专门的YAML解析库）
        return parseYAML(content);
      case 'csv':
        return parseCSV(content, options?.delimiter || ',');
      case 'xml':
        return parseXML(content);
      default:
        throw new Error(`不支持的文件类型: ${fileType}`);
    }
  } catch (error) {
    throw new Error(`解析文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 简单的YAML解析函数（仅支持基本功能）
function parseYAML(yaml: string): any {
  const result: any = {};
  const lines = yaml.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex > 0) {
        const key = trimmedLine.substring(0, colonIndex).trim();
        let value: string | boolean | number | null = trimmedLine.substring(colonIndex + 1).trim();
        
        // 尝试转换值的类型
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value === 'null') value = null;
        else if (!isNaN(Number(value))) value = Number(value);
        else if (value.startsWith('"') && value.endsWith('"') || 
                 value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
      
      result[key] = value;
    }
  }
  
  return result;
}

// 简单的CSV解析函数
function parseCSV(csv: string, delimiter: string): any[] {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(delimiter).map(header => header.trim());
  const result: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(value => value.trim());
    const row: any = {};
    
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] !== undefined ? values[j] : '';
    }
    
    result.push(row);
  }
  
  return result;
}

// 简单的XML解析函数
function parseXML(xml: string): any {
  // 在Worker中使用DOMParser解析XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'text/xml');
  
  // 检查解析错误
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML解析错误: ' + xmlDoc.documentElement.textContent);
  }
  
  return xmlToObject(xmlDoc.documentElement);
}

// 将XML节点转换为对象
function xmlToObject(node: Element): any {
  const result: any = {};
  
  // 获取节点属性
  if (node.attributes.length > 0) {
    result['@attributes'] = {};
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      result['@attributes'][attr.nodeName] = attr.nodeValue;
    }
  }
  
  // 获取子节点
  const children = node.childNodes;
  const childElements: Element[] = [];
  let textContent = '';
  
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 1) { // Element node
      childElements.push(child as Element);
    } else if (child.nodeType === 3) { // Text node
      textContent += child.textContent;
    }
  }
  
  // 处理文本内容
  if (textContent.trim() && childElements.length === 0) {
    return textContent.trim();
  }
  
  // 处理子元素
  if (childElements.length > 0) {
    // 检查是否有多个相同名称的子元素
    const elementNames = new Set(childElements.map(el => el.nodeName));
    
    for (const element of childElements) {
      const name = element.nodeName;
      const value = xmlToObject(element);
      
      if (!result[name]) {
        // 首次遇到该元素名
        if (elementNames.has(name) && childElements.filter(el => el.nodeName === name).length > 1) {
          // 多个相同名称的元素，使用数组
          result[name] = [value];
        } else {
          result[name] = value;
        }
      } else if (Array.isArray(result[name])) {
        // 已有数组，添加到数组中
        result[name].push(value);
      } else {
        // 已存在单个值，转换为数组
        result[name] = [result[name], value];
      }
    }
  }
  
  return result;
}

// 转换文件格式
function convertFile(parsedData: any, targetType: string, options?: any): string {
  try {
    switch (targetType.toLowerCase()) {
      case 'json':
        return JSON.stringify(parsedData, null, options?.indent || 2);
      case 'csv':
        return convertToCSV(parsedData, options?.delimiter || ',');
      case 'xml':
        return convertToXML(parsedData, options?.rootName || 'root');
      case 'yaml':
      case 'yml':
        return convertToYAML(parsedData);
      default:
        throw new Error(`不支持的目标格式: ${targetType}`);
    }
  } catch (error) {
    throw new Error(`转换文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 转换数据为CSV格式
function convertToCSV(data: any[], delimiter: string): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  // 获取所有唯一的键作为标题
  const headers = new Set<string>();
  data.forEach(row => {
    if (typeof row === 'object' && row !== null) {
      Object.keys(row).forEach(key => headers.add(key));
    }
  });
  
  const headerArray = Array.from(headers);
  const csvLines: string[] = [headerArray.join(delimiter)];
  
  // 添加数据行
  data.forEach(row => {
    if (typeof row === 'object' && row !== null) {
      const values = headerArray.map(header => {
        const value = row[header] === undefined ? '' : row[header];
        // 如果值包含分隔符或换行符，用引号包围
        const strValue = String(value);
        if (strValue.includes(delimiter) || strValue.includes('\n') || strValue.includes('"')) {
          return '"' + strValue.replace(/"/g, '""') + '"';
        }
        return strValue;
      });
      csvLines.push(values.join(delimiter));
    }
  });
  
  return csvLines.join('\n');
}

// 转换数据为XML格式
function convertToXML(data: any, rootName: string): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>`;
  
  function addElement(key: string, value: any): void {
    // 跳过属性
    if (key === '@attributes') {
      return;
    }
    
    xml += `\n  <${key}>`;
    
    if (value === null || value === undefined) {
      // 空元素
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        // 数组处理
        value.forEach((item: any) => {
          if (typeof item === 'object') {
            xml += `\n    <item>`;
            Object.entries(item).forEach(([k, v]) => addElement(k, v));
            xml += `\n    </item>`;
          } else {
            xml += `\n    <item>${escapeXML(String(item))}</item>`;
          }
        });
      } else {
        // 对象处理
        Object.entries(value).forEach(([k, v]) => addElement(k, v));
      }
    } else {
      // 基本类型
      xml += escapeXML(String(value));
    }
    
    xml += `</${key}>`;
  }
  
  Object.entries(data).forEach(([key, value]) => addElement(key, value));
  xml += `\n</${rootName}>`;
  
  return xml;
}

// 转换数据为YAML格式
function convertToYAML(data: any): string {
  const yamlLines: string[] = [];
  
  function addYAML(key: string, value: any, indent: number = 0): void {
    const prefix = ' '.repeat(indent);
    
    if (value === null) {
      yamlLines.push(`${prefix}${key}: null`);
    } else if (typeof value === 'boolean') {
      yamlLines.push(`${prefix}${key}: ${value ? 'true' : 'false'}`);
    } else if (typeof value === 'number') {
      yamlLines.push(`${prefix}${key}: ${value}`);
    } else if (typeof value === 'string') {
      yamlLines.push(`${prefix}${key}: "${value.replace(/"/g, '\\"')}"`);
    } else if (Array.isArray(value)) {
      yamlLines.push(`${prefix}${key}:`);
      value.forEach((item: any) => {
        if (typeof item === 'object') {
          yamlLines.push(`${prefix}  -`);
          Object.entries(item).forEach(([k, v]) => addYAML(k, v, indent + 4));
        } else {
          yamlLines.push(`${prefix}  - ${String(item)}`);
        }
      });
    } else if (typeof value === 'object') {
      yamlLines.push(`${prefix}${key}:`);
      Object.entries(value).forEach(([k, v]) => {
        if (k !== '@attributes') {
          addYAML(k, v, indent + 2);
        }
      });
    }
  }
  
  Object.entries(data).forEach(([key, value]) => addYAML(key, value));
  
  return yamlLines.join('\n');
}

// 转义XML特殊字符
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 验证文件内容
function validateFile(content: string, fileType: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    switch (fileType.toLowerCase()) {
      case 'json':
        JSON.parse(content);
        break;
      case 'yaml':
      case 'yml':
        parseYAML(content);
        break;
      case 'xml':
        parseXML(content);
        break;
      case 'csv':
        parseCSV(content, ',');
        break;
      default:
        errors.push(`不支持验证的文件类型: ${fileType}`);
    }
    
    return { valid: errors.length === 0, errors };
  } catch (error) {
    return { 
      valid: false, 
      errors: [`文件验证失败: ${error instanceof Error ? error.message : String(error)}`] 
    };
  }
}

// 批量处理文件
function processBatch(
  files: Array<{ content: string; type: string; name: string }>,
  action: 'parse' | 'convert' | 'validate',
  options?: any
): any[] {
  const results: any[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      let result: any;
      
      switch (action) {
        case 'parse':
          result = parseFile(file.content, file.type, options);
          break;
        case 'validate':
          result = validateFile(file.content, file.type);
          break;
        case 'convert':
          const parsed = parseFile(file.content, file.type, options);
          const targetType = options?.targetType || 'json';
          result = convertFile(parsed, targetType, options);
          break;
      }
      
      results.push({
        name: file.name,
        type: file.type,
        success: true,
        data: result
      });
    } catch (error) {
      results.push({
        name: file.name,
        type: file.type,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // 发送进度更新
    const progressMessage: ProgressUpdate = {
      type: 'PROGRESS',
      percentage: Math.round(((i + 1) / files.length) * 100),
      status: `处理文件 ${i + 1}/${files.length}`,
      fileIndex: i
    };
    self.postMessage(progressMessage);
  }
  
  return results;
}

// 监听来自主线程的消息
self.addEventListener('message', (event) => {
  const message = event.data;
  
  try {
    switch (message.type) {
      case 'PROCESS_FILE':
        const fileRequest = message as ProcessFileRequest;
        let result: any;
        
        switch (fileRequest.action) {
          case 'parse':
            result = parseFile(fileRequest.fileContent, fileRequest.fileType, fileRequest.options);
            break;
          case 'validate':
            result = validateFile(fileRequest.fileContent, fileRequest.fileType);
            break;
          case 'convert':
            const parsed = parseFile(fileRequest.fileContent, fileRequest.fileType, fileRequest.options);
            const targetType = fileRequest.options?.targetType || 'json';
            result = convertFile(parsed, targetType, fileRequest.options);
            break;
        }
        
        const resultMessage: ProcessResult = {
          type: 'RESULT',
          data: result
        };
        self.postMessage(resultMessage);
        break;
        
      case 'PROCESS_BATCH':
        const batchRequest = message as ProcessBatchRequest;
        const batchResults = processBatch(
          batchRequest.files,
          batchRequest.action,
          batchRequest.options
        );
        
        const batchResultMessage: ProcessResult = {
          type: 'RESULT',
          data: batchResults
        };
        self.postMessage(batchResultMessage);
        break;
        
      default:
        console.warn('未知的消息类型:', message.type);
    }
  } catch (error) {
    const errorMessage: ProcessResult = {
      type: 'RESULT',
      data: null,
      error: error instanceof Error ? error.message : String(error)
    };
    self.postMessage(errorMessage);
  }
});

// 导出Worker接口
export {};
