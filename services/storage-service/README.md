# YYC³ Easy Table Converter - 存储服务

> **YYC³（YanYu Cloud Cube）**
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***英文***：*All Realms Converge at Cloud Nexus, DeepStack Ignites a New Era*

---

**创建日期**：2024-10-15
**作者**：YYC³团队
**版本**：2.0.0
**更新日期**：2024-11-23

> 🚀 **版本 2.0.0** - 支持多存储后端（本地存储、Amazon S3、Google Cloud Storage）

## 📋 服务概述

存储服务是 YYC³ Easy Table Converter 的核心组件，负责文件的存储、检索、管理和过期清理。2.0 版本引入了强大的适配器架构，支持多种存储后端无缝切换。

### ✨ 核心功能

- **多存储后端支持**：同时支持本地存储、Amazon S3 和 Google Cloud Storage
- **统一的适配器架构**：通过 `IStorageAdapter` 接口实现存储后端的无缝切换
- **灵活的配置管理**：通过环境变量配置存储服务，支持动态切换存储类型
- **文件生命周期管理**：支持文件过期和自动清理功能
- **增强的 API 接口**：提供文件上传、下载、删除、查询和签名URL生成等功能
- **安全的访问控制**：支持临时签名URL，提高文件访问安全性
- **完善的错误处理**：提供详细的错误信息和配置验证

## 🏗️ 技术架构

### 架构图

```
┌───────────────┐      ┌────────────────┐      ┌─────────────────┐
│  客户端应用   │ ──→  │  StorageService │ ──→  │ StorageAdapterFactory │
└───────────────┘      └────────────────┘      └─────────────────┘
                                                         │
                                                         ↓
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ LocalStorageAdapter │  │ S3StorageAdapter │  │ GCSStorageAdapter │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 核心组件

1. **StorageService**：存储服务的核心类，处理业务逻辑
2. **IStorageAdapter**：存储适配器接口，定义统一的存储操作
3. **StorageAdapterFactory**：工厂类，负责创建存储适配器实例
4. **具体适配器**：LocalStorageAdapter、S3StorageAdapter、GCSStorageAdapter

## 🛠️ 安装与配置

### 前提条件

- Node.js >= 16.0.0
- npm >= 8.0.0
- (可选) Amazon S3 或 Google Cloud Storage 账号

### 安装步骤

```bash
# 克隆仓库
cd /path/to/project/services/storage-service

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置所需的环境变量
```

### 环境变量配置

参考 `.env.example` 文件，配置以下环境变量：

#### 基础配置
- `PORT`: 服务端口（默认 3100）
- `NODE_ENV`: 环境模式（development/production/test）

#### MongoDB 配置
- `MONGODB_URI`: MongoDB 连接字符串

#### 存储服务配置
- `STORAGE_TYPE`: 存储类型（local/s3/gcs）
- `MAX_FILE_SIZE`: 最大文件大小（默认 52428800 字节 = 50MB）
- `FILE_EXPIRY_DAYS`: 文件过期天数（默认 7 天）

#### 本地存储配置
- `LOCAL_STORAGE_PATH`: 本地存储路径（默认 './storage'）

#### Amazon S3 配置
- `S3_BUCKET_NAME`: S3 存储桶名称
- `S3_REGION`: S3 区域
- `S3_ACCESS_KEY_ID`: S3 访问密钥 ID
- `S3_SECRET_ACCESS_KEY`: S3 密钥
- `S3_ENDPOINT`: 自定义 S3 端点（可选）
- `S3_FORCE_PATH_STYLE`: 是否强制使用路径样式（可选）

#### Google Cloud Storage 配置
- `GCS_BUCKET_NAME`: GCS 存储桶名称
- `GCS_PROJECT_ID`: GCS 项目 ID（可选）
- `GCS_KEY_FILENAME`: GCS 密钥文件路径（可选）

## 🚀 启动服务

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
# 构建项目
npm run build

# 启动服务
npm start
```

## 📡 API 接口

### 健康检查

```
GET /health
```

**响应示例**：
```json
{
  "status": "ok",
  "version": "2.0.0",
  "storage": {
    "type": "s3",
    "availableTypes": ["local", "s3"]
  },
  "timestamp": "2024-11-23T10:00:00.000Z"
}
```

### 存储配置信息

```
GET /config
```

**响应示例**：
```json
{
  "storage": {
    "type": "s3",
    "config": {
      "bucketName": "my-bucket",
      "region": "us-east-1"
    },
    "limits": {
      "maxFileSize": 52428800,
      "fileExpiryDays": 7
    }
  }
}
```

### 文件上传

```
POST /files/upload
Content-Type: multipart/form-data
```

**请求参数**：
- `file`: 要上传的文件（multipart/form-data）
- `userId`: 用户ID（可选，用于文件隔离）
- `metadata`: 文件元数据（可选，JSON 字符串）

**响应示例**：
```json
{
  "fileId": "uuid-12345",
  "filename": "example.csv",
  "size": 1024,
  "mimeType": "text/csv",
  "userId": "user123",
  "createdAt": "2024-11-23T10:00:00.000Z",
  "updatedAt": "2024-11-23T10:00:00.000Z"
}
```

### 获取文件信息

```
GET /files/:fileId
```

**响应示例**：
```json
{
  "fileId": "uuid-12345",
  "filename": "example.csv",
  "size": 1024,
  "mimeType": "text/csv",
  "userId": "user123",
  "createdAt": "2024-11-23T10:00:00.000Z",
  "updatedAt": "2024-11-23T10:00:00.000Z",
  "metadata": {}
}
```

### 下载文件

```
GET /files/:fileId/download
```

### 生成签名URL

```
POST /files/:fileId/signed-url
```

**请求体**：
```json
{
  "expiresIn": 3600  // 过期时间（秒）
}
```

**响应示例**：
```json
{
  "signedUrl": "https://s3.amazonaws.com/my-bucket/uuid-12345?X-Amz-Algorithm=...",
  "expiresAt": "2024-11-23T11:00:00.000Z"
}
```

### 删除文件

```
DELETE /files/:fileId
```

## 🔧 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建项目
npm run build

# 运行测试
npm test

# 运行测试并监视
npm run test:watch

# 代码检查
npm run lint

# 自动修复代码问题
npm run lint:fix

# 格式化代码
npm run format

# 创建发布包
npm run release
```

## 🧪 测试

存储服务包含完善的单元测试，覆盖以下内容：

- 存储适配器工厂类测试
- 配置验证测试
- 适配器初始化测试
- 错误处理测试

运行测试：

```bash
npm test
```

## 📦 发布

使用内置的发布脚本创建发布包：

```bash
# 确保脚本有执行权限
chmod +x scripts/release.sh

# 创建发布包
npm run release
```

发布包将生成在项目根目录，文件名为 `storage-service-v2.0.0.tar.gz`。

## 📝 版本历史

查看 [CHANGELOG.md](CHANGELOG.md) 获取详细的版本历史。

## 🔒 安全注意事项

- 生产环境中请确保正确配置访问密钥和权限
- 不要在代码中硬编码敏感信息
- 定期更新依赖包以修复安全漏洞
- 为 S3 和 GCS 存储设置适当的 CORS 和访问策略

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'feat: 添加令人惊叹的功能'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 LICENSE 文件

## 📧 支持

如有问题或建议，请联系：

- Email: support@yyc3.com
- GitHub Issues: https://github.com/yyc3/easy-table-converter/issues

---

⭐ 如果您觉得这个项目有帮助，请给它一个星标！

保持代码健康，稳步前行！ 🌹