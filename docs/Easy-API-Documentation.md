# YYC³ Easy Table Converter API 文档

> **YYC³（YanYu Cloud Cube）**
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***英文***：*All Realms Converge at Cloud Nexus, DeepStack Ignites a New Era*

---

**创建日期**：2024-10-16
**作者**：YYC³团队
**版本**：1.0.0
**更新日期**：2024-10-16

## 目录

- [1. 简介](#1-简介)
- [2. 技术架构](#2-技术架构)
- [3. API 基础信息](#3-api-基础信息)
- [4. 认证与授权](#4-认证与授权)
- [5. 错误处理](#5-错误处理)
- [6. 核心 API 端点](#6-核心-api-端点)
- [7. 行业特定 API](#7-行业特定-api)
- [8. 数据模型](#8-数据模型)
- [9. WebSocket 接口](#9-websocket-接口)
- [10. 最佳实践](#10-最佳实践)
- [11. 附录](#11-附录)

## 1. 简介

### 1.1 文档目的

本文档详细描述了 YYC³ Easy Table Converter 系统的所有 API 接口，包括请求格式、响应结构、参数说明和使用示例，旨在帮助开发者正确集成和使用系统功能。

### 1.2 系统概述

YYC³ Easy Table Converter 是一个功能强大的表格数据转换和处理平台，支持多种数据格式的导入导出、复杂的数据映射和转换规则配置，以及跨行业数据互通。系统提供了丰富的 API 接口，允许外部系统和应用程序与其进行交互。

### 1.3 适用范围

本文档适用于系统集成开发者、第三方应用开发者以及需要通过 API 接口与 YYC³ Easy Table Converter 系统进行交互的技术人员。

## 2. 技术架构

### 2.1 系统架构

系统采用现代微服务架构，基于 Next.js 14 和 Node.js 构建，具有良好的可扩展性和可维护性。核心组件包括数据处理引擎、转换规则管理器、行业特定适配器和监控系统。

### 2.2 API 架构

API 层采用 RESTful 设计风格，提供标准化的 HTTP 接口。同时，系统还支持 WebSocket 接口用于实时数据传输和状态通知。

### 2.3 数据流程

1. 客户端通过 API 发送请求
2. API 网关进行认证和路由
3. 业务服务处理请求并调用相应模块
4. 数据处理引擎执行转换操作
5. 返回处理结果给客户端

## 3. API 基础信息

### 3.1 基础 URL

所有 API 请求的基础 URL 为：

```
https://api.yyc3-easytable.com/v1
```

开发环境：

```
http://localhost:3100/api/v1
```

### 3.2 请求格式

所有请求必须以 JSON 格式提交，除非特殊说明。请求头必须包含：

```
Content-Type: application/json
```

### 3.3 响应格式

所有响应均以 JSON 格式返回，包含以下标准字段：

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2024-10-16T12:00:00Z",
  "requestId": "req-12345-abcde"
}
```

### 3.4 HTTP 方法

系统支持以下 HTTP 方法：

- GET: 获取资源
- POST: 创建资源
- PUT: 更新资源
- DELETE: 删除资源
- PATCH: 部分更新资源

### 3.5 分页

对于返回列表的接口，系统采用标准分页机制：

```
GET /api/v1/resources?page=1&limit=20
```

分页响应格式：

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  },
  "message": "操作成功"
}
```

## 4. 认证与授权

### 4.1 认证方式

系统采用 JWT (JSON Web Token) 进行认证。客户端需要在每个请求的 Authorization 头中携带有效的 JWT token。

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2 获取 Token

通过登录接口获取 JWT token：

```
POST /api/v1/auth/login
```

### 4.3 Token 刷新

当 token 即将过期时，可以使用刷新接口获取新的 token：

```
POST /api/v1/auth/refresh
```

### 4.4 权限模型

系统采用基于角色的访问控制 (RBAC) 模型，预定义的角色包括：

- ADMIN: 管理员
- OPERATOR: 操作员
- VIEWER: 查看者
- DEVELOPER: 开发者

### 4.5 API 密钥

对于系统集成，还支持 API 密钥认证方式：

```
X-API-Key: sk_live_abcdef1234567890
```

## 5. 错误处理

### 5.1 错误响应格式

错误响应包含错误代码和详细信息：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "name",
        "message": "名称不能为空"
      }
    ]
  },
  "message": "请求处理失败",
  "timestamp": "2024-10-16T12:00:00Z",
  "requestId": "req-12345-abcde"
}
```

### 5.2 常见错误代码

| 错误代码 | HTTP 状态码 | 描述 |
|----------|------------|------|
| UNAUTHORIZED | 401 | 未授权，缺少有效的认证信息 |
| FORBIDDEN | 403 | 禁止访问，权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| SERVER_ERROR | 500 | 服务器内部错误 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| BAD_GATEWAY | 502 | 上游服务错误 |
| SERVICE_UNAVAILABLE | 503 | 服务暂不可用 |

### 5.3 重试策略

对于非致命错误，客户端可以采用指数退避策略进行重试，最大重试次数建议不超过 3 次。

## 6. 核心 API 端点

### 6.1 认证相关接口

#### 6.1.1 用户登录

**接口**: `POST /api/v1/auth/login`

**描述**: 用户登录并获取 JWT token

**请求体**:

```json
{
  "username": "admin",
  "password": "secure_password"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user123",
      "username": "admin",
      "role": "ADMIN",
      "permissions": ["read", "write", "admin"]
    }
  },
  "message": "登录成功"
}
```

#### 6.1.2 刷新 Token

**接口**: `POST /api/v1/auth/refresh`

**描述**: 使用刷新 token 获取新的访问 token

**请求体**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "message": "Token 刷新成功"
}
```

#### 6.1.3 用户注销

**接口**: `POST /api/v1/auth/logout`

**描述**: 用户注销并使 token 失效

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应**:

```json
{
  "success": true,
  "message": "注销成功"
}
```

### 6.2 文件处理接口

#### 6.2.1 上传文件

**接口**: `POST /api/v1/files/upload`

**描述**: 上传数据文件进行处理

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**请求体**:

- `file`: 要上传的文件（支持 Excel, CSV, XML, JSON 等格式）
- `industry`: 行业类型（可选）
- `config`: 处理配置 JSON 字符串（可选）

**响应**:

```json
{
  "success": true,
  "data": {
    "fileId": "file-12345-abcde",
    "fileName": "example.xlsx",
    "fileSize": 1048576,
    "uploadTime": "2024-10-16T12:00:00Z",
    "status": "uploaded",
    "previewUrl": "/api/v1/files/file-12345-abcde/preview"
  },
  "message": "文件上传成功"
}
```

#### 6.2.2 获取文件列表

**接口**: `GET /api/v1/files`

**描述**: 获取用户上传的文件列表

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**查询参数**:

- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20）
- `status`: 文件状态过滤（可选）
- `industry`: 行业过滤（可选）
- `sortBy`: 排序字段（默认 "uploadTime"）
- `sortOrder`: 排序方向（默认 "desc"）

**响应**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "fileId": "file-12345-abcde",
        "fileName": "example.xlsx",
        "fileSize": 1048576,
        "uploadTime": "2024-10-16T12:00:00Z",
        "status": "processed",
        "industry": "FINANCE"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20,
    "pages": 1
  },
  "message": "获取成功"
}
```

#### 6.2.3 获取文件详情

**接口**: `GET /api/v1/files/{fileId}`

**描述**: 获取指定文件的详细信息

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**路径参数**:

- `fileId`: 文件 ID

**响应**:

```json
{
  "success": true,
  "data": {
    "fileId": "file-12345-abcde",
    "fileName": "example.xlsx",
    "fileSize": 1048576,
    "fileType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "uploadTime": "2024-10-16T12:00:00Z",
    "lastModified": "2024-10-16T12:05:00Z",
    "status": "processed",
    "industry": "FINANCE",
    "metadata": {
      "sheetCount": 3,
      "rowCount": 100,
      "processedRows": 95,
      "errorRows": 5
    },
    "previewUrl": "/api/v1/files/file-12345-abcde/preview",
    "downloadUrl": "/api/v1/files/file-12345-abcde/download"
  },
  "message": "获取成功"
}
```

#### 6.2.4 下载文件

**接口**: `GET /api/v1/files/{fileId}/download`

**描述**: 下载处理后的文件

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**路径参数**:

- `fileId`: 文件 ID

**查询参数**:

- `format`: 下载格式（默认为原始格式）
- `mode`: 下载模式（"original" 或 "processed"，默认为 "processed"）

**响应**:

- 文件二进制数据，Content-Type 根据文件类型设置

#### 6.2.5 删除文件

**接口**: `DELETE /api/v1/files/{fileId}`

**描述**: 删除指定的文件

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**路径参数**:

- `fileId`: 文件 ID

**响应**:

```json
{
  "success": true,
  "message": "文件删除成功"
}
```

### 6.3 数据转换接口

#### 6.3.1 执行数据转换

**接口**: `POST /api/v1/convert`

**描述**: 执行数据转换操作

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**请求体**:

```json
{
  "fileId": "file-12345-abcde",
  "sourceFormat": "EXCEL",
  "targetFormat": "JSON",
  "sourceIndustry": "FINANCE",
  "targetIndustry": "MANUFACTURING",
  "mappingRules": [
    {
      "sourcePath": "A1",
      "targetPath": "field1",
      "transformer": "string"
    }
  ],
  "options": {
    "skipHeader": false,
    "delimiter": ",",
    "encoding": "utf-8"
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "conversionId": "conv-12345-abcde",
    "status": "processing",
    "estimatedTime": 5,
    "progressUrl": "/api/v1/convert/conv-12345-abcde/status"
  },
  "message": "转换任务已提交"
}
```

#### 6.3.2 获取转换状态

**接口**: `GET /api/v1/convert/{conversionId}/status`

**描述**: 获取数据转换任务的状态和进度

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**路径参数**:

- `conversionId`: 转换任务 ID

**响应**:

```json
{
  "success": true,
  "data": {
    "conversionId": "conv-12345-abcde",
    "status": "completed",
    "progress": 100,
    "processedRecords": 100,
    "totalRecords": 100,
    "errorRecords": 0,
    "startedAt": "2024-10-16T12:00:00Z",
    "completedAt": "2024-10-16T12:00:05Z",
    "resultUrl": "/api/v1/convert/conv-12345-abcde/result",
    "logUrl": "/api/v1/convert/conv-12345-abcde/log"
  },
  "message": "获取成功"
}
```

#### 6.3.3 获取转换结果

**接口**: `GET /api/v1/convert/{conversionId}/result`

**描述**: 获取转换后的结果数据

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**路径参数**:

- `conversionId`: 转换任务 ID

**查询参数**:

- `format`: 响应格式（默认为 JSON）
- `limit`: 限制返回记录数（默认 1000）
- `page`: 页码（用于大结果集分页）

**响应**:

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "field1": "value1",
        "field2": "value2",
        "_metadata": {
          "sourceRow": 2,
          "status": "success"
        }
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 1000,
    "downloadUrl": "/api/v1/convert/conv-12345-abcde/download"
  },
  "message": "获取成功"
}
```

### 6.4 映射规则接口

#### 6.4.1 创建映射规则

**接口**: `POST /api/v1/mapping-rules`

**描述**: 创建新的映射规则

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "财务到生产映射规则",
  "description": "将财务系统数据转换为生产系统格式",
  "sourceIndustry": "FINANCE",
  "targetIndustry": "MANUFACTURING",
  "isDefault": false,
  "rules": [
    {
      "sourcePath": "A1",
      "targetPath": "orderId",
      "required": true,
      "transformer": "string",
      "description": "订单编号"
    },
    {
      "sourcePath": "B1",
      "targetPath": "orderDate",
      "required": true,
      "transformer": "date",
      "format": "YYYY-MM-DD",
      "description": "订单日期"
    }
  ],
  "metadata": {
    "createdBy": "admin",
    "version": "1.0.0"
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "ruleId": "rule-12345-abcde",
    "name": "财务到生产映射规则",
    "createdAt": "2024-10-16T12:00:00Z",
    "updatedAt": "2024-10-16T12:00:00Z",
    "status": "active"
  },
  "message": "映射规则创建成功"
}
```

#### 6.4.2 获取映射规则列表

**接口**: `GET /api/v1/mapping-rules`

**描述**: 获取映射规则列表

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**查询参数**:

- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20）
- `sourceIndustry`: 源行业过滤（可选）
- `targetIndustry`: 目标行业过滤（可选）
- `status`: 状态过滤（可选）
- `isDefault`: 是否默认规则过滤（可选）

**响应**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "ruleId": "rule-12345-abcde",
        "name": "财务到生产映射规则",
        "sourceIndustry": "FINANCE",
        "targetIndustry": "MANUFACTURING",
        "createdAt": "2024-10-16T12:00:00Z",
        "updatedAt": "2024-10-16T12:00:00Z",
        "status": "active",
        "isDefault": false
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  },
  "message": "获取成功"
}
```

#### 6.4.3 获取映射规则详情

**接口**: `GET /api/v1/mapping-rules/{ruleId}`

**描述**: 获取指定映射规则的详细信息

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**路径参数**:

- `ruleId`: 映射规则 ID

**响应**:

```json
{
  "success": true,
  "data": {
    "ruleId": "rule-12345-abcde",
    "name": "财务到生产映射规则",
    "description": "将财务系统数据转换为生产系统格式",
    "sourceIndustry": "FINANCE",
    "targetIndustry": "MANUFACTURING",
    "isDefault": false,
    "rules": [
      {
        "sourcePath": "A1",
        "targetPath": "orderId",
        "required": true,
        "transformer": "string",
        "description": "订单编号"
      }
    ],
    "metadata": {
      "createdBy": "admin",
      "version": "1.0.0"
    },
    "createdAt": "2024-10-16T12:00:00Z",
    "updatedAt": "2024-10-16T12:00:00Z",
    "status": "active"
  },
  "message": "获取成功"
}
```

#### 6.4.4 更新映射规则

**接口**: `PUT /api/v1/mapping-rules/{ruleId}`

**描述**: 更新指定的映射规则

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**路径参数**:

- `ruleId`: 映射规则 ID

**请求体**:

```json
{
  "name": "更新的财务到生产映射规则",
  "description": "更新后的映射规则描述",
  "rules": [
    // 更新后的规则列表
  ]
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "ruleId": "rule-12345-abcde",
    "updatedAt": "2024-10-16T12:05:00Z"
  },
  "message": "映射规则更新成功"
}
```

#### 6.4.5 删除映射规则

**接口**: `DELETE /api/v1/mapping-rules/{ruleId}`

**描述**: 删除指定的映射规则

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**路径参数**:

- `ruleId`: 映射规则 ID

**响应**:

```json
{
  "success": true,
  "message": "映射规则删除成功"
}
```

## 7. 行业特定 API

### 7.1 金融行业 API

#### 7.1.1 金融数据验证

**接口**: `POST /api/v1/industries/finance/validate`

**描述**: 验证金融数据的合法性和完整性

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**请求体**:

```json
{
  "fileId": "file-12345-abcde",
  "validationRules": [
    "tax_compliance",
    "balance_check",
    "format_validation"
  ],
  "options": {
    "strictMode": true
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "validationId": "val-12345-abcde",
    "status": "validating",
    "progressUrl": "/api/v1/industries/finance/validate/val-12345-abcde/status"
  },
  "message": "验证任务已提交"
}
```

#### 7.1.2 金融报告生成

**接口**: `POST /api/v1/industries/finance/reports`

**描述**: 生成金融分析报告

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**请求体**:

```json
{
  "fileId": "file-12345-abcde",
  "reportType": "financial_summary",
  "period": "2024-Q3",
  "format": "PDF",
  "options": {
    "includeCharts": true,
    "includeRecommendations": true
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "reportId": "report-12345-abcde",
    "status": "generating",
    "progressUrl": "/api/v1/industries/finance/reports/report-12345-abcde/status"
  },
  "message": "报告生成任务已提交"
}
```

### 7.2 制造业 API

#### 7.2.1 生产计划转换

**接口**: `POST /api/v1/industries/manufacturing/production-plans`

**描述**: 转换生产计划数据

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**请求体**:

```json
{
  "fileId": "file-12345-abcde",
  "productionType": "batch",
  "resourceAllocation": true,
  "optimizationMode": "efficiency"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "planId": "plan-12345-abcde",
    "status": "processing",
    "progressUrl": "/api/v1/industries/manufacturing/production-plans/plan-12345-abcde/status"
  },
  "message": "生产计划转换任务已提交"
}
```

#### 7.2.2 物料清单管理

**接口**: `POST /api/v1/industries/manufacturing/bom`

**描述**: 处理物料清单数据

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**请求体**:

```json
{
  "fileId": "file-12345-abcde",
  "operation": "validate",
  "options": {
    "checkInventory": true,
    "calculateCosts": true
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "bomId": "bom-12345-abcde",
    "status": "processing",
    "progressUrl": "/api/v1/industries/manufacturing/bom/bom-12345-abcde/status"
  },
  "message": "物料清单处理任务已提交"
}
```

### 7.3 行业矩阵接口

#### 7.3.1 获取行业列表

**接口**: `GET /api/v1/industries`

**描述**: 获取系统支持的所有行业

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "industryType": "FINANCE",
      "name": "金融行业",
      "description": "银行、保险、投资和金融服务等领域",
      "supportedFormats": ["JSON", "XML", "CSV", "API"],
      "keyEntities": ["FinancialOrder", "Client", "Payment", "Invoice", "Transaction"]
    }
  ],
  "message": "获取成功"
}
```

#### 7.3.2 获取行业元数据

**接口**: `GET /api/v1/industries/{industryType}/metadata`

**描述**: 获取特定行业的详细元数据

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**路径参数**:

- `industryType`: 行业类型

**响应**:

```json
{
  "success": true,
  "data": {
    "industryType": "FINANCE",
    "name": "金融行业",
    "description": "银行、保险、投资和金融服务等领域",
    "supportedFormats": ["JSON", "XML", "CSV", "API"],
    "keyEntities": ["FinancialOrder", "Client", "Payment", "Invoice", "Transaction"],
    "standards": ["ISO 20022", "SWIFT", "PCI DSS"],
    "apiEndpoints": ["/api/finance/orders", "/api/finance/payments", "/api/finance/reports"],
    "industrySpecificProperties": {
      "complianceLevel": "high",
      "dataPrivacy": "strict",
      "reportingFrequency": "daily"
    }
  },
  "message": "获取成功"
}
```

#### 7.3.3 获取行业转换支持

**接口**: `GET /api/v1/industries/conversion-support`

**描述**: 获取行业间的数据转换支持情况

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**查询参数**:

- `sourceIndustry`: 源行业（可选，不指定则返回所有可能的转换路径）
- `targetIndustry`: 目标行业（可选，不指定则返回所有可能的转换路径）

**响应**:

```json
{
  "success": true,
  "data": {
    "conversionPaths": [
      {
        "sourceIndustry": "FINANCE",
        "targetIndustry": "MANUFACTURING",
        "supported": true,
        "adapterClass": "FinanceToManufacturingAdapter",
        "efficiencyRating": 95,
        "lastUpdated": "2024-10-16"
      }
    ],
    "totalPaths": 45
  },
  "message": "获取成功"
}
```

## 8. 数据模型

### 8.1 核心数据模型

#### 8.1.1 文件模型 (File)

```typescript
interface File {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadTime: string;
  lastModified: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  industry?: string;
  sourceFormat?: string;
  targetFormat?: string;
  userId: string;
  path: string;
  metadata?: Record<string, any>;
}
```

#### 8.1.2 映射规则模型 (MappingRule)

```typescript
interface MappingRule {
  ruleId: string;
  name: string;
  description?: string;
  sourceIndustry: string;
  targetIndustry: string;
  isDefault: boolean;
  rules: ConversionRule[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'deprecated';
}

interface ConversionRule {
  sourcePath: string;
  targetPath: string;
  required?: boolean;
  defaultValue?: any;
  transformer?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  format?: string;
  validations?: ValidationRule[];
}

interface ValidationRule {
  type: string;
  params?: Record<string, any>;
  message?: string;
}
```

#### 8.1.3 转换任务模型 (ConversionTask)

```typescript
interface ConversionTask {
  conversionId: string;
  fileId: string;
  sourceFormat: string;
  targetFormat: string;
  sourceIndustry?: string;
  targetIndustry?: string;
  mappingRuleId?: string;
  mappingRules?: ConversionRule[];
  options?: Record<string, any>;
  userId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  processedRecords: number;
  totalRecords: number;
  errorRecords: number;
  startedAt?: string;
  completedAt?: string;
  resultUrl?: string;
  errorDetails?: ErrorDetail[];
}

interface ErrorDetail {
  row: number;
  field?: string;
  code: string;
  message: string;
  sourceValue?: any;
}
```

#### 8.1.4 用户模型 (User)

```typescript
interface User {
  userId: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'locked';
  createdAt: string;
  lastLogin?: string;
  preferences?: Record<string, any>;
}
```

#### 8.1.5 行业模型 (Industry)

```typescript
interface Industry {
  industryType: string;
  name: string;
  description: string;
  supportedFormats: string[];
  keyEntities: string[];
  standards?: string[];
  apiEndpoints?: string[];
  industrySpecificProperties?: Record<string, any>;
}
```

### 8.2 行业特定数据模型

#### 8.2.1 金融数据模型

```typescript
interface FinancialOrder {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  client: {
    id: string;
    name: string;
    type: string;
  };
  items: FinancialItem[];
  payment?: {
    method: string;
    transactionId?: string;
    date?: string;
  };
}

interface FinancialItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
}
```

#### 8.2.2 制造业数据模型

```typescript
interface ProductionOrder {
  orderId: string;
  orderDate: string;
  expectedCompletionDate: string;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  customer: {
    id: string;
    name: string;
  };
  items: ProductionItem[];
  resources?: {
    machines: string[];
    labor: number;
    materials: MaterialRequirement[];
  };
}

interface ProductionItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  specifications?: Record<string, any>;
}

interface MaterialRequirement {
  materialId: string;
  materialName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}
```

## 9. WebSocket 接口

### 9.1 实时状态通知

#### 9.1.1 连接信息

- **URL**: `wss://api.yyc3-easytable.com/ws/v1/status`
- **认证**: 需要在连接时提供 JWT token

#### 9.1.2 连接参数

```javascript
const socket = new WebSocket(`wss://api.yyc3-easytable.com/ws/v1/status?token=${jwtToken}`);
```

#### 9.1.3 消息格式

**客户端发送消息**:

```json
{
  "type": "subscribe",
  "data": {
    "taskTypes": ["conversion", "validation", "report"],
    "resourceIds": ["conv-12345-abcde"]
  },
  "timestamp": "2024-10-16T12:00:00Z",
  "messageId": "msg-12345-abcde"
}
```

**服务器推送消息**:

```json
{
  "type": "task_update",
  "data": {
    "taskId": "conv-12345-abcde",
    "taskType": "conversion",
    "status": "processing",
    "progress": 75,
    "processedRecords": 75,
    "totalRecords": 100,
    "errorRecords": 0,
    "message": "转换进度更新"
  },
  "timestamp": "2024-10-16T12:00:00Z",
  "messageId": "notif-12345-abcde"
}
```

#### 9.1.4 支持的消息类型

- `subscribe`: 订阅任务状态更新
- `unsubscribe`: 取消订阅
- `ping`: 心跳消息
- `pong`: 心跳响应
- `task_update`: 任务状态更新通知
- `system_notification`: 系统通知
- `error`: 错误消息

## 10. 最佳实践

### 10.1 API 调用频率限制

- 标准 API: 60 次/分钟
- 资源密集型 API: 10 次/分钟
- 文件上传 API: 5 次/分钟

### 10.2 安全性建议

- 始终使用 HTTPS 加密传输
- 妥善保管 API key 和 JWT token
- 定期轮换密钥和 token
- 实施最小权限原则
- 验证所有用户输入
- 防止 SQL 注入和 XSS 攻击

### 10.3 性能优化

- 使用批量操作减少 API 调用次数
- 实施请求缓存策略
- 合理使用分页功能
- 避免不必要的数据传输
- 使用 WebSocket 接口获取实时状态更新

### 10.4 错误处理

- 实现健壮的错误处理机制
- 记录详细的错误日志
- 为用户提供友好的错误提示
- 定期检查 API 响应的错误信息

## 11. 附录

### 11.1 支持的数据格式

| 格式 | 描述 | MIME 类型 |
|------|------|-----------|
| EXCEL | Microsoft Excel 文件 | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |
| CSV | 逗号分隔值文件 | text/csv |
| JSON | JavaScript 对象表示法 | application/json |
| XML | 可扩展标记语言 | application/xml |
| PDF | 便携式文档格式 | application/pdf |
| JSONL | JSON Lines 格式 | application/x-jsonlines |
| TSV | 制表符分隔值文件 | text/tab-separated-values |
| YAML | YAML 配置文件 | application/x-yaml |

### 11.2 支持的转换操作符

| 操作符 | 描述 | 示例 |
|--------|------|------|
| string | 转换为字符串 | `"123"` → `"123"` |
| number | 转换为数字 | `"123"` → `123` |
| date | 转换为日期 | `"2024-10-16"` → `Date object` |
| boolean | 转换为布尔值 | `"true"` → `true` |
| uppercase | 转换为大写 | `"abc"` → `"ABC"` |
| lowercase | 转换为小写 | `"ABC"` → `"abc"` |
| trim | 去除首尾空白 | `" abc "` → `"abc"` |
| split | 分割字符串 | `"a,b,c"` → `["a", "b", "c"]` |
| join | 连接数组元素 | `["a", "b", "c"]` → `"a,b,c"` |
| replace | 替换字符串 | `"abc"` → `"abd"` |
| format | 格式化字符串 | `"{0}-{1}"` → `"123-456"` |
| default | 设置默认值 | `undefined` → `"default"` |
| map | 映射值 | `"A"` → `"Alpha"` |
| multiply | 乘法运算 | `5` → `25` |
| divide | 除法运算 | `10` → `5` |
| add | 加法运算 | `5` → `10` |
| subtract | 减法运算 | `10` → `5` |
| modulo | 取模运算 | `10` → `0` |
| round | 四舍五入 | `10.5` → `11` |
| floor | 向下取整 | `10.9` → `10` |
| ceil | 向上取整 | `10.1` → `11` |
| absolute | 绝对值 | `-10` → `10` |
| contains | 检查包含关系 | `"abcdef"` → `true` |
| startsWith | 检查前缀 | `"abcdef"` → `true` |
| endsWith | 检查后缀 | `"abcdef"` → `true` |
| length | 获取长度 | `"abc"` → `3` |
| count | 获取数量 | `[1, 2, 3]` → `3` |
| sum | 求和 | `[1, 2, 3]` → `6` |
| average | 求平均值 | `[1, 2, 3]` → `2` |
| min | 最小值 | `[1, 2, 3]` → `1` |
| max | 最大值 | `[1, 2, 3]` → `3` |
| unique | 去重 | `[1, 2, 2, 3]` → `[1, 2, 3]` |
| filter | 过滤数组 | `[1, 2, 3, 4]` → `[2, 4]` |
| sort | 排序数组 | `[3, 1, 2]` → `[1, 2, 3]` |
| reverse | 反转数组 | `[1, 2, 3]` → `[3, 2, 1]` |
| flatten | 扁平化数组 | `[[1], [2, 3]]` → `[1, 2, 3]` |
| groupBy | 分组数组 | `[...]` → `{ key: [...] }` |
| toArray | 转换为数组 | `"1,2,3"` → `["1", "2", "3"]` |
| toObject | 转换为对象 | `[...]` → `{ ... }` |
| get | 获取对象属性 | `{ a: { b: 1 } }` → `1` |
| set | 设置对象属性 | `{ a: 1 }` → `{ a: 1, b: 2 }` |
| merge | 合并对象 | `{ a: 1 }, { b: 2 }` → `{ a: 1, b: 2 }` |
| keys | 获取对象键 | `{ a: 1, b: 2 }` → `["a", "b"]` |
| values | 获取对象值 | `{ a: 1, b: 2 }` → `[1, 2]` |
| entries | 获取对象键值对 | `{ a: 1 }` → `[["a", 1]]` |
| now | 获取当前时间 | `null` → `2024-10-16T12:00:00Z` |
| today | 获取今天日期 | `null` → `2024-10-16T00:00:00Z` |
| dateFormat | 格式化日期 | `Date` → `"2024-10-16"` |
| dateAdd | 添加时间 | `Date` → `Date+1d` |
| dateDiff | 日期差值 | `Date1, Date2` → `86400000` |
| if | 条件判断 | `true` → `"yes"` |
| ternary | 三目运算符 | `true` → `"yes"` |
| and | 逻辑与 | `true, true` → `true` |
| or | 逻辑或 | `true, false` → `true` |
| not | 逻辑非 | `true` → `false` |
| equals | 等于 | `5, 5` → `true` |
| notEquals | 不等于 | `5, 6` → `true` |
| greaterThan | 大于 | `10, 5` → `true` |
| greaterThanOrEqual | 大于等于 | `5, 5` → `true` |
| lessThan | 小于 | `5, 10` → `true` |
| lessThanOrEqual | 小于等于 | `5, 5` → `true` |
| match | 正则匹配 | `"abc123"` → `true` |
| replace | 正则替换 | `"abc123"` → `"def123"` |
| test | 测试正则 | `"abc123"` → `true` |

### 11.3 API 版本管理

系统使用 URL 路径中的版本号进行 API 版本管理。当前最新版本为 v1。未来版本更新将通过新增 URL 路径进行，同时保持旧版本 API 的兼容性。

### 11.4 联系信息

如有任何问题或建议，请联系技术支持团队：

- 邮箱: <support@yyc3-easytable.com>
- 电话: +86 138 0013 8000
- 支持工单系统: <https://support.yyc3-easytable.com>

### 11.5 文档更新历史

| 版本 | 更新日期 | 更新内容 |
|------|----------|----------|
| 1.0 | 2024-10-16 | 初始文档发布 |
| 1.1 | 2024-10-20 | 添加行业特定 API 部分 |
| 1.2 | 2024-10-25 | 更新数据模型和转换操作符 |

---

*本文档由 YYC³ Easy Table Converter 开发团队维护，版权所有 © 2024* 🌹
