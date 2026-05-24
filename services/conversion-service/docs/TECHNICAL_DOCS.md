# YYC³ 转换服务技术文档

> **YYC³（YanYu Cloud Cube）**
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***英文***：*All Realms Converge at Cloud Nexus, DeepStack Ignites a New Era*

---

**创建日期**：2024
**作者**：YYC³团队
**版本**：2.0.0
**更新日期**：2024

# YYC³ 转换服务技术文档

## 1. 架构概述

转换服务采用现代化的中间件架构，基于 Express.js 构建，提供高性能的数据格式转换功能。服务架构分为以下几个核心层次：

- **中间件层**：处理请求拦截、错误捕获、日志记录和资源管理
- **服务层**：实现核心业务逻辑和转换功能
- **监控层**：提供实时性能指标和资源使用监控

### 1.1 核心组件关系

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ requestId       │     │ logger          │     │ errorHandler    │
│ middleware      │────▶│ middleware      │────▶│ middleware      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                        │
                                ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │ resourceManager │     │ Performance     │
                        │ middleware      │◀────│ MonitorService  │
                        └─────────────────┘     └─────────────────┘
```

## 2. 错误处理系统

### 2.1 错误类型定义

转换服务定义了多种自定义错误类型，用于精确描述不同场景下的错误情况：

#### 2.1.1 基础错误类型

| 错误类型 | 状态码 | 描述 | 使用场景 |
|---------|-------|------|--------|
| AppError | 500 | 应用程序基础错误 | 一般系统错误 |
| ValidationError | 400 | 输入验证错误 | 参数格式不正确 |
| NotFoundError | 404 | 资源不存在错误 | 请求的资源未找到 |
| UnauthorizedError | 401 | 未授权错误 | 缺少认证或认证失败 |
| ForbiddenError | 403 | 禁止访问错误 | 权限不足 |

#### 2.1.2 转换服务特有错误类型

| 错误类型 | 状态码 | 描述 | 使用场景 |
|---------|-------|------|--------|
| FileFormatError | 415 | 文件格式错误 | 不支持的文件格式 |
| FormatConversionError | 422 | 格式转换错误 | 转换过程失败 |
| ServiceUnavailableError | 503 | 服务不可用 | 服务暂时无法处理请求 |

### 2.2 错误处理中间件

`errorHandler` 中间件提供统一的错误处理机制，支持以下功能：

- 自动分类错误类型并返回适当的 HTTP 状态码
- 生成标准化的错误响应格式
- 记录详细的错误日志，包括请求上下文
- 集成性能监控，记录错误相关的性能指标
- 根据环境配置控制错误详情的显示

#### 2.2.1 错误响应格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "输入参数验证失败",
    "details": [
      { "field": "file", "message": "文件不能为空" }
    ],
    "timestamp": "2024-10-15T10:30:00Z",
    "requestId": "req-1234567890"
  }
}
```

### 2.3 最佳实践

1. **使用具体错误类型**：根据错误场景使用最具体的错误类型
2. **提供详细错误信息**：包含足够的上下文信息以便调试
3. **统一错误抛出方式**：使用服务提供的错误类，避免直接抛出原生 Error
4. **错误恢复机制**：对可恢复的错误实现自动重试或降级策略

## 3. 日志系统

### 3.1 日志级别

日志系统支持以下日志级别（从低到高）：

| 日志级别 | 描述 | 适用场景 |
|---------|------|--------|
| TRACE | 最详细的日志信息 | 开发调试、性能分析 |
| DEBUG | 调试信息 | 功能调试、流程跟踪 |
| INFO | 一般信息 | 正常操作记录 |
| WARN | 警告信息 | 潜在问题、需要关注的情况 |
| ERROR | 错误信息 | 操作失败、异常情况 |
| FATAL | 致命错误 | 导致服务不可用的严重错误 |

### 3.2 LoggerService 功能特性

- **结构化日志**：支持 JSON 格式的结构化日志输出
- **上下文跟踪**：自动关联请求上下文和跟踪 ID
- **元数据限制**：防止日志过大，自动截断超长字段
- **多目标输出**：支持控制台和文件输出
- **错误详情提取**：自动从错误对象中提取关键信息
- **性能指标记录**：集成性能监控，记录操作耗时

#### 3.2.1 日志配置项

| 配置项 | 类型 | 默认值 | 描述 |
|-------|------|-------|------|
| level | string | "info" | 日志记录级别 |
| file | string | null | 日志文件路径 |
| maxMetadataSize | number | 1024 | 元数据最大字节数 |
| enableContext | boolean | true | 是否启用上下文跟踪 |
| maskSensitiveFields | string[] | ["password", "token"] | 敏感字段掩码列表 |

### 3.3 日志中间件

`loggerMiddleware` 提供请求级别的日志记录功能：

- **请求开始日志**：记录请求方法、路径、IP 等信息
- **请求结束日志**：记录响应状态码、处理时间、响应大小等
- **请求体记录**：可配置的请求体日志记录，支持敏感信息过滤
- **跟踪 ID 生成**：自动生成或使用外部提供的跟踪 ID
- **转换信息提取**：从请求中提取转换相关的关键信息

#### 3.3.1 请求日志示例

```
INFO [req-abc123] Request started: POST /api/convert, ip=127.0.0.1, userAgent=Mozilla/5.0
INFO [req-abc123] Request body: {"format":"csv","targetFormat":"json","options":{"delimiter":","}}
INFO [req-abc123] Request ended: POST /api/convert, status=200, duration=150ms, size=1024bytes
```

## 4. 性能监控系统

### 4.1 PerformanceMonitorService 核心功能

- **操作计时**：精确记录操作开始和结束时间
- **性能指标收集**：收集内存使用、执行时间等指标
- **任务历史记录**：保存历史性能数据，支持趋势分析
- **并发控制**：监控并限制并发请求数量
- **内存监控**：实时监控内存使用情况，提供预警
- **异步函数监控**：简化异步操作的性能监控

#### 4.1.1 性能指标结构

| 指标名称 | 类型 | 描述 |
|---------|------|------|
| operationId | string | 操作唯一标识 |
| operationName | string | 操作名称 |
| startTime | number | 开始时间戳 |
| endTime | number | 结束时间戳 |
| duration | number | 持续时间(ms) |
| memoryUsage | number | 内存使用量(bytes) |
| isSlow | boolean | 是否为慢操作 |
| isSuccess | boolean | 操作是否成功 |
| error | string | 错误信息(如果有) |
| traceId | string | 关联的跟踪 ID |
| metadata | object | 附加元数据 |

### 4.2 资源管理中间件

`resourceManagerMiddleware` 实现智能的请求速率限制和资源使用控制：

- **请求大小检查**：限制请求体大小，防止过大请求
- **速率限制**：基于IP或用户ID的请求速率限制
- **并发控制**：限制同时处理的请求数量
- **系统资源监控**：监控CPU和内存使用，在资源紧张时拒绝新请求
- **自适应限流**：根据系统负载动态调整限制参数

#### 4.2.1 资源限制配置

| 配置项 | 类型 | 默认值 | 描述 |
|-------|------|-------|------|
| maxConcurrentRequests | number | 100 | 最大并发请求数 |
| maxRequestSize | number | 10 * 1024 * 1024 | 最大请求体大小(10MB) |
| rateLimit.windowMs | number | 60000 | 速率限制窗口(ms) |
| rateLimit.maxRequests | number | 100 | 窗口内最大请求数 |
| memoryThreshold | number | 80 | 内存使用阈值(%) |

## 5. 集成指南

### 5.1 错误处理集成

```typescript
import { errorHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import express from 'express';

const app = express();

// 业务路由
app.post('/api/convert', async (req, res, next) => {
  try {
    // 参数验证
    if (!req.body.file) {
      throw new ValidationError('文件不能为空');
    }
    
    // 业务逻辑
    const result = await conversionService.convert(req.body);
    res.json(result);
  } catch (error) {
    next(error); // 传递给错误处理中间件
  }
});

// 404 处理
app.use((req, res, next) => {
  next(new NotFoundError(`路径 ${req.path} 不存在`));
});

// 错误处理中间件（必须放在所有路由之后）
app.use(errorHandler);
```

### 5.2 日志系统集成

```typescript
import { LoggerService, createLoggerMiddleware } from '../services/LoggerService';
import { requestIdMiddleware } from '../middleware/errorHandler';
import express from 'express';

const app = express();

// 创建日志实例
const logger = new LoggerService({
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.LOG_FILE || null
});

// 中间件注册顺序很重要
app.use(requestIdMiddleware); // 首先生成请求 ID
app.use(createLoggerMiddleware(logger)); // 然后注册日志中间件

// 在业务逻辑中使用日志
app.post('/api/convert', (req, res) => {
  logger.info('开始转换任务', {
    format: req.body.format,
    targetFormat: req.body.targetFormat
  });
  
  // 业务逻辑...
});
```

### 5.3 性能监控集成

```typescript
import { PerformanceMonitorService } from '../services/PerformanceMonitorService';
import { resourceManagerMiddleware } from '../middleware/resourceManagerMiddleware';
import express from 'express';

const app = express();

// 创建性能监控实例
const performanceMonitor = PerformanceMonitorService.getInstance();

// 注册资源管理中间件
app.use(resourceManagerMiddleware({
  maxConcurrentRequests: 50,
  memoryThreshold: 75
}));

// 在业务逻辑中使用性能监控
app.post('/api/convert', async (req, res) => {
  const operation = performanceMonitor.startOperation('file_conversion');
  
  try {
    // 业务逻辑...
    const result = await conversionService.convert(req.body);
    
    // 结束操作并记录成功
    operation.end({ 
      isSuccess: true,
      metadata: { 
        fileSize: req.body.file.size,
        format: req.body.format 
      } 
    });
    
    res.json(result);
  } catch (error) {
    // 结束操作并记录失败
    operation.end({ 
      isSuccess: false, 
      error: error.message 
    });
    throw error;
  }
});

// 定期输出性能统计
setInterval(() => {
  const stats = performanceMonitor.getStats();
  console.log('性能统计:', stats);
}, 60000);
```

## 6. 最佳实践

### 6.1 错误处理最佳实践

1. **精确的错误类型**：使用最具体的错误类型描述错误情况
2. **详细的错误信息**：提供足够的上下文信息，便于问题定位
3. **错误日志记录**：在抛出错误前记录详细的错误信息
4. **友好的用户提示**：对用户可见的错误提供友好的提示信息
5. **错误恢复机制**：对可恢复的错误实现自动重试或降级策略

### 6.2 日志记录最佳实践

1. **适当的日志级别**：根据信息重要性选择合适的日志级别
2. **结构化日志**：使用键值对形式记录上下文信息
3. **敏感信息保护**：避免记录密码、令牌等敏感信息
4. **日志保留策略**：实施日志轮转和保留策略，避免磁盘空间耗尽
5. **性能考虑**：生产环境避免过多的 DEBUG 和 TRACE 日志

### 6.3 性能优化最佳实践

1. **批量处理**：将多个小操作合并为批量操作
2. **异步处理**：对耗时操作使用异步处理，避免阻塞主线程
3. **缓存策略**：对频繁使用的数据实施缓存
4. **资源限制**：合理设置资源使用限制，防止系统过载
5. **监控告警**：设置性能指标阈值，及时发现性能问题

## 7. 常见问题与排查

### 7.1 错误排查流程

1. **查看请求日志**：检查请求开始和结束日志，确认请求参数和响应状态
2. **分析错误日志**：查找 ERROR 级别的日志，关注错误类型和堆栈信息
3. **检查性能指标**：查看操作耗时和资源使用情况，判断是否存在性能瓶颈
4. **验证配置参数**：确认相关配置参数是否合理
5. **查看系统资源**：检查服务器 CPU、内存和磁盘使用情况

### 7.2 性能问题排查

1. **识别慢操作**：使用 TRACE 日志找出耗时较长的操作
2. **检查并发请求数**：确认是否达到并发限制
3. **分析内存使用**：检查内存是否存在泄漏或过度使用
4. **查看速率限制**：确认是否触发了速率限制
5. **检查数据量**：确认处理的数据量是否超出预期

## 8. 版本历史

| 版本 | 日期 | 主要变更 |
|-----|------|--------|
| 2.0.0 | 2024 | 全新架构，统一错误处理、增强日志系统和性能监控 |
| 1.0.0 | 2024 | 初始版本，基本转换功能 |

---

*本文档将随服务更新持续完善。如有问题或建议，请联系开发团队。* 🌹