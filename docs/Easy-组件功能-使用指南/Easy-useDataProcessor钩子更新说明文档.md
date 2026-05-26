# useDataProcessor 钩子更新说明文档

## 文档信息

```
@file useDataProcessor 钩子更新说明文档
@description 详细介绍 useDataProcessor 钩子的功能、更新内容和使用方法
@module hooks
@author YYC
@version 2.0.0
@created 2024-11-24
@updated 2024-11-24
```

## 1. 概述

`useDataProcessor` 是一个强大的数据处理 React Hook，提供了基于 Web Worker 的高性能数据处理和自动优化能力。在最新的 2.0.0 版本中，我们对钩子进行了全面升级，增加了数据特征分析、智能优化建议和自动降级机制等功能，使其更加健壮和高效。

## 2. 更新内容

### 2.1 新增功能

| 功能 | 描述 | 影响 |
|------|------|------|
| **数据特征分析** | 通过 `profileData` 方法分析数据集特征，包括行列数、数据大小、空列检测等 | 提供数据洞察，支持后续优化决策 |
| **智能优化建议** | 基于数据特征自动生成优化建议，如虚拟滚动、数据压缩等 | 指导开发者进行性能优化 |
| **自动优化功能** | 通过 `optimizeData` 方法实现数据的智能优化 | 直接提升数据处理效率和应用性能 |
| **自动降级机制** | 当 Web Worker 不可用时自动降级到主线程处理 | 增强应用稳定性和兼容性 |
| **小数据集优化** | 自动检测小数据集并直接在主线程处理以提高性能 | 提升响应速度，避免不必要的 Worker 开销 |
| **Worker 健康监控** | 监控 Worker 失败次数，超过阈值自动降级 | 提高应用的健壮性和容错能力 |
| **实时内存监控** | 监控应用内存使用情况，提供内存使用量指标 | 帮助识别内存使用峰值，支持优化决策 |
| **基于内存的智能降级** | 根据内存使用情况自动调整处理策略 | 防止内存溢出，提高应用稳定性 |
| **数据规模自适应处理** | 根据数据规模自动选择最适合的处理模式 | 优化不同规模数据的处理性能 |

### 2.2 接口变更

#### 2.2.1 返回值扩展

在 2.0.0 版本中，`useDataProcessor` 返回的接口进行了扩展，新增了以下方法和状态：

```typescript
// 新增方法
profileData: (data: any[]) => Promise<DataProfile>;  // 数据特征分析
optimizeData: (data: any[], optimizationTypes: string[]) => Promise<any>;  // 数据优化

// 新增状态
isWorkerAvailable: boolean;  // Worker 是否可用
memoryUsage: number;  // 当前内存使用量（MB）
```

#### 2.2.2 数据特征分析结果

```typescript
interface DataProfile {
  rowCount: number;  // 行数
  columnCount: number;  // 列数
  cellCount: number;  // 单元格总数
  sizeInBytes: number;  // 数据大小（字节）
  hasEmptyColumns: boolean;  // 是否有空列
  hasMixedTypes: boolean;  // 是否有混合数据类型
  hasLongStrings: boolean;  // 是否有长字符串
  recommendations: OptimizationRecommendation[];  // 优化建议列表
}
```

#### 2.2.3 优化建议类型

```typescript
interface OptimizationRecommendation {
  type: 'VIRTUAL_SCROLL' | 'WEB_WORKER' | 'DATA_COMPRESSION' | 'EMPTY_COLUMNS_REMOVAL' | 'TYPE_OPTIMIZATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';  // 严重性级别
  description: string;  // 建议描述
  estimatedImpact: string;  // 估计影响
}
```

## 3. 使用方法

### 3.1 基础用法

```tsx
import { useDataProcessor } from '@/hooks/useDataProcessor';
// 实际路径: /hooks/useDataProcessor.ts

function DataProcessingComponent() {
  const { processData, isProcessing, error, processingTime } = useDataProcessor();

  const handleSort = async () => {
    try {
      const sortedData = await processData(
        yourDataArray,
        'SORT',
        { field: 'name', direction: 'asc' }
      );
      // 处理排序后的数据
    } catch (err) {
      // 错误处理
    }
  };

  return (
    <div>
      <button onClick={handleSort} disabled={isProcessing}>
        排序数据
      </button>
      {isProcessing && <p>处理中...</p>}
      {error && <p className="error">{error}</p>}
      {processingTime > 0 && <p>处理时间: {processingTime.toFixed(2)}ms</p>}
    </div>
  );
}
```

### 3.2 数据特征分析

```tsx
import { useDataProcessor } from '@/hooks/useDataProcessor';

function DataAnalyzer() {
  const { profileData, dataProfile, isProcessing, error } = useDataProcessor();

  const analyzeData = async () => {
    try {
      const profile = await profileData(yourDataArray);
      console.log('数据特征:', profile);
    } catch (err) {
      // 错误处理
    }
  };

  return (
    <div>
      <button onClick={analyzeData} disabled={isProcessing}>
        分析数据特征
      </button>
      
      {dataProfile && (
        <div className="data-profile">
          <h3>数据特征分析结果</h3>
          <p>行数: {dataProfile.rowCount}</p>
          <p>列数: {dataProfile.columnCount}</p>
          <p>单元格总数: {dataProfile.cellCount}</p>
          <p>数据大小: {(dataProfile.sizeInBytes / 1024).toFixed(2)} KB</p>
          
          {dataProfile.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>优化建议:</h4>
              <ul>
                {dataProfile.recommendations.map((rec, index) => (
                  <li key={index} className={`severity-${rec.severity.toLowerCase()}`}>
                    <strong>{rec.description}</strong> ({rec.estimatedImpact})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 3.3 数据优化

```tsx
import { useDataProcessor } from '@/hooks/useDataProcessor';

function DataOptimizerComponent() {
  const { profileData, optimizeData, isProcessing, error } = useDataProcessor();

  const optimizeDataset = async () => {
    try {
      // 先分析数据特征
      const profile = await profileData(yourDataArray);
      
      // 收集优化类型
      const optimizationTypes: string[] = [];
      if (profile.hasEmptyColumns) {
        optimizationTypes.push('EMPTY_COLUMNS_REMOVAL');
      }
      if (profile.hasMixedTypes || profile.hasLongStrings) {
        optimizationTypes.push('TYPE_OPTIMIZATION');
      }
      
      // 执行优化
      const optimizedData = await optimizeData(yourDataArray, optimizationTypes);
      // 使用优化后的数据
    } catch (err) {
      // 错误处理
    }
  };

  return (
    <div>
      <button onClick={optimizeDataset} disabled={isProcessing}>
        优化数据
      </button>
      {isProcessing && <p>优化中...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### 3.4 完整集成示例

```tsx
import { useState } from 'react';
import { useDataProcessor } from '@/hooks/useDataProcessor';

function DataProcessingApp() {
  const [data, setData] = useState<any[]>([]);
  const [optimizedData, setOptimizedData] = useState<any[]>([]);
  
  const {
    profileData,
    optimizeData,
    processData,
    isProcessing,
    error,
    processingTime,
    dataProfile
  } = useDataProcessor();

  // 处理数据上传
  const handleUpload = async (fileContent: string) => {
    try {
      // 解析CSV数据
      const parsedData = await processData(fileContent, 'PARSE_DATA', { format: 'CSV' });
      setData(parsedData);
      
      // 自动分析数据特征
      await profileData(parsedData);
    } catch (err) {
      console.error('数据处理失败:', err);
    }
  };

  // 执行推荐的优化
  const applyRecommendations = async () => {
    if (!dataProfile) return;
    
    try {
      const optimizationTypes = dataProfile.recommendations
        .filter(rec => rec.severity === 'HIGH' || rec.severity === 'MEDIUM')
        .map(rec => rec.type);
      
      const result = await optimizeData(data, optimizationTypes);
      setOptimizedData(result);
    } catch (err) {
      console.error('优化失败:', err);
    }
  };

  return (
    <div className="data-app">
      <h1>数据处理与优化</h1>
      
      {/* 数据上传区域 */}
      <div className="upload-section">
        <FileUpload onFileUpload={handleUpload} />
      </div>
      
      {/* 数据特征分析结果 */}
      {dataProfile && (
        <div className="analysis-section">
          <h2>数据特征分析</h2>
          <div className="metrics">
            <div className="metric">
              <span className="label">行数:</span>
              <span className="value">{dataProfile.rowCount}</span>
            </div>
            <div className="metric">
              <span className="label">列数:</span>
              <span className="value">{dataProfile.columnCount}</span>
            </div>
            <div className="metric">
              <span className="label">数据大小:</span>
              <span className="value">{(dataProfile.sizeInBytes / 1024).toFixed(2)} KB</span>
            </div>
          </div>
          
          {dataProfile.recommendations.length > 0 && (
            <div className="recommendations">
              <h3>优化建议</h3>
              <div className="recommendation-list">
                {dataProfile.recommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    className={`recommendation severity-${rec.severity.toLowerCase()}`}
                  >
                    <div className="recommendation-type">{rec.type}</div>
                    <div className="recommendation-description">{rec.description}</div>
                    <div className="recommendation-impact">预计影响: {rec.estimatedImpact}</div>
                  </div>
                ))}
              </div>
              
              <button 
                className="optimize-button" 
                onClick={applyRecommendations}
                disabled={isProcessing}
              >
                应用推荐的优化
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* 优化结果 */}
      {optimizedData.length > 0 && (
        <div className="optimization-result">
          <h2>优化结果</h2>
          <p>处理时间: {processingTime.toFixed(2)}ms</p>
          <p>优化后行数: {optimizedData.length}</p>
          <p>优化后列数: {Object.keys(optimizedData[0] || {}).length}</p>
          
          <button 
            className="download-button"
            onClick={() => downloadData(optimizedData)}
          >
            下载优化后的数据
          </button>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
```

## 4. 自动降级与容错机制

### 4.1 降级策略

`useDataProcessor` 钩子实现了智能降级策略，在以下情况下会自动降级到主线程处理：

1. **Worker 创建失败**：当 Web Worker 无法创建时
2. **Worker 失败次数过多**：当 Worker 连续失败超过 3 次时
3. **小数据集优化**：当数据量小于 1000 个单元格且操作不是聚合操作时
4. **内存压力大**：当内存使用超过警告阈值时
5. **数据规模判断**：根据预设阈值（小、中、大数据集）自动选择处理方式

### 4.2 错误处理

钩子提供了完善的错误处理机制：

- 详细的错误信息存储在 `error` 状态中
- Worker 错误自动记录并计数
- 超时处理（30秒）确保不会无限期阻塞

## 5. 性能优化建议

### 5.1 推荐的使用模式

1. **数据量判断**：在调用处理方法前，根据数据量选择合适的处理方式
2. **批量处理**：对于大数据集，考虑分批处理而非一次性处理全部数据
3. **结果缓存**：对于频繁使用的处理结果，实现缓存机制减少重复计算
4. **预分析**：在处理大数据集前，先调用 `profileData` 分析数据特征，获取优化建议
5. **内存监控**：结合 `memoryUsage` 状态监控应用内存使用情况
6. **智能降级利用**：不必手动判断处理方式，充分利用内置的智能降级机制

### 5.2 最佳实践

1. **组件卸载时清理资源**：在组件卸载时调用 `cleanup` 方法释放 Worker 资源
   ```tsx
   useEffect(() => {
     return () => {
       cleanup();
     };
   }, [cleanup]);
   ```

2. **长时间操作显示进度**：对于大型数据集处理，结合 LoadingState 组件显示进度

3. **处理超时保护**：虽然钩子内置了超时处理，但对于特别复杂的操作，建议在调用方实现额外的超时逻辑

## 6. 兼容性注意事项

| 浏览器/环境 | 支持情况 | 备注 |
|-------------|----------|------|
| Chrome | ✅ 完全支持 | Web Worker 功能正常 |
| Firefox | ✅ 完全支持 | Web Worker 功能正常 |
| Safari | ✅ 支持 | iOS 上有 Worker 内存限制 |
| Edge | ✅ 完全支持 | Chromium 版本 |
| Node.js | ⚠️ 部分支持 | 不支持 Web Worker，自动降级到主线程 |
| 移动浏览器 | ⚠️ 有限支持 | 内存和性能限制，建议进行小数据集操作 |

## 7. 升级指南

### 7.1 从 1.x.x 升级到 2.0.0

1. **接口变更**：
   - 新增了 `profileData` 和 `optimizeData` 方法
   - 返回值中新增了 `isWorkerAvailable`、`dataProfile` 和 `memoryUsage` 状态

2. **TypeScript 接口更新**：
   - 使用了新的 `UseDataProcessorReturn` 接口，包含新增的方法和状态

3. **使用示例更新**：
   - 参考上述 3.1-3.4 节的示例代码更新现有实现

4. **性能优化增强**：
   - 新增基于内存和数据规模的智能处理策略
   - 自动监控内存使用情况，防止内存溢出

### 7.2 注意事项

1. Worker 路径需确保正确：`/workers/dataProcessor.worker.js`
2. 对于不支持 Web Worker 的环境，钩子会自动降级到主线程处理
3. 请确保在组件卸载时调用 `cleanup` 方法清理资源

## 8. 故障排除

### 8.1 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| Worker 初始化失败 | 路径错误或浏览器限制 | 检查 Worker 路径是否正确，在不支持 Worker 的环境中会自动降级 |
| 处理超时 | 数据量过大或操作复杂 | 尝试分批处理数据，或在调用方实现额外的优化 |
| 内存使用过高 | 数据量过大 | 使用数据特征分析获取优化建议，应用相应的优化策略；监控 memoryUsage 状态 |
| 自动降级到主线程 | Worker 连续失败或内存压力大 | 检查浏览器控制台的错误信息，确保 Worker 代码正确；考虑减少数据量 |
| 频繁的内存波动 | 大数据集操作频繁 | 实现数据处理结果缓存，减少重复计算

### 8.2 调试建议

1. **检查控制台错误**：关注与 Web Worker 相关的错误信息
2. **使用 `isWorkerAvailable` 状态**：在需要的地方检查 Worker 是否可用
3. **监控处理时间**：使用 `processingTime` 状态监控数据处理性能
4. **降级模式下的性能**：在主线程处理时，注意避免阻塞 UI 更新

## 9. 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 2.0.0 | 2024-11-24 | 新增数据特征分析、智能优化建议、自动降级机制、实时内存监控和基于内存的智能处理策略 |
| 1.0.0 | 2024-07-15 | 初始版本，提供基于 Web Worker 的数据处理功能 |

## 10. 总结

`useDataProcessor` 2.0.0 版本通过新增的数据特征分析、智能优化建议、自动降级机制、实时内存监控和基于内存的数据处理策略，为大数据处理提供了更强大、更智能、更稳定的解决方案。通过合理使用这些新功能，开发者可以显著提升应用的数据处理性能，防止内存溢出问题，同时保持良好的用户体验。内存监控和智能降级机制的引入，使得钩子能够在各种复杂场景下自适应调整处理策略，确保应用的稳定性和可靠性。

---

**保持代码健康，稳步前行！** 🌹