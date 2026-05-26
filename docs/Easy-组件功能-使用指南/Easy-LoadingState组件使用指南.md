# LoadingState组件使用指南

## 1. 组件概述

`LoadingState`是一个功能丰富的加载状态组件，提供优雅的数据加载反馈，支持多种展示模式、进度显示和操作类型。该组件适用于各种异步操作场景，如数据加载、处理、导入导出等，能够显著提升用户体验。

**主要特性**：
- 多种展示模式：紧凑模式、内联模式、全屏模式
- 丰富的操作类型和对应图标
- 平滑的进度动画
- 最小显示时间确保界面稳定性
- 表格骨架屏支持
- 加载状态管理钩子

## 2. 安装与引入

### 2.1 引入组件

```tsx
import { LoadingState, TableLoadingSkeleton, useLoadingIndicator } from '@/components/LoadingState';
// 实际路径: /components/LoadingState.tsx
```

## 3. 基础用法

### 3.1 简单加载状态

最基础的使用方式，展示默认的加载状态：

```tsx
import { useState } from 'react';
import { LoadingState } from '@/components/LoadingState'; // 实际路径: /components/LoadingState.tsx

const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await api.fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchData} disabled={isLoading}>
        {isLoading ? '加载中...' : '加载数据'}
      </button>
      <LoadingState isLoading={isLoading} />
    </div>
  );
};
```

### 3.2 指定操作类型

通过`operation`属性指定不同的操作类型，组件会自动使用对应的图标和默认消息：

```tsx
<LoadingState 
  isLoading={isProcessing} 
  operation="processing" 
  message="正在处理大数据集..." 
/>
```

**支持的操作类型**：
- `loading`: 加载数据
- `processing`: 处理数据  
- `saving`: 保存数据
- `exporting`: 导出数据
- `importing`: 导入数据
- `sorting`: 排序数据
- `filtering`: 筛选数据

### 3.3 显示进度

对于可以计算进度的操作，可以使用`progress`属性显示具体进度：

```tsx
import { useState, useEffect } from 'react';
import { LoadingState } from '@/components/LoadingState';

const ProgressExample = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async () => {
    setIsUploading(true);
    setProgress(0);
    
    // 模拟上传进度
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  return (
    <div>
      <button onClick={uploadFile} disabled={isUploading}>
        上传文件
      </button>
      <LoadingState 
        isLoading={isUploading}
        operation="importing"
        progress={progress}
        showProgress={true}
      />
    </div>
  );
};
```

## 4. 高级用法

### 4.1 不同展示模式

#### 4.1.1 紧凑模式

适用于需要在较小空间内展示加载状态：

```tsx
<LoadingState 
  isLoading={isLoading}
  operation="sorting"
  compact={true}
/>
```

#### 4.1.2 全屏模式

适用于重要的、可能耗时较长的操作，提供更好的视觉反馈：

```tsx
<LoadingState 
  isLoading={isLargeOperation}
  operation="processing"
  message="正在处理百万级数据，请稍候..."
  fullScreen={true}
  minDuration={1000}
/>
```

### 4.2 表格骨架屏

使用`TableLoadingSkeleton`组件为表格数据加载提供骨架屏：

```tsx
import { useState } from 'react';
import { TableLoadingSkeleton } from '@/components/LoadingState'; // 实际路径: /components/LoadingState.tsx

const TableComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchTableData();
      setTableData(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border">
      {isLoading ? (
        <TableLoadingSkeleton columns={6} rows={10} />
      ) : (
        <table>
          {/* 表格内容 */}
        </table>
      )}
    </div>
  );
};
```

### 4.3 使用加载状态管理钩子

`useLoadingIndicator`钩子提供了便捷的加载状态管理：

```tsx
import { useLoadingIndicator } from '@/components/LoadingState'; // 实际路径: /components/LoadingState.tsx

const ComplexOperation = () => {
  const { loadingState, startLoading, updateProgress, stopLoading } = useLoadingIndicator();

  const performComplexOperation = async () => {
    startLoading('processing', '执行复杂数据转换...');
    
    try {
      // 模拟进度更新
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        updateProgress(i);
      }
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      stopLoading();
    }
  };

  return (
    <div>
      <button onClick={performComplexOperation}>
        执行操作
      </button>
      <LoadingState 
        isLoading={loadingState.isLoading}
        operation={loadingState.operation}
        message={loadingState.message}
        progress={loadingState.progress}
        fullScreen={true}
      />
    </div>
  );
};
```

## 5. 组件属性

### 5.1 LoadingState属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isLoading` | `boolean` | `false` | 是否显示加载状态 |
| `message` | `string` | 根据operation自动设置 | 加载提示消息 |
| `operation` | `string` | `'loading'` | 操作类型：loading, processing, saving, exporting, importing, sorting, filtering |
| `progress` | `number` | `undefined` | 进度值(0-100) |
| `showProgress` | `boolean` | `true` | 是否显示进度条 |
| `compact` | `boolean` | `false` | 是否使用紧凑模式 |
| `fullScreen` | `boolean` | `false` | 是否使用全屏模式 |
| `minDuration` | `number` | `300` | 最小显示时间(毫秒)，防止闪烁 |

### 5.2 TableLoadingSkeleton属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `columns` | `number` | `5` | 骨架屏的列数 |
| `rows` | `number` | `8` | 骨架屏的行数 |

### 5.3 useLoadingIndicator钩子返回值

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `loadingState` | `object` | 包含当前加载状态的对象 |
| `startLoading` | `function` | 开始加载的方法，接收operation和可选的message |
| `updateProgress` | `function` | 更新进度的方法，接收progress值 |
| `stopLoading` | `function` | 停止加载的方法 |

## 6. 最佳实践

### 6.1 何时使用不同模式

- **内联模式**：用于组件内部的加载状态
- **紧凑模式**：用于按钮旁或小区域的加载提示
- **全屏模式**：用于全局操作或耗时较长的操作
- **骨架屏**：用于表格或列表数据的加载预览

### 6.2 性能优化建议

- 对于快速操作，设置`minDuration`避免UI闪烁
- 避免在短时间内频繁切换loading状态
- 对于非常复杂的操作，使用`fullScreen`模式并提供详细的进度信息

### 6.3 常见使用场景

#### 6.3.1 数据导入导出

```tsx
<LoadingState 
  isLoading={isExporting}
  operation="exporting"
  progress={exportProgress}
  message="正在导出CSV文件..."
  fullScreen={true}
/>
```

#### 6.3.2 大数据处理

```tsx
<LoadingState 
  isLoading={isProcessing}
  operation="processing"
  progress={processProgress}
  message="正在处理百万级数据，预计需要30秒..."
  fullScreen={true}
  minDuration={2000}
/>
```

#### 6.3.3 表格数据加载

```tsx
<div className="space-y-4">
  <h2>数据表格</h2>
  {isLoading ? (
    <TableLoadingSkeleton columns={7} rows={12} />
  ) : (
    <TableView data={tableData} columns={columns} />
  )}
</div>
```

## 7. 示例代码

### 7.1 完整的表单提交示例

```tsx
import { useState } from 'react';
import { LoadingState } from '@/components/LoadingState';

const FormExample = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ /* 表单数据 */ });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await submitFormData(formData);
      // 显示成功提示
    } catch (error) {
      // 显示错误提示
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">数据提交表单</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 表单字段 */}
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary text-white py-2 px-4 rounded"
        >
          {isSubmitting ? (
            <LoadingState 
              isLoading={true}
              compact={true}
              message="提交中..."
            />
          ) : (
            '提交数据'
          )}
        </button>
      </form>
    </div>
  );
};
```

### 7.2 带进度的文件上传

```tsx
import { useState } from 'react';
import { LoadingState } from '@/components/LoadingState';

const FileUploadExample = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // 创建上传任务
    const uploadTask = uploadFileToServer(selectedFile, (progress) => {
      setUploadProgress(progress);
    });
    
    try {
      await uploadTask;
      // 处理上传成功
    } catch (error) {
      // 处理上传失败
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input 
          type="file" 
          onChange={handleFileChange} 
          disabled={isUploading}
        />
        <p className="text-sm text-muted-foreground mt-1">
          {selectedFile ? selectedFile.name : '请选择文件'}
        </p>
      </div>
      
      <button 
        onClick={handleUpload} 
        disabled={!selectedFile || isUploading}
      >
        上传文件
      </button>
      
      <LoadingState 
        isLoading={isUploading}
        operation="importing"
        progress={uploadProgress}
        message={`正在上传文件: ${selectedFile?.name || ''}`}
        showProgress={true}
      />
    </div>
  );
};
```

## 8. 常见问题解答

### 8.1 Q: 为什么加载状态会出现闪烁？
**A:** 设置合适的`minDuration`值（建议至少300ms），确保加载状态有足够的显示时间，避免快速切换导致的闪烁。

### 8.2 Q: 如何自定义加载图标？
**A:** 当前版本使用预定义的操作类型对应的图标。如需自定义，您可以在`operationIcons`对象中扩展新的操作类型。

### 8.3 Q: 全屏模式会影响页面交互吗？
**A:** 是的，全屏模式使用了固定定位和半透明背景，可以防止用户在操作完成前进行其他交互，适合重要的、需要用户等待的操作。

### 8.4 Q: 如何在多个组件间共享加载状态？
**A:** 可以使用Context API或状态管理库（如Redux、Zustand）来管理全局加载状态，或者使用`useLoadingIndicator`钩子并通过props向下传递。

---

保持代码健康，稳步前行！ 🌹