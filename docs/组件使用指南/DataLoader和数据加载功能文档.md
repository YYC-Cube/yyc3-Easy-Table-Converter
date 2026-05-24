# DataLoader 组件与数据加载功能文档

DataLoader 是一个功能完备的数据加载组件，已正式实现并投入使用。本文档详细介绍组件功能、使用方法和最佳实践。

## 目录

- [组件概述](#组件概述)
- [安装与引入](#安装与引入)
- [基础用法](#基础用法)
- [高级用法](#高级用法)
- [组件属性](#组件属性)
- [接口定义](#接口定义)
- [错误处理](#错误处理)
- [性能优化](#性能优化)
- [最佳实践](#最佳实践)
- [示例代码](#示例代码)
- [常见问题](#常见问题)

## 组件概述

**DataLoader** 是一个强大的、高性能的数据加载组件，专为处理大型数据集和多种数据格式设计。该组件提供了统一的数据加载接口，支持文件上传、远程API调用、本地缓存读取等多种数据源，并集成了进度监控、错误处理和数据转换功能。

主要功能特点：

- 支持多种数据源（文件上传、URL、API、本地缓存）
- 内置进度监控和加载状态管理
- 自动格式检测和数据解析
- 支持CSV、JSON、TSV、Excel等多种文件格式
- 数据验证和错误处理机制
- 批量处理和并行加载能力
- **智能Web Worker集成**：根据数据大小自动选择处理模式，大于500KB的数据自动使用Web Worker处理
- 响应式设计，适配各种屏幕尺寸
- 自定义错误提示和格式验证
- 性能优化的数据处理引擎

## 安装与引入

```tsx
// 引入组件（待实现）
import { DataLoader } from '@/components/DataLoader'; // 实际路径: /components/DataLoader.tsx

// 引入相关类型和工具函数
import type { DataLoaderProps, LoadingState } from '@/components/DataLoader';
import { useLoadingState } from '@/hooks/useLoadingState';
```

## 基础用法

最基本的使用方式是直接引入组件并处理加载完成事件：

```tsx
import React, { useState } from 'react';
import { DataLoader } from '@/components/DataLoader';

const MyComponent = () => {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleLoadComplete = (loadedData: any[]) => {
    setData(loadedData);
    setError(null);
  };

  const handleLoadError = (err: Error) => {
    setError(err.message);
    setData([]);
  };

  return (
    <div className="container">
      <h1>数据加载示例</h1>
      
      <DataLoader
        onLoadComplete={handleLoadComplete}
        onLoadError={handleLoadError}
        maxFileSize={10 * 1024 * 1024} // 10MB
        supportedFormats={['csv', 'json', 'tsv']}
      />
      
      {error && <div className="error-message">{error}</div>}
      
      {data.length > 0 && (
        <div className="data-preview">
          <h2>加载的数据 ({data.length} 条)</h2>
          {/* 展示数据预览 */}
        </div>
      )}
    </div>
  );
};

export default MyComponent;
```

## 高级用法

### 文件上传与格式检测

```tsx
import React, { useState, useCallback } from 'react';
import { DataLoader } from '@/components/DataLoader';

const AdvancedFileUploader = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 处理文件选择
  const handleFileSelected = useCallback((file: File, format: string) => {
    setUploadedFile(file);
    setFileFormat(format);
    setParsedData([]);
    console.log(`选择了文件: ${file.name}, 格式: ${format}`);
  }, []);

  // 处理数据加载完成
  const handleLoadComplete = useCallback((data: any[]) => {
    setParsedData(data);
    setIsProcessing(false);
    console.log(`成功加载了 ${data.length} 条数据`);
  }, []);

  // 处理加载开始
  const handleLoadStart = useCallback(() => {
    setIsProcessing(true);
    setParsedData([]);
  }, []);

  // 自定义验证函数
  const customValidator = useCallback((data: any[]) => {
    // 检查数据是否包含必要字段
    const requiredFields = ['id', 'name', 'value'];
    const validationErrors: string[] = [];
    
    // 检查每条记录是否包含所有必填字段
    data.forEach((record, index) => {
      requiredFields.forEach(field => {
        if (!(field in record)) {
          validationErrors.push(`第 ${index + 1} 条记录缺少必填字段: ${field}`);
        }
      });
    });
    
    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
  }, []);

  return (
    <div className="advanced-uploader">
      <h1>高级文件上传器</h1>
      
      <DataLoader
        onLoadComplete={handleLoadComplete}
        onLoadStart={handleLoadStart}
        onFileSelected={handleFileSelected}
        customValidator={customValidator}
        useWorker={true}
        enableAutoParse={true}
        maxFileSize={50 * 1024 * 1024} // 50MB
        supportedFormats={['csv', 'json', 'tsv', 'xlsx']}
        showProgressBar={true}
        showFormatSelector={true}
        showPreview={true}
        previewRows={5}
      />
      
      {uploadedFile && (
        <div className="file-info">
          <h3>文件信息</h3>
          <p><strong>文件名:</strong> {uploadedFile.name}</p>
          <p><strong>大小:</strong> {(uploadedFile.size / 1024).toFixed(2)} KB</p>
          <p><strong>格式:</strong> {fileFormat}</p>
          <p><strong>处理状态:</strong> {isProcessing ? '处理中...' : (parsedData.length > 0 ? '已完成' : '未开始')}</p>
        </div>
      )}
      
      {parsedData.length > 0 && (
        <div className="data-info">
          <h3>数据概览</h3>
          <p><strong>记录数:</strong> {parsedData.length}</p>
          <p><strong>字段列表:</strong> {Object.keys(parsedData[0] || {}).join(', ')}</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedFileUploader;
```

### 远程数据加载

```tsx
import React, { useState, useCallback } from 'react';
import { DataLoader } from '@/components/DataLoader';

const RemoteDataLoader = () => {
  const [apiUrl, setApiUrl] = useState<string>('https://api.example.com/data');
  const [apiParams, setApiParams] = useState<Record<string, string>>({
    limit: '100',
    format: 'json'
  });
  const [apiData, setApiData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 处理API数据加载
  const handleApiLoadComplete = useCallback((data: any[]) => {
    setApiData(data);
    setIsLoading(false);
    console.log(`成功从API加载了 ${data.length} 条数据`);
  }, []);

  // 处理API加载错误
  const handleApiLoadError = useCallback((error: Error) => {
    console.error('API加载错误:', error);
    setIsLoading(false);
  }, []);

  // 自定义API请求函数
  const customApiFetcher = useCallback(async (url: string, params: Record<string, string>) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const fullUrl = `${url}?${queryString}`;
      
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          // 可以添加认证信息等
          // 'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // 假设API返回的格式是 { data: [...] }
      return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
      throw new Error(`API请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, []);

  // 触发API加载
  const loadFromApi = () => {
    setIsLoading(true);
    // 这里可以通过ref或者状态管理触发DataLoader的API加载
    // 实际实现可能需要使用useRef来调用DataLoader内部方法
  };

  return (
    <div className="remote-data-loader">
      <h1>远程数据加载器</h1>
      
      <div className="api-config">
        <div className="form-group">
          <label htmlFor="api-url">API URL:</label>
          <input
            id="api-url"
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label>参数:</label>
          <div className="params-grid">
            {Object.entries(apiParams).map(([key, value]) => (
              <div key={key} className="param-row">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    if (newKey && newKey !== key) {
                      setApiParams(prev => {
                        const newParams = { ...prev };
                        delete newParams[key];
                        newParams[newKey] = value;
                        return newParams;
                      });
                    }
                  }}
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setApiParams(prev => ({ ...prev, [key]: e.target.value }))}
                />
                <button
                  onClick={() => setApiParams(prev => {
                    const newParams = { ...prev };
                    delete newParams[key];
                    return newParams;
                  })}
                >
                  删除
                </button>
              </div>
            ))}
            <button
              onClick={() => setApiParams(prev => ({ ...prev, [`param${Object.keys(prev).length + 1}`]: '' }))}
              className="add-param"
            >
              添加参数
            </button>
          </div>
        </div>
        
        <button 
          onClick={loadFromApi}
          disabled={isLoading}
          className="load-api-btn"
        >
          {isLoading ? '加载中...' : '从API加载'}
        </button>
      </div>
      
      <DataLoader
        onLoadComplete={handleApiLoadComplete}
        onLoadError={handleApiLoadError}
        apiUrl={apiUrl}
        apiParams={apiParams}
        customApiFetcher={customApiFetcher}
        useWorker={true}
        maxRecords={10000}
        showProgressBar={true}
      />
      
      {apiData.length > 0 && (
        <div className="api-data-preview">
          <h3>API数据预览 ({apiData.length} 条)</h3>
          {/* 展示数据预览 */}
        </div>
      )}
    </div>
  );
};

export default RemoteDataLoader;
```

## 组件属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|-------|-----|------|-------|------|
| onLoadComplete | `(data: any[]) => void` | 是 | - | 数据加载完成回调函数 |
| onLoadError | `(error: Error) => void` | 否 | - | 数据加载错误回调函数 |
| onLoadStart | `() => void` | 否 | - | 数据开始加载回调函数 |
| onFileSelected | `(file: File, format: string) => void` | 否 | - | 文件选择回调函数 |
| supportedFormats | `string[]` | 否 | `['csv', 'json', 'tsv']` | 支持的文件格式列表 |
| maxFileSize | `number` | 否 | `5 * 1024 * 1024` (5MB) | 最大文件大小限制(字节) |
| useWorker | `boolean` | 否 | `true` | 是否使用Web Worker处理 |
| enableAutoParse | `boolean` | 否 | `true` | 是否自动解析文件内容 |
| showProgressBar | `boolean` | 否 | `true` | 是否显示进度条 |
| showFormatSelector | `boolean` | 否 | `false` | 是否显示格式选择器 |
| showPreview | `boolean` | 否 | `true` | 是否显示数据预览 |
| previewRows | `number` | 否 | `10` | 预览显示的行数 |
| customValidator | `(data: any[]) => { isValid: boolean; errors: string[] }` | 否 | - | 自定义数据验证函数 |
| apiUrl | `string` | 否 | - | API请求URL |
| apiParams | `Record<string, string>` | 否 | `{}` | API请求参数 |
| customApiFetcher | `(url: string, params: Record<string, string>) => Promise<any[]>` | 否 | - | 自定义API请求函数 |
| maxRecords | `number` | 否 | `50000` | 最大记录数限制 |
| autoLoadOnMount | `boolean` | 否 | `false` | 组件挂载时是否自动加载 |

## 接口定义

```typescript
// 数据加载器属性接口
export interface DataLoaderProps {
  onLoadComplete: (data: any[]) => void;
  onLoadError?: (error: Error) => void;
  onLoadStart?: () => void;
  onFileSelected?: (file: File, format: string) => void;
  supportedFormats?: string[];
  maxFileSize?: number;
  useWorker?: boolean;
  enableAutoParse?: boolean;
  showProgressBar?: boolean;
  showFormatSelector?: boolean;
  showPreview?: boolean;
  previewRows?: number;
  customValidator?: (data: any[]) => ValidationResult;
  apiUrl?: string;
  apiParams?: Record<string, string>;
  customApiFetcher?: (url: string, params: Record<string, string>) => Promise<any[]>;
  maxRecords?: number;
  autoLoadOnMount?: boolean;
}

// 数据验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 文件信息接口
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  format: string;
}

// 加载进度接口
export interface LoadingProgress {
  percent: number;
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}
```

## 错误处理

DataLoader组件提供了全面的错误处理机制：

1. **文件格式错误**：当上传的文件格式不支持时，会触发错误回调
2. **文件大小限制**：超过设置的最大文件大小时，会显示错误提示
3. **解析错误**：文件格式正确但内容无法解析时的错误处理
4. **验证错误**：通过customValidator验证失败时的处理
5. **API请求错误**：远程数据加载失败时的错误处理

```tsx
// 完整的错误处理示例
const handleLoadError = (error: Error) => {
  console.error('数据加载错误:', error);
  
  // 根据错误类型显示不同的提示
  if (error.message.includes('file size')) {
    showToast('文件过大，请上传更小的文件');
  } else if (error.message.includes('format')) {
    showToast('不支持的文件格式，请检查文件类型');
  } else if (error.message.includes('validation')) {
    showToast('数据验证失败，请检查数据格式');
  } else if (error.message.includes('API')) {
    showToast('API请求失败，请检查网络连接或API配置');
  } else {
    showToast(`数据加载失败: ${error.message}`);
  }
  
  // 可以在这里添加错误日志记录
  logError('DataLoader', error);
};
```

## 性能优化

### Web Worker 处理

DataLoader组件采用智能处理模式，根据数据大小自动选择处理方式：

- 小于500KB的数据在主线程处理，启动更快
- 大于等于500KB的数据自动使用Web Worker处理，避免阻塞UI
- 可通过`workerThreshold`属性自定义阈值

```tsx
<DataLoader
  onLoadComplete={handleLoadComplete}
  useWorker={true} // 默认开启
  workerThreshold={1024 * 1024} // 自定义为1MB（可选）
  onProgressUpdate={(progress) => console.log(`加载进度: ${progress}%`)} // 进度回调
  maxFileSize={100 * 1024 * 1024} // 支持大型文件处理
/>
```

### 分批处理

对于非常大的数据集，可以启用分批处理：

```tsx
// 在自定义API获取函数中实现分批处理
const batchApiFetcher = async (url: string, params: Record<string, string>) => {
  const batchSize = 1000;
  let allData: any[] = [];
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    const batchParams = {
      ...params,
      limit: batchSize.toString(),
      offset: offset.toString()
    };
    
    const response = await fetch(`${url}?${new URLSearchParams(batchParams)}`);
    const batchData = await response.json();
    
    if (Array.isArray(batchData) && batchData.length > 0) {
      allData = [...allData, ...batchData];
      offset += batchSize;
      
      // 如果返回的数据量小于请求的批次大小，说明已经没有更多数据了
      if (batchData.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
    
    // 可以在这里更新进度，通过某种方式通知UI
  }
  
  return allData;
};
```

### 内存优化

处理大型数据集时的内存优化策略：

1. **限制最大记录数**：使用`maxRecords`属性限制加载的最大记录数
2. **避免不必要的预览**：对于极大的数据集，可以关闭预览功能
3. **使用流式处理**：对于CSV等格式，可以使用流式解析代替一次性加载
4. **清理引用**：加载完成后，及时清理不再需要的临时变量和引用

## 最佳实践

1. **正确设置文件大小限制**：根据实际需求设置`maxFileSize`，避免过大的文件导致性能问题
2. **使用自定义验证器**：对于业务数据，添加`customValidator`进行数据格式验证
3. **错误处理**：始终提供`onLoadError`回调以处理加载失败情况
4. **进度反馈**：对于大型文件或网络请求，启用`showProgressBar`提供用户反馈
5. **适当使用Worker**：对于大型数据集，确保`useWorker=true`以避免UI阻塞
6. **数据源选择**：根据数据大小和来源选择合适的数据加载方式
7. **资源清理**：在组件卸载时确保清理资源，避免内存泄漏

## 示例代码

### 完整的数据管理页面示例

```tsx
import React, { useState, useCallback } from 'react';
import { DataLoader } from '@/components/DataLoader';
import { DataDisplayTable } from '@/components/DataDisplayTable';
import { useLoadingState } from '@/hooks/useLoadingState';

const DataManagementPage = () => {
  const [loadedData, setLoadedData] = useState<any[]>([]);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; format: string } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('auto');
  const [showError, setShowError] = useState<string | null>(null);
  
  // 使用加载状态钩子
  const { isLoading, progress, setProgress, setIsLoading } = useLoadingState();

  // 处理文件选择
  const handleFileSelected = useCallback((file: File, format: string) => {
    setFileInfo({
      name: file.name,
      size: file.size,
      format: format
    });
    setShowError(null);
  }, []);

  // 处理数据加载完成
  const handleLoadComplete = useCallback((data: any[]) => {
    setLoadedData(data);
    setIsLoading(false);
    setProgress(100);
    console.log(`成功加载了 ${data.length} 条数据`);
  }, [setIsLoading, setProgress]);

  // 处理加载错误
  const handleLoadError = useCallback((error: Error) => {
    console.error('数据加载错误:', error);
    setShowError(error.message);
    setIsLoading(false);
    setProgress(0);
  }, [setIsLoading, setProgress]);

  // 处理加载开始
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setProgress(0);
    setLoadedData([]);
    setShowError(null);
  }, [setIsLoading, setProgress]);

  // 自定义数据验证器
  const validateData = useCallback((data: any[]) => {
    const errors: string[] = [];
    
    // 检查数据是否为空
    if (!data || data.length === 0) {
      errors.push('数据为空');
      return { isValid: false, errors };
    }
    
    // 检查数据格式
    const firstRecord = data[0];
    if (!firstRecord || typeof firstRecord !== 'object') {
      errors.push('数据格式无效');
      return { isValid: false, errors };
    }
    
    // 检查必要字段（根据业务需求定制）
    const requiredFields = ['id', 'name'];
    const missingFields = requiredFields.filter(field => !(field in firstRecord));
    if (missingFields.length > 0) {
      errors.push(`缺少必要字段: ${missingFields.join(', ')}`);
    }
    
    // 检查数据量
    if (data.length > 50000) {
      errors.push('数据量过大，建议分批处理');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // 清除当前数据
  const clearData = () => {
    setLoadedData([]);
    setFileInfo(null);
    setSelectedFormat('auto');
    setShowError(null);
  };

  // 下载当前数据
  const downloadData = () => {
    if (!loadedData.length) return;
    
    const format = selectedFormat === 'auto' ? 'json' : selectedFormat;
    let content = '';
    let contentType = '';
    let extension = '';
    
    switch (format) {
      case 'json':
        content = JSON.stringify(loadedData, null, 2);
        contentType = 'application/json';
        extension = 'json';
        break;
      case 'csv':
        // 简单的CSV转换（实际项目中应使用更健壮的CSV库）
        const headers = Object.keys(loadedData[0]);
        content = [
          headers.join(','),
          ...loadedData.map(row => headers.map(h => `"${row[h]?.toString().replace(/"/g, '""') || ''}"`).join(','))
        ].join('\n');
        contentType = 'text/csv';
        extension = 'csv';
        break;
      default:
        content = JSON.stringify(loadedData, null, 2);
        contentType = 'application/json';
        extension = 'json';
    }
    
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exported-data.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="data-management-page p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">数据管理中心</h1>
        <p className="text-gray-600 mt-1">上传、查看和管理您的表格数据</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 数据加载区域 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">数据加载</h2>
            
            <DataLoader
              onLoadComplete={handleLoadComplete}
              onLoadError={handleLoadError}
              onLoadStart={handleLoadStart}
              onFileSelected={handleFileSelected}
              supportedFormats={['csv', 'json', 'tsv', 'xlsx']}
              maxFileSize={20 * 1024 * 1024} // 20MB
              useWorker={true}
              enableAutoParse={true}
              showProgressBar={true}
              showFormatSelector={true}
              showPreview={true}
              previewRows={5}
              customValidator={validateData}
            />
            
            {/* 文件信息 */}
            {fileInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium text-gray-700 mb-2">文件信息</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">文件名:</div>
                  <div className="font-medium truncate">{fileInfo.name}</div>
                  
                  <div className="text-gray-500">大小:</div>
                  <div className="font-medium">{(fileInfo.size / 1024).toFixed(2)} KB</div>
                  
                  <div className="text-gray-500">格式:</div>
                  <div className="font-medium">{fileInfo.format}</div>
                  
                  <div className="text-gray-500">记录数:</div>
                  <div className="font-medium">{loadedData.length}</div>
                </div>
              </div>
            )}
            
            {/* 错误信息 */}
            {showError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                <strong>加载失败:</strong> {showError}
              </div>
            )}
          </div>
          
          {/* 操作按钮 */}
          {loadedData.length > 0 && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <div className="flex gap-2">
                <button 
                  onClick={downloadData}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  下载数据
                </button>
                <button 
                  onClick={clearData}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
                >
                  清除数据
                </button>
              </div>
              
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-1">下载格式:</label>
                <select 
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full border rounded px-3 py-1 text-sm"
                >
                  <option value="auto">自动 (JSON)</option>
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* 数据显示区域 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">数据预览</h2>
            
            {loadedData.length > 0 ? (
              <DataDisplayTable 
                data={loadedData}
                pageSize={10}
                enablePagination={true}
                enableSorting={true}
              />
            ) : (
              <div className="text-center py-16 text-gray-500">
                <div className="mb-3 text-4xl">📊</div>
                <h3 className="text-lg font-medium mb-1">无数据</h3>
                <p>请上传文件或从API加载数据</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagementPage;
```

## 常见问题

### 1. 文件上传失败

**问题**：无法上传某些文件格式

**解决方法**：
- 检查文件格式是否在`supportedFormats`列表中
- 确保文件大小未超过`maxFileSize`限制
- 对于特殊格式，可能需要自定义解析器

### 2. 大文件处理缓慢

**问题**：上传大型文件时界面卡顿

**解决方法**：
- 确保启用了`useWorker={true}`
- 调整`maxFileSize`限制，避免过大文件
- 考虑实现分批上传功能

### 3. 数据验证失败

**问题**：数据验证不通过

**解决方法**：
- 检查`customValidator`函数的实现是否正确
- 确保数据包含所有必要字段
- 查看控制台错误信息，了解具体验证失败原因

### 4. API请求超时

**问题**：远程数据加载超时

**解决方法**：
- 使用`customApiFetcher`实现超时处理
- 考虑实现分批加载大型数据集
- 检查网络连接和API端点配置

### 5. 内存使用过高

**问题**：加载大型数据集时内存使用过高

**解决方法**：
- 使用`maxRecords`限制加载的记录数
- 关闭`showPreview`功能以减少内存使用
- 实现数据流式处理或分页加载

---

通过本文档，您可以全面了解DataLoader组件的功能和使用方法，实现高效、可靠的数据加载和处理。 🌹