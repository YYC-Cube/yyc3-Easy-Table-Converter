# YYC³ Easy Table Converter 🚀

<div align="center">
  
  <img src="/public/yyc3-brand-logo.png" alt="YYC³ Logo" width="200">
  
  <h2>支持11种格式的高级表格转换编辑工具</h2>
  
  <div style="margin: 20px 0;">
    <strong>万象归源于云枢，深栈智启新纪元</strong>
  </div>
  
  <div style="margin-bottom: 20px;">
    <em><strong>Vast Scenarios Converge at Cloud Hub, Deep Stack Smartly Initiates the New Healthcare Era</strong></em>
  </div>
  
  <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin: 20px 0;">
    <img src="https://img.shields.io/badge/Next.js-15.2.4-blue?style=flat-square" alt="Next.js Version">
    <img src="https://img.shields.io/badge/TypeScript-5+-blue?style=flat-square" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.3.0-blue?style=flat-square" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/Radix_UI-2.0-blue?style=flat-square" alt="Radix UI">
    <img src="https://img.shields.io/badge/pnpm-8+-blue?style=flat-square" alt="pnpm">
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
    <img src="https://img.shields.io/badge/Node.js-20%2B-green?style=flat-square" alt="Node.js 20+">
    <img src="https://img.shields.io/badge/Playwright-Test-blueviolet?style=flat-square" alt="Playwright">
    <img src="https://img.shields.io/badge/Docker-Supported-blue?style=flat-square" alt="Docker">
    <img src="https://img.shields.io/badge/Security-Local%20Processing-green?style=flat-square" alt="Local Processing">
  </div>
</div>

## 项目简介

YYC³ Easy Table Converter 是一个强大的在线表格转换工具，支持多种格式之间的相互转换，提供直观的用户界面和丰富的编辑功能。所有数据均在本地处理，确保用户数据隐私安全。

## 特性

- 📋 **多格式支持**：支持 CSV、JSON、Markdown、HTML、Excel 等11种表格格式
- 🎨 **直观编辑**：提供实时预览和编辑功能
- ⚡ **高效转换**：快速准确地进行格式转换
- 📱 **响应式设计**：适配各种设备屏幕
- 🔒 **数据安全**：本地处理，保护您的数据隐私
- 🛠️ **高级编辑**：支持排序、筛选、合并单元格等功能
- 📤 **批量处理**：支持多个文件同时转换
- 🔧 **自定义配置**：灵活的转换选项，满足特定需求

## 支持的格式

- CSV (Comma-Separated Values)
- JSON (JavaScript Object Notation)
- Markdown Tables
- HTML Tables
- Excel (XLSX)
- TSV (Tab-Separated Values)
- SQL
- YAML
- XML
- JSON Lines
- NDJSON

## 🛠️ 技术栈

- **前端框架**：Next.js 15.2.4 (App Router)
- **UI 组件库**：Radix UI + shadcn/ui
- **样式方案**：Tailwind CSS
- **状态管理**：React Hooks
- **类型系统**：TypeScript 5+
- **构建工具**：pnpm 8+
- **代码质量**：ESLint、Prettier、TypeScript 类型检查
- **测试框架**：Playwright (E2E)
- **部署方案**：Docker、Vercel

## 🚀 快速开始

### 前提条件

- Node.js 20+
- pnpm 8+

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/YYC-Cube/yyc3-Easy-Table-Converter.git
cd yyc3-Easy-Table-Converter
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

```bash
cp .env.example .env
# 根据需要编辑 .env 文件
```

4. **启动开发服务器**

```bash
pnpm dev
```

5. **在浏览器中访问**

打开 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── (main)/            # 主要路由
│   ├── components/        # 页面组件
│   └── page.tsx          # 主页
├── components/             # 通用组件
├── lib/                   # 工具库和业务逻辑
├── hooks/                 # 自定义 React Hooks
├── types/                 # TypeScript 类型定义
├── utils/                 # 工具函数
├── public/                # 静态资源
├── docker/                # Docker 相关配置
├── .github/               # GitHub Actions 工作流
├── docs/                  # 项目文档
│   ├── api-format-mapping.md     # API 格式映射规则
│   ├── architecture-standard.md  # 架构标准文档
│   ├── conversion-plan.md        # 转换技术方案
│   └── deployment-guide.md       # 部署操作指南
├── .env.example          # 环境变量示例
├── eslint.config.js      # ESLint 配置
├── tsconfig.json         # TypeScript 配置
├── tailwind.config.ts    # Tailwind CSS 配置
├── next.config.mjs       # Next.js 配置
├── package.json          # 项目依赖
└── README.md             # 项目文档
```

## 🔧 开发流程

### 代码规范

- 所有代码遵循 TypeScript 严格模式
- 使用 ESLint 和 Prettier 保持代码风格一致
- 提交前运行 `pnpm lint` 和 `pnpm type-check` 确保代码质量
- 遵循 Git 提交规范：
  - `feat`: 添加新功能
  - `fix`: 修复bug
  - `docs`: 更新文档
  - `style`: 调整代码格式
  - `refactor`: 重构代码
  - `test`: 添加或修改测试
  - `chore`: 更新依赖等非代码变更

### 常用命令

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 运行生产服务器
pnpm start

# 运行代码检查
pnpm lint

# 运行 TypeScript 类型检查
pnpm type-check

# 格式化代码
pnpm format

# 运行测试
pnpm test
```

## 🐳 Docker 部署

### 本地开发环境

```bash
docker-compose up app-dev
```

### 生产环境

```bash
docker-compose up app -d
```

## 📝 环境变量配置

| 变量名               | 说明     | 默认值                | 是否必需 |
| -------------------- | -------- | --------------------- | -------- |
| NEXT_PUBLIC_SITE_URL | 站点 URL | http://localhost:3000 | 否       |
| BRAND_NAME           | 品牌名称 | YYC³                  | 否       |
| NODE_ENV             | 环境模式 | development           | 否       |
| DEBUG_MODE           | 调试模式 | true                  | 否       |

## 🧪 测试

### 运行 E2E 测试

```bash
# 安装 Playwright 依赖
pnpm exec playwright install

# 运行测试
pnpm exec playwright test

# 生成测试报告
pnpm exec playwright show-report
```

### 单元测试

```bash
pnpm test
```

## 🔒 安全注意事项

- 确保在生产环境中设置合适的环境变量
- 定期更新依赖包以修复安全漏洞
- 避免在客户端代码中包含敏感信息
- 生产环境禁用调试模式

## 🤝 贡献指南

我们欢迎各种形式的贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: 添加了令人惊叹的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

请参阅 [贡献指南](./docs/development/CONTRIBUTING.md) 了解更多详情。

## 📋 行为准则

请遵守我们的 [行为准则](./docs/development/CODE_OF_CONDUCT.md)，共同维护友好的社区环境。

## 📚 详细文档

### 技术文档

- [API 格式映射](./docs/api-format-mapping.md) - API接口和格式转换规则
- [架构标准文档](./docs/architecture-standard.md) - 项目架构和代码规范
- [转换技术方案](./docs/conversion-plan.md) - 格式转换技术实现
- [部署操作指南](./docs/deployment-guide.md) - 环境配置和部署步骤

### 开发指南

- [贡献指南](./docs/development/CONTRIBUTING.md) - 参与项目贡献的详细流程
- [行为准则](./docs/development/CODE_OF_CONDUCT.md) - 社区参与规范
- [安全策略](./docs/development/SECURITY.md) - 安全漏洞报告和处理流程

## 📄 许可证

[MIT License](LICENSE)

## 📞 联系方式

如有问题或建议，请通过以下方式联系我们：

- Email: admin@0379.email
- Issue: [GitHub Issues](https://github.com/YYC-Cube/yyc3-Easy-Table-Converter/issues)

---

<p align="center">
  Made with ❤️ by YYC³ Team
</p>
