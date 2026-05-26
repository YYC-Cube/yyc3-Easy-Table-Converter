<div align="center">

<img src="public/YYC3-Family.png" alt="YYC³ Family" width="100%" />

<br/>

# YanYuCloudCube™ Easy Table Converter

**万象归元于云枢 · 深栈智启新纪元**
*All Realms Converge at Cloud Nexus — DeepStack Ignites a New Era*

[![Website](https://img.shields.io/website?url=https%3A%2F%2Ftable.yyc3.top&style=for-the-badge&label=table.yyc3.top)](https://table.yyc3.top)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge)](https://github.com/YYC-Cube/YYC3-Easy-Table-Converter)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-407%20passed-brightgreen.svg?style=for-the-badge)](https://github.com/YYC-Cube/YYC3-Easy-Table-Converter/actions)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](./LICENSE)

[![Deploy](https://img.shields.io/badge/GitHub%20Pages-active-brightgreen.svg?style=flat-square&logo=github&logoColor=white)](https://table.yyc3.top)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4.svg?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000000.svg?style=flat-square)](https://ui.shadcn.com)
[![pnpm](https://img.shields.io/badge/pnpm-latest-F69220.svg?style=flat-square&logo=pnpm)](https://pnpm.io)

</div>

---

<div align="center">

**简体中文** | [**English**](#english-version)

</div>

---

## 📋 目录 | Table of Contents

- [项目介绍](#-项目介绍)
- [在线体验](#-在线体验)
- [核心功能](#-核心功能)
- [技术架构](#-技术架构)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [测试体系](#-测试体系)
- [文档体系](#-文档体系)
- [部署与CI/CD](#-部署与cicd)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

---

## 🚀 项目介绍

YYC³ Easy Table Converter 是由 **YanYuCloudCube™** 团队打造的智能表格数据转换平台。提供多格式数据转换、AI辅助分析、批量处理、图像编辑等一站式工具链，面向数据分析师、开发人员和需要处理表格数据的各类用户。

> **YanYuCloudCube™**
> 📧 <admin@0379.email>
> 言启象限 · 语枢未来 | Words Initiate Quadrants, Language Serves as Core for Future

---

## 🌐 在线体验

**🔗 [table.yyc3.top](https://table.yyc3.top)**

> 已通过 GitHub Pages + 自定义域名部署，DNS已认证，CI/CD自动发布。

---

## ✨ 核心功能

### 📊 数据格式转换

| 类别 | 支持格式 |
|------|----------|
| 表格格式 | CSV ↔ TSV ↔ JSON ↔ Markdown ↔ HTML ↔ XML ↔ YAML ↔ TOML |
| 数据库 | SQL 生成（MySQL / PostgreSQL / SQLite） |
| 文档格式 | Excel (.xlsx) ↔ CSV ↔ JSON ↔ HTML |
| 编码工具 | Base64 编解码 · Hash 计算 · 加密解密 |
| 单位转换 | 货币 · 能量 · 数据单位 · 角度 |

### 🤖 AI 智能能力

- 多模型集成（OpenAI / GLM / Qwen / DeepSeek / Ollama）
- 智能对话助手 · 浮窗式AI交互组件
- 文本摘要 · 翻译 · 批量处理
- 数据特征分析 · 优化建议

### 🖼️ 图像处理工具

- 格式转换 · 批量压缩 · 智能裁剪 · 滤镜效果
- 图片编辑器 · 水印添加 · 背景移除/替换
- 调色板生成 · 对比度检查 · 色盲模拟
- Favicon 生成 · App图标适配

### ⚡ 性能与体验

- Web Worker 并行处理引擎
- 虚拟滚动大数据渲染
- 实时性能监控面板
- PWA 离线支持
- 浅色/深色主题 · 多语言(i18n) · 响应式布局

---

## 🏗️ 技术架构

### 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | Next.js 14 (App Router) |
| **编程语言** | TypeScript 5.x |
| **样式系统** | Tailwind CSS 3.x + CSS-in-JS (Emotion) |
| **UI 组件库** | shadcn/ui + Radix UI + 自定义组件 |
| **状态管理** | React Hooks + Context API |
| **数据处理** | Web Worker + Apache Arrow |
| **AI 集成** | OpenAI SDK + 多模型适配器 |
| **认证系统** | NextAuth.js |
| **数据存储** | IndexedDB + localStorage + MongoDB |
| **测试体系** | Jest + React Testing Library + Playwright |
| **构建部署** | Next.js Build + GitHub Pages + GitHub Actions |

### 架构理念

```
五高架构: 高可用 · 高性能 · 高安全 · 高扩展 · 高智能
五标体系: 标准化 · 规范化 · 自动化 · 可视化 · 智能化
五化转型: 流程化 · 数字化 · 生态化 · 工具化 · 服务化
五维评估: 时间维 · 空间维 · 属性维 · 事件维 · 关联维
```

---

## 🏁 快速开始

### 前置要求

- **Node.js** ≥ 18.x
- **npm** 或 **pnpm**

### 安装

```bash
# 克隆仓库
git clone https://github.com/YYC-Cube/YYC3-Easy-Table-Converter.git
cd YYC3-Easy-Table-Converter

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3737` 即可使用。

### 常用命令

```bash
npm run dev          # 开发服务器 (port 3737)
npm run build        # 生产构建
npm run start        # 启动生产服务
npm run test         # 运行测试
npm run test:coverage # 测试覆盖率
npm run lint         # 代码检查
npm run typecheck    # 类型检查
```

---

## 📁 项目结构

```
YYC3-Easy-Table-Converter/
├── app/                          # Next.js App Router
│   ├── converters/               # 66 转换器页面
│   ├── industries/               # 行业智能模块
│   ├── components/               # 应用级组件
│   ├── contexts/                 # React Context
│   ├── hooks/                    # 应用级 Hooks
│   ├── services/                 # 应用级服务
│   ├── api/                      # API Routes
│   └── layout.tsx                # 根布局
├── components/                   # 共享组件库
│   ├── ui/                       # shadcn/ui 组件 (61)
│   ├── table/                    # 表格组件
│   ├── image-editor/             # 图片编辑器
│   ├── ai/                       # AI 组件
│   ├── converter-tools/          # 转换器工具
│   └── industries/               # 行业组件
├── hooks/                        # 共享 Hooks (18个)
├── lib/                          # 核心库
│   ├── utils/                    # 工具函数
│   ├── converters/               # 转换器引擎
│   ├── table/                    # 表格处理
│   ├── auth/                     # 认证系统
│   └── i18n/                     # 国际化
├── services/                     # 微服务
│   ├── ai/                       # AI 服务
│   ├── conversion-service/       # 转换服务
│   └── ai-service/               # AI 增强服务
├── __tests__/                    # 测试套件 (407 用例)
├── public/
│   ├── yyc3-icons/               # 全平台图标 (favicon/iOS/Android/PWA/WebP)
│   └── YYC3-Family.png          # 品牌顶图
├── .github/workflows/            # GitHub Actions CI/CD
├── docs/                         # 文档体系
│   └── YYC3-团队通用-标准规范/    # 团队标准规范
└── README.md
```

---

## 🧪 测试体系

| 指标 | 数值 |
|------|------|
| **测试套件** | 26 |
| **测试用例** | 407 |
| **通过率** | 100% |
| **覆盖率** | 71.8% Lines |

### 测试维度

| 维度 | 套件数 | 用例数 |
|------|--------|--------|
| 组件测试 | 6 | 49 |
| Provider 测试 | 1 | 15 |
| 工具函数测试 | 6 | 132 |
| 服务测试 | 2 | 31 |
| Hook 测试 | 2 | 16 |
| 集成测试 | 2 | 14 |
| 变异测试 | 1 | 7 |
| 性能测试 | 1 | 16 |
| AI 服务测试 | 1 | 27 |

---

## 📚 文档体系

| 文档 | 描述 |
|------|------|
| [五维驱动核心机制](./docs/YYC3-团队通用-标准规范/YYC3-团队核心-五维驱动.md) | 五高五标五化五维架构标准 |
| [开发标准](./docs/YYC3-团队通用-标准规范/YYC3-团队规范-开发标准.md) | 编码规范、命名规范、质量保障 |
| [文档闭环标准](./docs/YYC3-团队通用-标准规范/YYC3-团队规范-文档闭环.md) | 模版体系、追溯机制、迭代规范 |
| [AI协同开发文档](./docs/YYC3-团队通用-标准规范/YYC3-团队通用-开发文档.md) | AI导师协同工作流 |
| [验收系统](./docs/YYC3-团队通用-标准规范/YYC3-项目闭环-验收系统/) | 阶段验收提示词与报告 |

---

## 🚢 部署与CI/CD

### 部署架构

```
代码推送 → GitHub Actions → npm run build → GitHub Pages → table.yyc3.top
```

| 组件 | 配置 |
|------|------|
| **平台** | GitHub Pages |
| **域名** | table.yyc3.top (DNS CNAME) |
| **CI/CD** | GitHub Actions (.github/workflows/) |
| **触发** | push to main |
| **构建** | next build (static export) |

### 工作流

- **测试**：每次PR自动运行 407 个测试用例
- **构建**：main分支推送触发静态导出
- **部署**：自动发布到 GitHub Pages
- **域名**：通过 CNAME 指向 table.yyc3.top

---

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交变更 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 发起 Pull Request

### 提交规范

```
feat:     新功能
fix:      修复Bug
docs:     文档更新
style:    代码格式调整
refactor: 代码重构
test:     测试相关
chore:    构建/工具变更
```

---

## 📄 许可证

MIT License © 2024-2026 YanYuCloudCube™ Team

---

<div align="center">

**YanYuCloudCube™** — 万象归元于云枢 · 深栈智启新纪元

📧 <admin@0379.email> · 🌐 [table.yyc3.top](https://table.yyc3.top)

*All Realms Converge at Cloud Nexus — DeepStack Ignites a New Era of Intelligence*

**© 2024-2026 YYC³ Team. All Rights Reserved.**

</div>

---
---

<a id="english-version"></a>

<div align="center">

# YanYuCloudCube™ Easy Table Converter

**All Realms Converge at Cloud Nexus — DeepStack Ignites a New Era**

[![Website](https://img.shields.io/website?url=https%3A%2F%2Ftable.yyc3.top&style=for-the-badge&label=table.yyc3.top)](https://table.yyc3.top)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge)](https://github.com/YYC-Cube/YYC3-Easy-Table-Converter)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-407%20passed-brightgreen.svg?style=for-the-badge)](https://github.com/YYC-Cube/YYC3-Easy-Table-Converter/actions)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](./LICENSE)

[**中文版**](#) | **English**

</div>

---

## 🌐 Live Demo

**🔗 [table.yyc3.top](https://table.yyc3.top)**

> Deployed via GitHub Pages with custom domain, DNS verified, CI/CD automated.

## 📋 Overview

YYC³ Easy Table Converter is an intelligent table data conversion platform built by the **YanYuCloudCube™** team. It provides a one-stop toolchain for multi-format data conversion, AI-assisted analysis, batch processing, and image editing — designed for data analysts, developers, and anyone working with tabular data.

> **YanYuCloudCube™**
> 📧 <admin@0379.email>
> Words Initiate Quadrants, Language Serves as Core for Future

## ✨ Key Features

### 📊 Data Format Conversion

| Category | Supported Formats |
|----------|-------------------|
| Table Formats | CSV ↔ TSV ↔ JSON ↔ Markdown ↔ HTML ↔ XML ↔ YAML ↔ TOML |
| Database | SQL Generation (MySQL / PostgreSQL / SQLite) |
| Documents | Excel (.xlsx) ↔ CSV ↔ JSON ↔ HTML |
| Encoding | Base64 · Hash Calculation · Encrypt/Decrypt |
| Unit Conversion | Currency · Energy · Data Units · Angles |

### 🤖 AI Intelligence

- Multi-model integration (OpenAI / GLM / Qwen / DeepSeek / Ollama)
- Intelligent chat assistant with floating widget
- Text summarization · Translation · Batch processing
- Data profiling · Optimization recommendations

### 🖼️ Image Processing

- Format conversion · Batch compression · Smart cropping · Filters
- Image editor · Watermarks · Background removal/replacement
- Palette generator · Contrast checker · Color-blind simulation
- Favicon generator · App icon adaptation

### ⚡ Performance & UX

- Web Worker parallel processing engine
- Virtual scrolling for large datasets
- Real-time performance monitoring
- PWA offline support
- Light/Dark theme · i18n · Responsive design

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 3.x + Emotion |
| **UI Library** | shadcn/ui + Radix UI |
| **State** | React Hooks + Context API |
| **Data Processing** | Web Worker + Apache Arrow |
| **AI** | OpenAI SDK + Multi-model adapters |
| **Auth** | NextAuth.js |
| **Storage** | IndexedDB + localStorage + MongoDB |
| **Testing** | Jest + React Testing Library + Playwright |
| **Deploy** | GitHub Pages + GitHub Actions |

## 🏁 Quick Start

```bash
# Clone
git clone https://github.com/YYC-Cube/YYC3-Easy-Table-Converter.git
cd YYC3-Easy-Table-Converter

# Install
npm install

# Development
npm run dev    # http://localhost:3737

# Production
npm run build && npm start
```

### Commands

```bash
npm run dev           # Dev server (port 3737)
npm run build         # Production build
npm run test          # Run tests (407 cases)
npm run test:coverage # Coverage report
npm run lint          # Lint check
npm run typecheck     # Type check
```

## 🧪 Testing

| Metric | Value |
|--------|-------|
| **Suites** | 26 |
| **Test Cases** | 407 |
| **Pass Rate** | 100% |
| **Coverage** | 71.8% Lines |

## 🚢 CI/CD

```
Push → GitHub Actions → Test (407 cases) → Build → GitHub Pages → table.yyc3.top
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

```
feat: / fix: / docs: / style: / refactor: / test: / chore:
```

## 📄 License

MIT License © 2024-2026 YanYuCloudCube™ Team

---

<div align="center">

**YanYuCloudCube™** — Words Initiate Quadrants, Language Serves as Core for Future

📧 <admin@0379.email> · 🌐 [table.yyc3.top](https://table.yyc3.top)

*All Realms Converge at Cloud Nexus — DeepStack Ignites a New Era of Intelligence*

**© 2024-2026 YYC³ Team. All Rights Reserved.**

</div>
