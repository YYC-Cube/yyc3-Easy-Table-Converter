# YYC³ Easy Table Converter API 参考手册

> **YYC³（YanYu Cloud Cube）**
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***英文***：*All Realms Converge at Cloud Nexus, DeepStack Ignites a New Era*

---

**创建日期**：2024-10-16
**作者**：YYC³团队
**版本**：1.0.0
**更新日期**：2024-10-16

# YYC³ Easy Table Converter API 参考手册

## 目录

1. [概述](#概述)
2. [认证与授权](#认证与授权)
3. [API基础信息](#api基础信息)
4. [文件管理API](#文件管理api)
5. [转换任务API](#转换任务api)
6. [映射规则API](#映射规则api)
7. [批处理API](#批处理api)
8. [监控API](#监控api)
9. [用户管理API](#用户管理api)
10. [系统配置API](#系统配置api)
11. [行业特定API](#行业特定api)
12. [错误处理](#错误处理)
13. [限流与配额](#限流与配额)
14. [最佳实践](#最佳实践)
15. [附录](#附录)

## 概述

本API参考手册详细描述了YYC³ Easy Table Converter系统提供的所有RESTful API接口，包括接口URL、请求方法、参数说明、返回值格式以及示例代码。开发人员可以通过这些API与系统进行集成，实现数据转换、文件管理、任务处理等功能。

### 主要功能模块

- **文件管理**：上传、下载、删除和查询文件
- **转换任务**：创建、执行、监控和管理数据转换任务
- **映射规则**：创建、编辑、删除和查询数据映射规则
- **批处理**：创建、调度和管理批处理任务
- **监控**：获取系统和任务的监控信息
- **用户管理**：用户认证、授权和管理
- **系统配置**：系统参数和配置管理
- **行业特定**：行业特定的数据处理功能

## 认证与授权

### API密钥认证

系统使用API密钥进行认证，开发人员需要在每个API请求的HTTP头中包含有效的API密钥。

```
Authorization: Bearer YOUR_API_KEY
```

### 获取API密钥

1. 登录YYC³ Easy Table Converter系统
2. 进入「用户设置」->「API设置」
3. 点击「生成新API密钥」按钮
4. 复制生成的API密钥并妥善保存

### 权限控制

API密钥的权限与创建该密钥的用户权限一致。系统支持基于角色的访问控制(RBAC)，可以通过用户管理界面配置用户角色和权限。

### API密钥管理

- **吊销密钥**：可以随时吊销已生成的API密钥
- **限制IP**：可以设置API密钥只能从特定IP地址访问
- **查看使用情况**：可以查看API密钥的使用情况和调用记录
- **设置过期时间**：可以为API密钥设置过期时间

## API基础信息

### 基本URL

所有API请求的基本URL格式如下：

```
https://api.yyc3-easytable.com/v1
```

### 请求格式

所有API请求应使用以下格式：

- **Content-Type**: `application/json`（除文件上传外）
- **Accept**: `application/json`
- **Authorization**: `Bearer YOUR_API_KEY`

### 响应格式

所有API响应将以JSON格式返回，基本结构如下：

```json
{
  "success": true,
  "data": {},
  "error": null,
  "message": "操作成功",
  "timestamp": "2024-10-16T10:30:00Z",
  "requestId": "req-1234567890"
}
```

### HTTP状态码

系统使用标准的HTTP状态码表示请求处理结果：

| 状态码 | 描述 |
|--------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 204 | 请求成功但无响应内容 |
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 405 | 请求方法不允许 |
| 409 | 资源冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 502 | 网关错误 |
| 503 | 服务不可用 |
| 504 | 网关超时 |

## 文件管理API

### 上传文件

**描述**: 上传文件到系统

**URL**: `/files/upload`

**方法**: `POST`

**请求参数**:

- **multipart/form-data** 格式：
  - `file` (必填): 文件内容
  - `name` (可选): 文件名称，默认为上传的文件名
  - `description` (可选): 文件描述
  - `tags` (可选): 标签，多个标签用逗号分隔
  - `folderId` (可选): 文件夹ID
  - `expiresIn` (可选): 文件过期时间（秒）

**响应数据**:

```json
{
  "fileId": "f-1234567890",
  "name": "example.xlsx",
  "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "size": 1024000,
  "createdAt": "2024-10-16T10:30:00Z",
  "status": "uploaded"
}
```

**示例代码**:

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('name', 'custom-name.xlsx');
formData.append('description', '示例文件');

fetch('https://api.yyc3-easytable.com/v1/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### 批量上传文件

**描述**: 批量上传多个文件

**URL**: `/files/batch-upload`

**方法**: `POST`

**请求参数**:

- **multipart/form-data** 格式：
  - `files[]` (必填): 多个文件内容
  - `folderId` (可选): 文件夹ID
  - `overwrite` (可选): 是否覆盖同名文件，默认为`false`

**响应数据**:

```json
{
  "uploads": [
    {
      "fileId": "f-1234567890",
      "name": "file1.xlsx",
      "status": "success"
    },
    {
      "fileId": "f-0987654321",
      "name": "file2.csv",
      "status": "success"
    }
  ],
  "total": 2,
  "success": 2,
  "failed": 0
}
```

### 获取文件列表

**描述**: 获取文件列表

**URL**: `/files`

**方法**: `GET`

**请求参数**:

- **query参数**:
  - `page` (可选): 页码，默认为1
  - `pageSize` (可选): 每页数量，默认为20
  - `type` (可选): 文件类型过滤
  - `status` (可选): 文件状态过滤
  - `search` (可选): 搜索关键词
  - `sortBy` (可选): 排序字段，默认为`createdAt`
  - `sortOrder` (可选): 排序方向，`asc`或`desc`，默认为`desc`
  - `folderId` (可选): 文件夹ID过滤

**响应数据**:

```json
{
  "items": [
    {
      "fileId": "f-1234567890",
      "name": "example.xlsx",
      "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "size": 1024000,
      "createdAt": "2024-10-16T10:30:00Z",
      "updatedAt": "2024-10-16T10:30:00Z",
      "status": "uploaded",
      "folderId": "folder-123"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}

## 错误处理

### 错误响应格式

所有API错误响应使用以下标准格式：

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "请求参数错误",
    "details": [
      {
        "field": "name",
        "message": "名称不能为空"
      }
    ]
  },
  "timestamp": "2024-10-16T10:30:00Z",
  "requestId": "req-1234567890"
}
```

### 常见错误码

| 错误码 | HTTP状态码 | 描述 |
|--------|------------|------|
| INVALID_REQUEST | 400 | 请求参数错误 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| RATE_LIMIT_EXCEEDED | 429 | 请求过于频繁 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |
| INVALID_API_KEY | 401 | 无效的API密钥 |
| API_KEY_EXPIRED | 401 | API密钥已过期 |
| INSUFFICIENT_QUOTA | 429 | 配额不足 |
| INVALID_FILE_FORMAT | 400 | 无效的文件格式 |
| FILE_TOO_LARGE | 413 | 文件太大 |
| TASK_FAILED | 500 | 任务执行失败 |
| MAPPING_ERROR | 400 | 映射规则错误 |
| VALIDATION_ERROR | 400 | 数据验证失败 |

### 错误处理最佳实践

1. **检查状态码**: 总是检查API响应的HTTP状态码
2. **解析错误信息**: 解析响应中的错误详情以获取具体原因
3. **实现重试机制**: 对于临时错误（如503、429）实现指数退避重试
4. **记录详细信息**: 记录完整的请求和错误信息以便调试
5. **提供友好提示**: 向用户展示友好的错误信息，隐藏技术细节
6. **监控错误率**: 监控并分析API错误率，及时发现和解决问题
7. **使用请求ID**: 利用响应中的requestId进行问题追踪

### 重试策略建议

| 错误码 | 是否应该重试 | 推荐重试次数 | 推荐重试间隔 |
|--------|------------|------------|------------|
| 429 (RATE_LIMIT_EXCEEDED) | 是 | 3-5次 | 指数退避(1s, 2s, 4s, 8s, 16s) |
| 503 (SERVICE_UNAVAILABLE) | 是 | 3次 | 固定间隔(5s) |
| 500 (INTERNAL_ERROR) | 可选 | 1-2次 | 固定间隔(3s) |
| 408 (TIMEOUT) | 是 | 2次 | 固定间隔(5s) |
| 其他4xx错误 | 否 | 不重试 | - |

## 附录

### 示例代码

#### JavaScript 客户端示例

```javascript
/**
 * @description JavaScript客户端使用示例
 * @author YYC
 * @created 2024-10-16
 */

class TableConverterClient {
  constructor(apiKey, baseUrl = 'https://api.tabconvert.example.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  // 创建请求头
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // 错误处理
  handleError(response) {
    if (!response.ok) {
      return response.json().then(error => {
        throw new Error(`API错误: ${error.error?.message || '未知错误'}`);
      });
    }
    return response;
  }

  // 上传文件
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    await this.handleError(response);
    return response.json();
  }

  // 执行数据转换
  async convertData(fileId, targetFormat, options = {}) {
    const response = await fetch(`${this.baseUrl}/convert`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        fileId,
        targetFormat,
        options
      })
    });

    await this.handleError(response);
    return response.json();
  }

  // 检查任务状态
  async checkTaskStatus(taskId) {
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    await this.handleError(response);
    return response.json();
  }

  // 下载转换结果
  async downloadResult(taskId) {
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}/result`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    await this.handleError(response);
    return response.blob();
  }

  // 行业间数据转换
  async crossIndustryConvert(fileId, sourceIndustry, targetIndustry, mappingId = null) {
    const response = await fetch(`${this.baseUrl}/industry/convert`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        fileId,
        sourceIndustry,
        targetIndustry,
        mappingId
      })
    });

    await this.handleError(response);
    return response.json();
  }

  // 查询行业矩阵
  async getIndustryMatrix() {
    const response = await fetch(`${this.baseUrl}/industry/matrix`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    await this.handleError(response);
    return response.json();
  }

  // 重试任务
  async retryTask(taskId) {
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}/retry`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    await this.handleError(response);
    return response.json();
  }
}

// 使用示例
async function exampleUsage() {
  const client = new TableConverterClient('your-api-key-here');

  try {
    // 1. 上传文件
    const file = document.getElementById('fileInput').files[0];
    const uploadResult = await client.uploadFile(file);
    const fileId = uploadResult.fileId;
    console.log('文件上传成功:', fileId);

    // 2. 执行数据转换
    const convertResult = await client.convertData(fileId, 'excel', {
      sheetName: 'Sheet1',
      headerRow: 1
    });
    const taskId = convertResult.taskId;
    console.log('转换任务已创建:', taskId);

    // 3. 轮询任务状态
    let taskStatus;
    do {
      await new Promise(resolve => setTimeout(resolve, 2000));
      taskStatus = await client.checkTaskStatus(taskId);
      console.log('任务状态:', taskStatus.status);
    } while (['processing', 'queued'].includes(taskStatus.status));

    // 4. 下载结果
    if (taskStatus.status === 'completed') {
      const resultBlob = await client.downloadResult(taskId);
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('结果下载成功');
    } else {
      console.error('任务失败:', taskStatus.error);
    }
  } catch (error) {
    console.error('发生错误:', error.message);
  }
}
```

#### Python 客户端示例

```python
"""
@description Python客户端使用示例
@author YYC
@created 2024-10-16
"""

import requests
import time
import os
from typing import Dict, Any, Optional, BinaryIO


class TableConverterClient:
    def __init__(self, api_key: str, base_url: str = 'https://api.tabconvert.example.com/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        """处理API响应，处理错误情况"""
        if not response.ok:
            try:
                error_data = response.json()
                error_message = error_data.get('error', {}).get('message', '未知错误')
                raise Exception(f'API错误: {error_message}')
            except (ValueError, KeyError):
                raise Exception(f'请求失败: {response.status_code}')
        return response.json()
    
    def upload_file(self, file_path: str) -> Dict[str, Any]:
        """上传文件到服务器"""
        with open(file_path, 'rb') as file:
            files = {'file': (os.path.basename(file_path), file)}
            response = requests.post(
                f'{self.base_url}/files/upload',
                headers={'Authorization': f'Bearer {self.api_key}'},
                files=files
            )
        return self._handle_response(response)
    
    def convert_data(self, file_id: str, target_format: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """执行数据转换"""
        payload = {
            'fileId': file_id,
            'targetFormat': target_format,
            'options': options or {}
        }
        response = requests.post(
            f'{self.base_url}/convert',
            headers=self.headers,
            json=payload
        )
        return self._handle_response(response)
    
    def check_task_status(self, task_id: str) -> Dict[str, Any]:
        """检查任务状态"""
        response = requests.get(
            f'{self.base_url}/tasks/{task_id}',
            headers=self.headers
        )
        return self._handle_response(response)
    
    def download_result(self, task_id: str, output_path: str) -> None:
        """下载转换结果"""
        response = requests.get(
            f'{self.base_url}/tasks/{task_id}/result',
            headers=self.headers,
            stream=True
        )
        
        if not response.ok:
            self._handle_response(response)
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    
    def cross_industry_convert(self, file_id: str, source_industry: str, 
                              target_industry: str, mapping_id: Optional[str] = None) -> Dict[str, Any]:
        """执行跨行业数据转换"""
        payload = {
            'fileId': file_id,
            'sourceIndustry': source_industry,
            'targetIndustry': target_industry
        }
        if mapping_id:
            payload['mappingId'] = mapping_id
        
        response = requests.post(
            f'{self.base_url}/industry/convert',
            headers=self.headers,
            json=payload
        )
        return self._handle_response(response)
    
    def get_industry_matrix(self) -> Dict[str, Any]:
        """获取支持的行业转换矩阵"""
        response = requests.get(
            f'{self.base_url}/industry/matrix',
            headers=self.headers
        )
        return self._handle_response(response)
    
    def retry_task(self, task_id: str) -> Dict[str, Any]:
        """重试失败的任务"""
        response = requests.post(
            f'{self.base_url}/tasks/{task_id}/retry',
            headers=self.headers
        )
        return self._handle_response(response)


# 使用示例
def example_usage():
    # 初始化客户端
    client = TableConverterClient('your-api-key-here')
    
    try:
        # 1. 上传文件
        print("正在上传文件...")
        upload_result = client.upload_file('input.csv')
        file_id = upload_result['fileId']
        print(f"文件上传成功，ID: {file_id}")
        
        # 2. 执行数据转换
        print("正在创建转换任务...")
        convert_result = client.convert_data(file_id, 'excel', {
            'sheetName': 'Sheet1',
            'headerRow': 1
        })
        task_id = convert_result['taskId']
        print(f"转换任务已创建，ID: {task_id}")
        
        # 3. 轮询任务状态
        print("正在查询任务状态...")
        task_status = client.check_task_status(task_id)
        while task_status['status'] in ['processing', 'queued']:
            print(f"任务状态: {task_status['status']}")
            time.sleep(2)
            task_status = client.check_task_status(task_id)
        
        # 4. 下载结果
        if task_status['status'] == 'completed':
            output_file = f"converted_{int(time.time())}.xlsx"
            print(f"任务完成，正在下载结果到 {output_file}...")
            client.download_result(task_id, output_file)
            print("下载完成！")
        else:
            print(f"任务失败: {task_status.get('error', '未知错误')}")
            
    except Exception as e:
        print(f"发生错误: {str(e)}")


if __name__ == "__main__":
    example_usage()
```

### API 变更日志

| 版本 | 日期 | 主要变更 |
|------|------|--------|
| 1.0.0 | 2024-10-16 | 初始版本发布 |
| 1.0.1 | 2024-10-20 | 增加了行业特定API支持 |
| 1.0.2 | 2024-10-25 | 优化了错误响应格式 |
| 1.1.0 | 2024-11-01 | 添加了Webhook支持 |
| 1.1.1 | 2024-11-05 | 修复了部分映射规则错误 |
| 1.2.0 | 2024-11-10 | 增加了更多行业支持 |

### 术语表

| 术语 | 解释 |
|------|------|
| API 密钥 | 访问API的认证凭证 |
| 任务 | 一个异步处理单元，如文件转换 |
| 映射规则 | 定义数据如何从一种格式转换到另一种格式的规则集 |
| 源格式 | 输入数据的原始格式 |
| 目标格式 | 转换后的数据格式 |
| 表头行 | 包含列名的行，通常是表格的第一行 |
| 行业矩阵 | 定义支持的行业间数据转换路径的配置 |
| 批处理 | 批量处理多个文件或数据记录 |
| Webhook | 当特定事件发生时自动向指定URL发送HTTP请求的机制 |
| 配额 | 限制用户在特定时间段内可以执行的操作数量 |

### 联系支持

如果您在使用API过程中遇到问题，请联系我们的支持团队：

- **电子邮件**: api-support@tabconvert.example.com
- **工作时间**: 周一至周五 9:00-18:00
- **紧急支持**: 提供付费的24/7紧急支持服务
- **GitHub**: [github.com/tabconvert/support](https://github.com/tabconvert/support)

### 安全注意事项

1. **API密钥保护**: 不要在客户端代码中硬编码API密钥
2. **HTTPS使用**: 始终通过HTTPS访问API
3. **密钥轮换**: 定期轮换API密钥
4. **最小权限原则**: 为不同的应用或用户创建不同的API密钥
5. **密钥删除**: 当不再需要API密钥时，及时删除它
6. **敏感数据处理**: 避免在URL或请求体中包含敏感信息
7. **日志管理**: 不要在日志中记录完整的API密钥
8. **IP白名单**: 对重要的API密钥设置IP白名单限制

### 性能优化建议

1. **批量操作**: 使用批量API减少请求次数
2. **异步处理**: 利用异步任务避免阻塞
3. **缓存策略**: 缓存频繁使用的静态数据
4. **压缩传输**: 启用HTTP压缩减少带宽使用
5. **优化请求**: 仅请求必要的数据字段
6. **连接池**: 使用连接池重用TCP连接
7. **监控性能**: 监控API调用性能，优化慢请求
8. **正确使用重试**: 实现合理的重试策略

### 合规性声明

本API服务符合以下行业标准和法规要求：

- **GDPR**: 符合欧盟通用数据保护条例
- **CCPA**: 符合加州消费者隐私法案
- **HIPAA**: 医疗数据处理符合健康保险便携性和责任法案
- **SOC2**: 服务组织控制报告类型2
- **PCI DSS**: 支付卡行业数据安全标准
- **ISO 27001**: 信息安全管理体系标准

我们承诺保护用户数据安全，定期进行安全审计和漏洞扫描。
```

### 获取文件详情

**描述**: 获取单个文件的详细信息

**URL**: `/files/{fileId}`

**方法**: `GET`

**路径参数**:

- `fileId` (必填): 文件ID

**响应数据**:

```json
{
  "fileId": "f-1234567890",
  "name": "example.xlsx",
  "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "size": 1024000,
  "createdAt": "2024-10-16T10:30:00Z",
  "updatedAt": "2024-10-16T10:30:00Z",
  "status": "uploaded",
  "description": "示例文件",
  "tags": ["example", "test"],
  "folderId": "folder-123",
  "metadata": {
    "sheets": ["Sheet1", "Sheet2"],
    "rows": 100,
    "columns": 10
  },
  "uploader": {
    "userId": "user-123",
    "username": "testuser"
  }
}
```

### 下载文件

**描述**: 下载文件内容

**URL**: `/files/{fileId}/download`

**方法**: `GET`

**路径参数**:

- `fileId` (必填): 文件ID

**响应**:

- **成功**: 返回文件内容，Content-Type为文件的MIME类型
- **失败**: 返回错误信息

### 删除文件

**描述**: 删除单个文件

**URL**: `/files/{fileId}`

**方法**: `DELETE`

**路径参数**:

- `fileId` (必填): 文件ID

**响应数据**:

```json
{
  "success": true,
  "message": "文件删除成功"
}
```

### 批量删除文件

**描述**: 批量删除多个文件

**URL**: `/files/batch-delete`

**方法**: `POST`

**请求体**:

```json
{
  "fileIds": ["f-1234567890", "f-0987654321"]
}
```

**响应数据**:

```json
{
  "success": true,
  "total": 2,
  "deleted": 2,
  "failed": 0,
  "message": "文件批量删除成功"
}
```

### 预览文件内容

**描述**: 预览文件的部分内容

**URL**: `/files/{fileId}/preview`

**方法**: `GET`

**路径参数**:

- `fileId` (必填): 文件ID

**查询参数**:

- `limit` (可选): 预览的最大行数，默认为100
- `sheet` (可选): 对于Excel文件，指定工作表名称或索引

**响应数据**:

```json
{
  "preview": {
    "headers": ["Name", "Age", "Email"],
    "rows": [
      ["John Doe", "30", "john@example.com"],
      ["Jane Smith", "25", "jane@example.com"]
    ],
    "totalRows": 100,
    "hasMore": true
  },
  "fileInfo": {
    "fileId": "f-1234567890",
    "name": "example.xlsx",
    "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  }
}
```

### 更新文件信息

**描述**: 更新文件的基本信息

**URL**: `/files/{fileId}`

**方法**: `PUT`

**路径参数**:

- `fileId` (必填): 文件ID

**请求体**:

```json
{
  "name": "new-name.xlsx",
  "description": "更新后的描述",
  "tags": ["new", "tags"]
}
```

**响应数据**:

```json
{
  "fileId": "f-1234567890",
  "name": "new-name.xlsx",
  "description": "更新后的描述",
  "tags": ["new", "tags"],
  "updatedAt": "2024-10-16T11:30:00Z"
}
```

## 转换任务API

### 创建转换任务

**描述**: 创建新的数据转换任务

**URL**: `/tasks`

**方法**: `POST`

**请求体**:

```json
{
  "name": "转换任务名称",
  "description": "任务描述",
  "sourceFileId": "f-1234567890",
  "sourceOptions": {
    "sheetName": "Sheet1",
    "hasHeaders": true,
    "startRow": 1
  },
  "targetFormat": "json",
  "targetOptions": {
    "prettyPrint": true,
    "includeHeaders": true
  },
  "mappingRuleId": "rule-1234567890",
  "advancedOptions": {
    "dataValidation": true,
    "errorHandling": "continue",
    "maxRecords": 10000
  },
  "notifications": {
    "onComplete": true,
    "onError": true,
    "email": "user@example.com"
  }
}
```

**响应数据**:

```json
{
  "taskId": "task-1234567890",
  "name": "转换任务名称",
  "status": "created",
  "createdAt": "2024-10-16T10:30:00Z"
}
```

### 执行转换任务

**描述**: 执行已创建的转换任务

**URL**: `/tasks/{taskId}/execute`

**方法**: `POST`

**路径参数**:

- `taskId` (必填): 任务ID

**响应数据**:

```json
{
  "taskId": "task-1234567890",
  "status": "processing",
  "message": "任务已开始执行"
}
```

### 获取任务列表

**描述**: 获取转换任务列表

**URL**: `/tasks`

**方法**: `GET`

**查询参数**:

- `page` (可选): 页码，默认为1
- `pageSize` (可选): 每页数量，默认为20
- `status` (可选): 任务状态过滤
- `search` (可选): 搜索关键词
- `sortBy` (可选): 排序字段，默认为`createdAt`
- `sortOrder` (可选): 排序方向，`asc`或`desc`，默认为`desc`

**响应数据**:

```json
{
  "items": [
    {
      "taskId": "task-1234567890",
      "name": "转换任务1",
      "status": "completed",
      "sourceFileId": "f-1234567890",
      "targetFormat": "json",
      "createdAt": "2024-10-16T10:30:00Z",
      "completedAt": "2024-10-16T10:31:30Z",
      "progress": 100
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

### 获取任务详情

**描述**: 获取单个转换任务的详细信息

**URL**: `/tasks/{taskId}`

**方法**: `GET`

**路径参数**:

- `taskId` (必填): 任务ID

**响应数据**:

```json
{
  "taskId": "task-1234567890",
  "name": "转换任务名称",
  "description": "任务描述",
  "status": "completed",
  "sourceFileId": "f-1234567890",
  "sourceOptions": {
    "sheetName": "Sheet1",
    "hasHeaders": true
  },
  "targetFormat": "json",
  "targetOptions": {
    "prettyPrint": true
  },
  "mappingRuleId": "rule-1234567890",
  "advancedOptions": {
    "dataValidation": true
  },
  "createdAt": "2024-10-16T10:30:00Z",
  "startedAt": "2024-10-16T10:30:15Z",
  "completedAt": "2024-10-16T10:31:30Z",
  "progress": 100,
  "statistics": {
    "totalRecords": 1000,
    "processedRecords": 1000,
    "successfulRecords": 990,
    "failedRecords": 10
  },
  "resultFileId": "f-result-1234567890",
  "createdBy": {
    "userId": "user-123",
    "username": "testuser"
  }
}
```

### 获取任务进度

**描述**: 获取任务的实时进度

**URL**: `/tasks/{taskId}/progress`

**方法**: `GET`

**路径参数**:

- `taskId` (必填): 任务ID

**响应数据**:

```json
{
  "taskId": "task-1234567890",
  "status": "processing",
  "progress": 75,
  "statistics": {
    "totalRecords": 1000,
    "processedRecords": 750,
    "successfulRecords": 740,
    "failedRecords": 10
  },
  "elapsedTime": 45,
  "estimatedRemainingTime": 15
}
```

### 取消任务

**描述**: 取消正在执行的任务

**URL**: `/tasks/{taskId}/cancel`

**方法**: `POST`

**路径参数**:

- `taskId` (必填): 任务ID

**响应数据**:

```json
{
  "taskId": "task-1234567890",
  "status": "cancelled",
  "message": "任务已成功取消"
}
```

### 删除任务

**描述**: 删除转换任务

**URL**: `/tasks/{taskId}`

**方法**: `DELETE`

**路径参数**:

- `taskId` (必填): 任务ID

**查询参数**:

- `deleteResultFile` (可选): 是否同时删除结果文件，默认为`false`

**响应数据**:

```json
{
  "success": true,
  "message": "任务删除成功"
}
```

### 获取任务结果

**描述**: 获取转换任务的结果信息

**URL**: `/tasks/{taskId}/result`

**方法**: `GET`

**路径参数**:

- `taskId` (必填): 任务ID

**响应数据**:

```json
{
  "taskId": "task-1234567890",
  "status": "completed",
  "resultFileId": "f-result-1234567890",
  "resultFileName": "converted-result.json",
  "resultFileSize": 524288,
  "downloadUrl": "https://api.yyc3-easytable.com/v1/files/f-result-1234567890/download",
  "statistics": {
    "totalRecords": 1000,
    "processedRecords": 1000,
    "successfulRecords": 990,
    "failedRecords": 10
  },
  "executionTime": 90,
  "errors": [
    {
      "recordNumber": 100,
      "errorMessage": "Invalid date format",
      "field": "birthdate"
    }
  ]
}
```

### 重新执行任务

**描述**: 重新执行已完成或失败的任务

**URL**: `/tasks/{taskId}/retry`

**方法**: `POST`

**路径参数**:

- `taskId` (必填): 任务ID

**响应数据**:

```json
{
  "taskId": "task-1234567890",
  "newTaskId": "task-new-1234567890",
  "status": "processing",
  "message": "任务已重新开始执行"
}
```

### 导出任务配置

**描述**: 导出任务配置为JSON格式

**URL**: `/tasks/{taskId}/export-config`

**方法**: `GET`

**路径参数**:

- `taskId` (必填): 任务ID

**响应数据**:

```json
{
  "taskConfig": {
    "name": "转换任务名称",
    "description": "任务描述",
    "sourceOptions": {
      "sheetName": "Sheet1",
      "hasHeaders": true
    },
    "targetFormat": "json",
    "targetOptions": {
      "prettyPrint": true
    },
    "mappingRuleId": "rule-1234567890",
    "advancedOptions": {
      "dataValidation": true
    }
  }
}
```

## 映射规则API

### 创建映射规则

**描述**: 创建新的数据映射规则

**URL**: `/mapping-rules`

**方法**: `POST`

**请求体**:

```json
{
  "name": "Excel到JSON映射规则",
  "description": "将Excel文件映射到JSON格式",
  "sourceFormat": "excel",
  "targetFormat": "json",
  "sourceIndustry": "general",
  "targetIndustry": "general",
  "isDefault": false,
  "mappings": [
    {
      "sourceField": "Name",
      "targetField": "fullName",
      "dataType": "string",
      "conversion": {
        "type": "uppercase"
      },
      "validation": {
        "required": true,
        "minLength": 2
      }
    },
    {
      "sourceField": "Age",
      "targetField": "age",
      "dataType": "number",
      "validation": {
        "min": 18,
        "max": 100
      }
    }
  ],
  "conditionalMappings": [
    {
      "condition": "record.Country === 'US'",
      "mappings": [
        {
          "sourceField": "ZipCode",
          "targetField": "postalCode",
          "dataType": "string"
        }
      ]
    }
  ],
  "script": "// 自定义转换脚本\nfunction processRecord(record) {\n  // 自定义逻辑\n  return record;\n}"
}
```

**响应数据**:

```json
{
  "ruleId": "rule-1234567890",
  "name": "Excel到JSON映射规则",
  "status": "created",
  "createdAt": "2024-10-16T10:30:00Z"
}
```

### 获取映射规则列表

**描述**: 获取映射规则列表

**URL**: `/mapping-rules`

**方法**: `GET`

**查询参数**:

- `page` (可选): 页码，默认为1
- `pageSize` (可选): 每页数量，默认为20
- `sourceFormat` (可选): 源格式过滤
- `targetFormat` (可选): 目标格式过滤
- `sourceIndustry` (可选): 源行业过滤
- `targetIndustry` (可选): 目标行业过滤
- `search` (可选): 搜索关键词
- `sortBy` (可选): 排序字段，默认为`createdAt`
- `sortOrder` (可选): 排序方向，`asc`或`desc`，默认为`desc`

**响应数据**:

```json
{
  "items": [
    {
      "ruleId": "rule-1234567890",
      "name": "Excel到JSON映射规则",
      "sourceFormat": "excel",
      "targetFormat": "json",
      "isDefault": false,
      "createdAt": "2024-10-16T10:30:00Z",
      "updatedAt": "2024-10-16T10:30:00Z",
      "usageCount": 10
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

### 获取映射规则详情

**描述**: 获取单个映射规则的详细信息

**URL**: `/mapping-rules/{ruleId}`

**方法**: `GET`

**路径参数**:

- `ruleId` (必填): 规则ID

**响应数据**:

```json
{
  "ruleId": "rule-1234567890",
  "name": "Excel到JSON映射规则",
  "description": "将Excel文件映射到JSON格式",
  "sourceFormat": "excel",
  "targetFormat": "json",
  "sourceIndustry": "general",
  "targetIndustry": "general",
  "isDefault": false,
  "createdAt": "2024-10-16T10:30:00Z",
  "updatedAt": "2024-10-16T10:30:00Z",
  "usageCount": 10,
  "createdBy": {
    "userId": "user-123",
    "username": "testuser"
  },
  "mappings": [
    {
      "sourceField": "Name",
      "targetField": "fullName",
      "dataType": "string",
      "conversion": {
        "type": "uppercase"
      },
      "validation": {
        "required": true,
        "minLength": 2
      }
    }
  ],
  "conditionalMappings": [],
  "script": "// 自定义转换脚本"
}
```

### 更新映射规则

**描述**: 更新现有的映射规则

**URL**: `/mapping-rules/{ruleId}`

**方法**: `PUT`

**路径参数**:

- `ruleId` (必填): 规则ID

**请求体**:

```json
{
  "name": "更新后的映射规则名称",
  "description": "更新后的规则描述",
  "isDefault": true,
  "mappings": [
    {
      "sourceField": "Name",
      "targetField": "fullName",
      "dataType": "string"
    }
  ]
}
```

**响应数据**:

```json
{
  "ruleId": "rule-1234567890",
  "name": "更新后的映射规则名称",
  "isDefault": true,
  "updatedAt": "2024-10-16T11:30:00Z",
  "message": "映射规则更新成功"
}
```

### 删除映射规则

**描述**: 删除映射规则

**URL**: `/mapping-rules/{ruleId}`

**方法**: `DELETE`

**路径参数**:

- `ruleId` (必填): 规则ID

**响应数据**:

```json
{
  "success": true,
  "message": "映射规则删除成功"
}
```

### 批量删除映射规则

**描述**: 批量删除多个映射规则

**URL**: `/mapping-rules/batch-delete`

**方法**: `POST`

**请求体**:

```json
{
  "ruleIds": ["rule-1234567890", "rule-0987654321"]
}
```

**响应数据**:

```json
{
  "success": true,
  "total": 2,
  "deleted": 2,
  "failed": 0,
  "message": "映射规则批量删除成功"
}
```

### 克隆映射规则

**描述**: 克隆现有映射规则创建新规则

**URL**: `/mapping-rules/{ruleId}/clone`

**方法**: `POST`

**路径参数**:

- `ruleId` (必填): 规则ID

**请求体**:

```json
{
  "name": "克隆的规则名称",
  "isDefault": false
}
```

**响应数据**:

```json
{
  "ruleId": "rule-new-1234567890",
  "name": "克隆的规则名称",
  "status": "created",
  "message": "映射规则克隆成功"
}
```

### 获取默认映射规则

**描述**: 获取特定源格式和目标格式的默认映射规则

**URL**: `/mapping-rules/default`

**方法**: `GET`

**查询参数**:

- `sourceFormat` (必填): 源格式
- `targetFormat` (必填): 目标格式
- `sourceIndustry` (可选): 源行业
- `targetIndustry` (可选): 目标行业

**响应数据**:

```json
{
  "rule": {
    "ruleId": "rule-default-1234567890",
    "name": "默认Excel到JSON映射规则",
    "sourceFormat": "excel",
    "targetFormat": "json",
    "isDefault": true,
    "mappings": []
  }
}
```

### 测试映射规则

**描述**: 测试映射规则的有效性

**URL**: `/mapping-rules/{ruleId}/test`

**方法**: `POST`

**路径参数**:

- `ruleId` (必填): 规则ID

**请求体**:

```json
{
  "testData": {
    "Name": "John Doe",
    "Age": 30,
    "Email": "john@example.com"
  }
}
```

**响应数据**:

```json
{
  "success": true,
  "input": {
    "Name": "John Doe",
    "Age": 30,
    "Email": "john@example.com"
  },
  "output": {
    "fullName": "JOHN DOE",
    "age": 30,
    "Email": "john@example.com"
  },
  "errors": [],
  "warnings": []
}
```

### 导出映射规则

**描述**: 导出映射规则为JSON格式

**URL**: `/mapping-rules/{ruleId}/export`

**方法**: `GET`

**路径参数**:

- `ruleId` (必填): 规则ID

**响应数据**:

```json
{
  "mappingRule": {
    "name": "Excel到JSON映射规则",
    "description": "将Excel文件映射到JSON格式",
    "sourceFormat": "excel",
    "targetFormat": "json",
    "mappings": [
      {
        "sourceField": "Name",
        "targetField": "fullName",
        "dataType": "string"
      }
    ]
  }
}
```

### 导入映射规则

**描述**: 从JSON格式导入映射规则

**URL**: `/mapping-rules/import`

**方法**: `POST`

**请求体**:

```json
{
  "mappingRule": {
    "name": "导入的映射规则",
    "description": "从JSON导入的规则",
    "sourceFormat": "excel",
    "targetFormat": "json",
    "mappings": [
      {
        "sourceField": "Name",
        "targetField": "fullName",
        "dataType": "string"
      }
    ]
  }
}
```

**响应数据**:

```json
{
  "ruleId": "rule-imported-1234567890",
  "name": "导入的映射规则",
  "status": "created",
  "message": "映射规则导入成功"
}
```

### 获取映射规则模板

**描述**: 获取特定格式组合的映射规则模板

**URL**: `/mapping-rules/templates`

**方法**: `GET`

**查询参数**:

- `sourceFormat` (必填): 源格式
- `targetFormat` (必填): 目标格式

**响应数据**:

```json
{
  "template": {
    "name": "Excel到JSON映射规则模板",
    "sourceFormat": "excel",
    "targetFormat": "json",
    "mappings": [],
    "suggestedMappings": [
      {
        "sourceField": "",
        "targetField": "",
        "dataType": "string"
      }
    ]
  }
}
```

## 批处理API

### 创建批处理任务

**描述**: 创建新的批处理任务

**URL**: `/batch-jobs`

**方法**: `POST`

**请求体**:

```json
{
  "name": "每日数据转换批处理",
  "description": "每日自动执行的数据转换任务",
  "taskType": "conversion",
  "sourceFolderId": "folder-1234567890",
  "targetFolderId": "folder-0987654321",
  "filePattern": "*.xlsx",
  "recursive": true,
  "conversionConfig": {
    "targetFormat": "json",
    "mappingRuleId": "rule-1234567890",
    "targetOptions": {
      "prettyPrint": true
    }
  },
  "schedule": {
    "type": "daily",
    "time": "00:00",
    "timezone": "Asia/Shanghai"
  },
  "advancedOptions": {
    "maxConcurrentTasks": 5,
    "errorHandling": "continue",
    "sendNotifications": true
  }
}
```

**响应数据**:

```json
{
  "jobId": "job-1234567890",
  "name": "每日数据转换批处理",
  "status": "created",
  "nextRunTime": "2024-10-17T00:00:00+08:00",
  "createdAt": "2024-10-16T10:30:00Z"
}
```

### 获取批处理任务列表

**描述**: 获取批处理任务列表

**URL**: `/batch-jobs`

**方法**: `GET`

**查询参数**:

- `page` (可选): 页码，默认为1
- `pageSize` (可选): 每页数量，默认为20
- `status` (可选): 任务状态过滤
- `search` (可选): 搜索关键词
- `sortBy` (可选): 排序字段，默认为`createdAt`
- `sortOrder` (可选): 排序方向，`asc`或`desc`，默认为`desc`

**响应数据**:

```json
{
  "items": [
    {
      "jobId": "job-1234567890",
      "name": "每日数据转换批处理",
      "status": "active",
      "taskType": "conversion",
      "createdAt": "2024-10-16T10:30:00Z",
      "lastRunTime": "2024-10-16T00:00:00Z",
      "nextRunTime": "2024-10-17T00:00:00Z",
      "runCount": 10,
      "successCount": 9,
      "failureCount": 1
    }
  ],
  "pagination": {
    "total": 20,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

### 获取批处理任务详情

**描述**: 获取单个批处理任务的详细信息

**URL**: `/batch-jobs/{jobId}`

**方法**: `GET`

**路径参数**:

- `jobId` (必填): 任务ID

**响应数据**:

```json
{
  "jobId": "job-1234567890",
  "name": "每日数据转换批处理",
  "description": "每日自动执行的数据转换任务",
  "status": "active",
  "taskType": "conversion",
  "sourceFolderId": "folder-1234567890",
  "targetFolderId": "folder-0987654321",
  "filePattern": "*.xlsx",
  "recursive": true,
  "conversionConfig": {
    "targetFormat": "json",
    "mappingRuleId": "rule-1234567890"
  },
  "schedule": {
    "type": "daily",
    "time": "00:00",
    "timezone": "Asia/Shanghai"
  },
  "advancedOptions": {
    "maxConcurrentTasks": 5
  },
  "createdAt": "2024-10-16T10:30:00Z",
  "updatedAt": "2024-10-16T10:30:00Z",
  "lastRunTime": "2024-10-16T00:00:00Z",
  "nextRunTime": "2024-10-17T00:00:00Z",
  "runCount": 10,
  "successCount": 9,
  "failureCount": 1,
  "createdBy": {
    "userId": "user-123",
    "username": "testuser"
  }
}
```

### 更新批处理任务

**描述**: 更新现有的批处理任务

**URL**: `/batch-jobs/{jobId}`

**方法**: `PUT`

**路径参数**:

- `jobId` (必填): 任务ID

**请求体**:

```json
{
  "name": "更新后的批处理任务名称",
  "description": "更新后的任务描述",
  "status": "active",
  "schedule": {
    "type": "daily",
    "time": "01:00",
    "timezone": "Asia/Shanghai"
  },
  "advancedOptions": {
    "maxConcurrentTasks": 10
  }
}
```

**响应数据**:

```json
{
  "jobId": "job-1234567890",
  "name": "更新后的批处理任务名称",
  "status": "active",
  "nextRunTime": "2024-10-17T01:00:00+08:00",
  "message": "批处理任务更新成功"
}
```

### 删除批处理任务

**描述**: 删除批处理任务

**URL**: `/batch-jobs/{jobId}`

**方法**: `DELETE`

**路径参数**:

- `jobId` (必填): 任务ID

**响应数据**:

```json
{
  "success": true,
  "message": "批处理任务删除成功"
}
```

### 立即执行批处理任务

**描述**: 立即执行批处理任务

**URL**: `/batch-jobs/{jobId}/execute`

**方法**: `POST`

**路径参数**:

- `jobId` (必填): 任务ID

**响应数据**:

```json
{
  "jobId": "job-1234567890",
  "executionId": "exec-1234567890",
  "status": "processing",
  "message": "批处理任务已开始执行"
}
```

### 暂停批处理任务

**描述**: 暂停批处理任务的调度

**URL**: `/batch-jobs/{jobId}/pause`

**方法**: `POST`

**路径参数**:

- `jobId` (必填): 任务ID

**响应数据**:

```json
{
  "jobId": "job-1234567890",
  "status": "paused",
  "message": "批处理任务已暂停"
}
```

### 恢复批处理任务

**描述**: 恢复批处理任务的调度

**URL**: `/batch-jobs/{jobId}/resume`

**方法**: `POST`

**路径参数**:

- `jobId` (必填): 任务ID

**响应数据**:

```json
{
  "jobId": "job-1234567890",
  "status": "active",
  "nextRunTime": "2024-10-17T00:00:00+08:00",
  "message": "批处理任务已恢复"
}
```

### 获取批处理执行历史

**描述**: 获取批处理任务的执行历史

**URL**: `/batch-jobs/{jobId}/history`

**方法**: `GET`

**路径参数**:

- `jobId` (必填): 任务ID

**查询参数**:

- `page` (可选): 页码，默认为1
- `pageSize` (可选): 每页数量，默认为20
- `status` (可选): 执行状态过滤

**响应数据**:

```json
{
  "items": [
    {
      "executionId": "exec-1234567890",
      "startedAt": "2024-10-16T00:00:00Z",
      "completedAt": "2024-10-16T00:05:30Z",
      "status": "completed",
      "statistics": {
        "totalTasks": 10,
        "successfulTasks": 10,
        "failedTasks": 0
      },
      "trigger": "scheduled"
    }
  ],
  "pagination": {
    "total": 30,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
}
```

### 获取批处理执行详情

**描述**: 获取特定批处理执行的详细信息

**URL**: `/batch-jobs/executions/{executionId}`

**方法**: `GET`

**路径参数**:

- `executionId` (必填): 执行ID

**响应数据**:

```json
{
  "executionId": "exec-1234567890",
  "jobId": "job-1234567890",
  "jobName": "每日数据转换批处理",
  "startedAt": "2024-10-16T00:00:00Z",
  "completedAt": "2024-10-16T00:05:30Z",
  "status": "completed",
  "statistics": {
    "totalTasks": 10,
    "successfulTasks": 10,
    "failedTasks": 0,
    "totalRecords": 1000,
    "processedRecords": 1000,
    "executionTime": 330
  },
  "trigger": "scheduled",
  "tasks": [
    {
      "taskId": "task-1234567890",
      "status": "completed",
      "fileName": "data1.xlsx",
      "recordsProcessed": 100
    }
  ],
  "errors": []
}
```

### 取消批处理执行

**描述**: 取消正在执行的批处理任务

**URL**: `/batch-jobs/executions/{executionId}/cancel`

**方法**: `POST`

**路径参数**:

- `executionId` (必填): 执行ID

**响应数据**:

```json
{
  "executionId": "exec-1234567890",
  "status": "cancelled",
  "message": "批处理执行已取消"
}
```

## 监控API

### 获取系统状态

**描述**: 获取系统的当前状态信息

**URL**: `/monitoring/system-status`

**方法**: `GET`

**响应数据**:

```json
{
  "status": "healthy",
  "timestamp": "2024-10-16T10:30:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "components": {
    "api": {
      "status": "healthy",
      "responseTime": 100
    },
    "database": {
      "status": "healthy",
      "connections": 50,
      "maxConnections": 200
    },
    "storage": {
      "status": "healthy",
      "usedSpace": 1073741824,
      "totalSpace": 10737418240,
      "percentageUsed": 10
    },
    "queue": {
      "status": "healthy",
      "pendingJobs": 0,
      "activeWorkers": 10
    }
  },
  "performance": {
    "cpuLoad": 0.3,
    "memoryUsage": 0.4,
    "diskIops": 100
  }
}
```

### 获取任务统计信息

**描述**: 获取任务执行的统计信息

**URL**: `/monitoring/task-statistics`

**方法**: `GET`

**查询参数**:

- `startDate` (可选): 开始日期，格式为"YYYY-MM-DD"
- `endDate` (可选): 结束日期，格式为"YYYY-MM-DD"
- `groupBy` (可选): 分组方式，可选值为"day"、"week"、"month"

**响应数据**:

```json
{
  "statistics": [
    {
      "date": "2024-10-16",
      "totalTasks": 100,
      "completedTasks": 95,
      "failedTasks": 5,
      "averageExecutionTime": 60,
      "totalRecords": 10000,
      "processedRecords": 9900
    }
  ],
  "summary": {
    "totalTasks": 100,
    "completedTasks": 95,
    "failedTasks": 5,
    "successRate": 0.95,
    "averageExecutionTime": 60
  }
}
```

### 获取文件统计信息

**描述**: 获取文件存储和使用的统计信息

**URL**: `/monitoring/file-statistics`

**方法**: `GET`

**查询参数**:

- `startDate` (可选): 开始日期，格式为"YYYY-MM-DD"
- `endDate` (可选): 结束日期，格式为"YYYY-MM-DD"
- `groupBy` (可选): 分组方式，可选值为"day"、"week"、"month"

**响应数据**:

```json
{
  "statistics": [
    {
      "date": "2024-10-16",
      "totalFiles": 1000,
      "newFiles": 100,
      "deletedFiles": 10,
      "totalSize": 10737418240,
      "fileTypeDistribution": {
        "xlsx": 400,
        "csv": 300,
        "json": 200,
        "xml": 100
      }
    }
  ],
  "summary": {
    "totalFiles": 1000,
    "totalSize": 10737418240,
    "storageUsed": 10737418240,
    "storageLimit": 107374182400
  }
}
```

### 获取批处理统计信息

**描述**: 获取批处理任务的统计信息

**URL**: `/monitoring/batch-statistics`

**方法**: `GET`

**查询参数**:

- `startDate` (可选): 开始日期，格式为"YYYY-MM-DD"
- `endDate` (可选): 结束日期，格式为"YYYY-MM-DD"
- `groupBy` (可选): 分组方式，可选值为"day"、"week"、"month"

**响应数据**:

```json
{
  "statistics": [
    {
      "date": "2024-10-16",
      "totalExecutions": 10,
      "successfulExecutions": 9,
      "failedExecutions": 1,
      "totalTasks": 100,
      "totalExecutionTime": 3600
    }
  ],
  "summary": {
    "totalExecutions": 10,
    "successfulExecutions": 9,
    "failedExecutions": 1,
    "successRate": 0.9,
    "averageExecutionTime": 360
  }
}
```

### 获取活动任务列表

**描述**: 获取当前正在执行的任务列表

**URL**: `/monitoring/active-tasks`

**方法**: `GET`

**查询参数**:

- `limit` (可选): 返回的最大任务数，默认为100
- `taskType` (可选): 任务类型过滤

**响应数据**:

```json
{
  "tasks": [
    {
      "taskId": "task-1234567890",
      "name": "转换任务1",
      "type": "conversion",
      "status": "processing",
      "progress": 50,
      "startedAt": "2024-10-16T10:30:00Z",
      "elapsedTime": 300,
      "estimatedRemainingTime": 300,
      "createdBy": {
        "userId": "user-123",
        "username": "testuser"
      }
    }
  ],
  "total": 5,
  "processing": 5,
  "queued": 0
}
```

### 获取资源使用情况

**描述**: 获取系统资源使用情况

**URL**: `/monitoring/resources`

**方法**: `GET`

**查询参数**:

- `type` (可选): 资源类型，可选值为"cpu"、"memory"、"disk"、"network"

**响应数据**:

```json
{
  "resources": {
    "cpu": {
      "usage": 0.3,
      "cores": 8,
      "loadAverage": [0.5, 0.6, 0.7]
    },
    "memory": {
      "used": 4294967296,
      "total": 16777216000,
      "percentageUsed": 25.6,
      "available": 12482248704
    },
    "disk": [
      {
        "mountPoint": "/",
        "used": 10737418240,
        "total": 107374182400,
        "percentageUsed": 10
      }
    ],
    "network": {
      "inputRate": 1048576,
      "outputRate": 2097152,
      "activeConnections": 100
    }
  },
  "timestamp": "2024-10-16T10:30:00Z"
}
```

### 获取告警信息

**描述**: 获取系统的告警信息

**URL**: `/monitoring/alerts`

**方法**: `GET`

**查询参数**:

- `page` (可选): 页码，默认为1
- `pageSize` (可选): 每页数量，默认为20
- `severity` (可选): 告警级别过滤，可选值为"critical"、"warning"、"info"
- `status` (可选): 告警状态过滤，可选值为"active"、"resolved"
- `startDate` (可选): 开始日期，格式为"YYYY-MM-DD"
- `endDate` (可选): 结束日期，格式为"YYYY-MM-DD"

**响应数据**:

```json
{
  "items": [
    {
      "alertId": "alert-1234567890",
      "severity": "warning",
      "status": "active",
      "message": "磁盘使用率超过80%",
      "source": "storage",
      "createdAt": "2024-10-16T10:30:00Z",
      "resolvedAt": null,
      "details": {
        "mountPoint": "/",
        "percentageUsed": 85
      }
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

### 解决告警

**描述**: 手动解决指定的告警

**URL**: `/monitoring/alerts/{alertId}/resolve`

**方法**: `POST`

**路径参数**:

- `alertId` (必填): 告警ID

**请求体**:

```json
{
  "comment": "问题已解决"
}
```

**响应数据**:

```json
{
  "alertId": "alert-1234567890",
  "status": "resolved",
  "resolvedAt": "2024-10-16T11:30:00Z",
  "message": "告警已成功解决"
}
```

## 用户管理API

### 用户认证

**描述**: 用户登录认证，获取访问令牌

**URL**: `/auth/login`

**方法**: `POST`

**请求体**:

```json
{
  "username": "testuser",
  "password": "password123",
  "rememberMe": false
}
```

**响应数据**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "user-123",
    "username": "testuser",
    "email": "test@example.com",
    "roles": ["admin", "user"]
  }
}
```

### 刷新令牌

**描述**: 使用刷新令牌获取新的访问令牌

**URL**: `/auth/refresh`

**方法**: `POST`

**请求体**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应数据**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### 用户登出

**描述**: 用户登出，使令牌失效

**URL**: `/auth/logout`

**方法**: `POST`

**请求头**:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**响应数据**:

```json
{
  "success": true,
  "message": "登出成功"
}
```

### 获取当前用户信息

**描述**: 获取当前登录用户的信息

**URL**: `/users/me`

**方法**: `GET`

**请求头**:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**响应数据**:

```json
{
  "user": {
    "userId": "user-123",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "roles": ["admin", "user"],
    "createdAt": "2024-10-16T10:30:00Z",
    "lastLogin": "2024-10-16T10:30:00Z",
    "preferences": {
      "theme": "light",
      "language": "zh-CN"
    }
  }
}
```

### 更新用户信息

**描述**: 更新当前用户的信息

**URL**: `/users/me`

**方法**: `PUT`

**请求头**:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**请求体**:

```json
{
  "fullName": "Updated User Name",
  "email": "newemail@example.com",
  "preferences": {
    "theme": "dark",
    "language": "en-US"
  }
}
```

**响应数据**:

```json
{
  "success": true,
  "user": {
    "userId": "user-123",
    "username": "testuser",
    "fullName": "Updated User Name",
    "email": "newemail@example.com",
    "updatedAt": "2024-10-16T11:30:00Z"
  },
  "message": "用户信息更新成功"
}
```

### 修改密码

**描述**: 修改当前用户的密码

**URL**: `/users/me/change-password`

**方法**: `POST`

**请求头**:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**请求体**:

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**响应数据**:

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

### 生成API密钥

**描述**: 为当前用户生成新的API密钥

**URL**: `/users/me/api-keys`

**方法**: `POST`

**请求头**:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**请求体**:

```json
{
  "name": "API密钥名称",
  "expiresIn": 31536000,
  "ipRestrictions": ["192.168.1.1"]
}
```

**响应数据**:

```json
{
  "apiKey": "sk_test_1234567890abcdef",
  "apiKeyId": "key-1234567890",
  "name": "API密钥名称",
  "createdAt": "2024-10-16T10:30:00Z",
  "expiresAt": "2025-10-16T10:30:00Z",
  "message": "API密钥生成成功，请妥善保存"
}
```

### 获取API密钥列表

**描述**: 获取当前用户的API密钥列表

**URL**: `/users/me/api-keys`

**方法**: `GET`

**请求头**:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**响应数据**:

```json
{
  "apiKeys": [
    {
      "apiKeyId": "key-1234567890",
      "name": "API密钥名称",
      "createdAt": "2024-10-16T10:30:00Z",
      "expiresAt": "2025-10-16T10:30:00Z",
      "lastUsed": "2024-10-16T10:30:00Z",
      "status": "active",
      "ipRestrictions": ["192.168.1.1"]
    }
  ],
  "total": 1
}

### 吊销API密钥

**描述**: 吊销指定的API密钥

**URL**: `/users/me/api-keys/{apiKeyId}`

**方法**: `DELETE`

**路径参数**:

- `apiKeyId` (必填): API密钥ID

**请求头**:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**响应数据**:

```json
{
  "success": true,
  "message": "API密钥已成功吊销"
}
```

### 重置API密钥

**描述**: 重置API密钥的状态和使用权限

**URL**: `/users/me/api-keys/{apiKeyId}/reset`

**方法**: `POST`

**路径参数**:

- `apiKeyId` (必填): API密钥ID

**请求头**:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**请求体**:

```json
{
  "newExpiresIn": 31536000,
  "ipRestrictions": []
}
```

**响应数据**:

```json
{
  "success": true,
  "apiKeyId": "key-1234567890",
  "expiresAt": "2025-10-16T10:30:00Z",
  "message": "API密钥已成功重置"
}

## 系统配置API

### 获取系统配置

**描述**: 获取系统的配置信息

**URL**: `/system/config`

**方法**: `GET`

**请求头**:

```
Authorization: Bearer YOUR_API_KEY
```

**响应数据**:

```json
{
  "config": {
    "system": {
      "version": "1.0.0",
      "environment": "production",
      "maintenanceMode": false
    },
    "limits": {
      "maxFileSize": 104857600,
      "maxFilesPerUser": 1000,
      "maxTasksPerUser": 100,
      "maxConcurrentTasks": 10
    },
    "supportedFormats": {
      "input": ["excel", "csv", "json", "xml", "txt"],
      "output": ["json", "csv", "excel", "xml", "pdf", "html"]
    },
    "features": {
      "batchProcessing": true,
      "scheduledTasks": true,
      "apiAccess": true,
      "customMapping": true
    }
  }
}
```

### 更新系统配置

**描述**: 更新系统配置（仅管理员权限）

**URL**: `/system/config`

**方法**: `PUT`

**请求头**:

```
Authorization: Bearer YOUR_API_KEY
```

**请求体**:

```json
{
  "config": {
    "limits": {
      "maxFileSize": 209715200,
      "maxFilesPerUser": 2000
    },
    "features": {
      "maintenanceMode": false
    }
  }
}
```

**响应数据**:

```json
{
  "success": true,
  "message": "系统配置更新成功"
}
```

### 获取用户配置

**描述**: 获取当前用户的配置信息

**URL**: `/system/user-config`

**方法**: `GET`

**请求头**:

```
Authorization: Bearer YOUR_API_KEY
```

**响应数据**:

```json
{
  "userConfig": {
    "interface": {
      "theme": "light",
      "language": "zh-CN",
      "timezone": "Asia/Shanghai"
    },
    "defaults": {
      "targetFormat": "json",
      "dataValidation": true,
      "errorHandling": "continue"
    },
    "notifications": {
      "email": true,
      "webhook": false,
      "webhookUrl": ""
    }
  }
}
```

### 更新用户配置

**描述**: 更新当前用户的配置信息

**URL**: `/system/user-config`

**方法**: `PUT`

**请求头**:

```
Authorization: Bearer YOUR_API_KEY
```

**请求体**:

```json
{
  "userConfig": {
    "interface": {
      "theme": "dark",
      "language": "en-US"
    },
    "defaults": {
      "targetFormat": "json"
    },
    "notifications": {
      "email": true
    }
  }
}
```

**响应数据**:

```json
{
  "success": true,
  "message": "用户配置更新成功"
}

## 行业特定API

### 金融行业数据处理

**描述**: 处理金融行业特定数据格式

**URL**: `/industry/finance/process-data`

**方法**: `POST`

**请求头**:

```
Authorization: Bearer YOUR_API_KEY
```

**请求体**:

```json
{
  "fileId": "f-1234567890",
  "targetFormat": "financial-json",
  "processingOptions": {
    "normalizeAmounts": true,
    "validateTransactions": true,
    "convertDateFormats": "ISO8601",
    "enrichWithCategories": true
  }
}
```

**响应数据**:

```json
{
  "taskId": "task-finance-1234567890",
  "status": "processing",
  "message": "金融数据处理任务已开始执行"
}
```

### 制造业数据转换

**描述**: 执行制造业特定的数据转换

**URL**: `/industry/manufacturing/convert-data`

**方法**: `POST`

**请求头**:

```
Authorization: Bearer YOUR_API_KEY
```

**请求体**:

```json
{
  "fileId": "f-1234567890",
  "sourceFormat": "manufacturing-csv",
  "targetFormat": "erp-json",
  "mappingOptions": {
    "batchNumberFormat": "YYYYMMDD-XXXXX",
    "normalizeQuantities": true,
    "includeProductionMetadata": true
  }
}
```

**响应数据**:

```json
{
  "taskId": "task-manufacturing-1234567890",
  "status": "processing",
  "message": "制造业数据转换任务已开始执行"
}

### 医疗健康数据处理

**描述**: 处理医疗健康特定的数据格式和隐私保护

**URL**: `/industry/healthcare/process-data`

**方法**: `POST`

**请求头**:

```
Authorization: Bearer YOUR_API_KEY
```

**请求体**:

```json
{
  "fileId": "f-1234567890",
  "targetFormat": "hl7-json",
  "processingOptions": {
    "hipaaCompliance": true,
    "deidentifyData": true,
    "convertToStandardCodes": true,
    "codeStandards": ["ICD-10", "SNOMED"]
  }
}
```

**响应数据**:

```json
{
  "taskId": "task-healthcare-1234567890",
  "status": "processing",
  "message": "医疗健康数据处理任务已开始执行"
}
```

### 零售行业数据转换

**描述**: 执行零售行业特定的数据转换和分析

**URL**: `/industry/retail/convert-data`

**方法**: `POST`

**请求头**:

```
Authorization: Bearer YOUR_API_KEY
```

**请求体**:

```json
{
  "fileId": "f-1234567890",
  "sourceFormat": "retail-csv",
  "targetFormat": "retail-analytics",
  "mappingOptions": {
    "normalizeProductCodes": true,
    "aggregateByCategory": true,
    "calculateMetrics": ["salesPerUnit", "profitMargin", "stockTurnover"],
    "includeStoreData": true
  }
}
```

**响应数据**:

```json
{
  "taskId": "task-retail-1234567890",
  "status": "processing",
  "message": "零售数据转换任务已开始执行"
}
```

### 教育行业数据处理

**描述**: 处理教育行业特定的数据格式和标准

**URL**: `/industry/education/process-data`

**方法**: `POST`

**请求头**:

```
Authorization: Bearer YOUR_API_KEY
```

**请求体**:

```json
{
  "fileId": "f-1234567890",
  "targetFormat": "education-json",
  "processingOptions": {
    "formatStudentIds": true,
    "calculateGPA": true,
    "normalizeGrades": true,
    "generateReports": false
  }
}
```

**响应数据**:

```json
{
  "taskId": "task-education-1234567890",
  "status": "processing",
  "message": "教育数据处理任务已开始执行"
}
```

### 行业矩阵查询

**描述**: 查询支持的行业间数据转换矩阵

**URL**: `/industry/matrix`

**方法**: `GET`

**请求头**:

```
Authorization: Bearer YOUR_API_KEY
```

**响应数据**:

```json
{
  "industryMatrix": {
    "supportedIndustries": ["finance", "manufacturing", "healthcare", "retail", "education", "general"],
    "conversionPaths": [
      {
        "sourceIndustry": "finance",
        "targetIndustry": "manufacturing",
        "supported": true,
        "defaultMappingId": "rule-finance-manufacturing-123",
        "complexity": "medium"
      },
      {
        "sourceIndustry": "manufacturing",
        "targetIndustry": "finance",
        "supported": true,
        "defaultMappingId": "rule-manufacturing-finance-123",
        "complexity": "medium"
      }
    ],
    "industryFeatures": {
      "finance": ["transaction-normalization", "amount-validation", "date-formatting"],
      "manufacturing": ["batch-number-formatting", "quantity-normalization", "production-metadata"]
    }
  }
}
```
