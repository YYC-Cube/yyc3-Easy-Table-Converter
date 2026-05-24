# YYC³ Easy Table Converter 项目文件结构规划

## 📁 整体文件结构概览

```
/YYC³ Easy Table Converter/
├── .next/                 # Next.js构建输出目录
├── Converter/             # 转换功能相关目录
├── Easy/                  # Easy模块相关代码
├── Table/                 # Table模块相关代码
├── __tests__/             # 测试文件目录
├── app/                   # Next.js应用根目录
│   ├── ClientLayout.tsx   # 客户端布局组件
│   ├── components/        # 全局组件
│   ├── contexts/          # 全局上下文
│   ├── converters/        # 转换器功能
│   ├── dashboard/         # 仪表板页面
│   ├── industries/        # 行业特定功能
│   ├── providers/         # React providers
│   ├── services/          # 服务层
│   └── settings/          # 设置页面
├── components/            # 可重用组件库
├── deploy/                # 部署配置文件
├── docs/                  # 项目文档
├── hooks/                 # 自定义React hooks
├── lib/                   # 通用库函数
├── providers/             # 全局providers
├── public/                # 静态资源
├── services/              # 服务层实现
├── styles/                # 全局样式
├── types/                 # 全局类型定义
└── utils/                 # 工具函数
```

## 🎯 第一阶段重点开发目录

### 1. AI服务架构增强

#### AI服务核心架构

```
/services/ai/
├── adapters/              # AI模型适配器
│   ├── base.ts            # 基础适配器接口
│   ├── openai.ts          # OpenAI适配器
│   └── anthropic.ts       # Anthropic适配器
├── api/                   # API层
│   ├── chat.ts            # 聊天API
│   ├── completion.ts      # 文本补全API
│   ├── embedding.ts       # 嵌入向量API
│   └── image.ts           # 图像生成API
├── chains/                # LangChain实现
│   ├── analyze_table.ts   # 表格分析链
│   ├── extract_data.ts    # 数据提取链
│   └── process_doc.ts     # 文档处理链
├── clients/               # AI服务客户端
│   ├── langchain.ts       # LangChain客户端
│   ├── openai.ts          # OpenAI客户端
│   └── anthropic.ts       # Anthropic客户端
├── contexts/              # 上下文管理
│   ├── base.ts            # 基础上下文类
│   └── conversation.ts    # 会话上下文管理
├── controllers/           # 控制器
│   ├── ai_api.ts          # AI API控制器
│   └── usage_metrics.ts   # 使用指标控制器
├── middlewares/           # 中间件
│   ├── rate_limiter.ts    # 速率限制中间件
│   └── error_handler.ts   # 错误处理中间件
├── models/                # 数据模型
│   ├── request.ts         # 请求模型
│   ├── response.ts        # 响应模型
│   └── usage.ts           # 使用统计模型
├── prompts/               # 提示词模板
│   ├── templates/         # 模板文件
│   └── manager.ts         # 模板管理器
├── services/              # 服务层
│   ├── chat_service.ts    # 聊天服务
│   ├── completion_service.ts # 补全服务
│   └── embedding_service.ts  # 嵌入服务
├── strategies/            # 策略模式实现
│   ├── retry.ts           # 重试策略
│   └── fallback.ts        # 降级策略
├── utils/                 # 工具函数
│   ├── chunking.ts        # 文本分块工具
│   └── token_count.ts     # Token计数工具
├── vector_db/             # 向量数据库
│   ├── adapter.ts         # 向量数据库适配器
│   └── pinecone.ts        # Pinecone实现
└── index.ts               # 入口文件
```

#### 知识库系统

```
/services/ai/knowledge_base/
├── processors/            # 文档处理器
│   ├── base.ts            # 基础处理器
│   ├── pdf.ts             # PDF处理器
│   └── excel.ts           # Excel处理器
├── retrievers/            # 检索器
│   ├── base.ts            # 基础检索器
│   ├── semantic.ts        # 语义检索器
│   └── hybrid.ts          # 混合检索器
├── storage/               # 存储层
│   ├── document_store.ts  # 文档存储
│   └── chunk_store.ts     # 块存储
└── index.ts               # 入口文件
```

### 2. 行业特定功能增强

#### 元宇宙/Web3行业工具

```
/app/industries/metaverse/
├── components/            # 组件
│   ├── NFTAssetViewer.tsx # NFT资产查看器
│   └── BlockchainExplorer.tsx # 区块链浏览器
├── hooks/                 # 自定义hooks
│   ├── useNFTData.ts      # NFT数据hook
│   └── useBlockchainQuery.ts # 区块链查询hook
├── services/              # 服务
│   ├── blockchain.ts      # 区块链服务
│   └── nft.ts             # NFT服务
├── tools/                 # 工具
│   ├── NFT_Analyzer.tsx   # NFT分析工具
│   └── SmartContract_Analyzer.tsx # 智能合约分析工具
└── index.ts               # 入口文件
```

```
/app/industries/web3/
├── components/            # 组件
│   ├── WalletConnector.tsx # 钱包连接器
│   └── TransactionMonitor.tsx # 交易监控器
├── hooks/                 # 自定义hooks
│   ├── useWallet.ts       # 钱包hook
│   └── useTransaction.ts  # 交易hook
├── services/              # 服务
│   ├── wallet.ts          # 钱包服务
│   └── transaction.ts     # 交易服务
├── tools/                 # 工具
│   ├── Token_Analyzer.tsx # 代币分析工具
│   └── DeFi_Analyzer.tsx  # DeFi分析工具
└── index.ts               # 入口文件
```

### 3. 基础设施增强

#### 缓存系统

```
/services/cache/
├── adapters/              # 缓存适配器
│   ├── base.ts            # 基础缓存接口
│   ├── redis.ts           # Redis实现
│   └── memory.ts          # 内存缓存实现
├── strategies/            # 缓存策略
│   ├── lru.ts             # LRU策略
│   └── ttl.ts             # TTL策略
└── index.ts               # 入口文件
```

#### 异步处理框架

```
/services/async/
├── queue/                 # 队列实现
│   ├── base.ts            # 基础队列接口
│   └── rabbitmq.ts        # RabbitMQ实现
├── scheduler/             # 调度器
│   ├── base.ts            # 基础调度器接口
│   └── cron.ts            # Cron调度器实现
├── tasks/                 # 任务定义
│   ├── base.ts            # 基础任务接口
│   └── processor.ts       # 任务处理器
└── index.ts               # 入口文件
```

### 4. 核心配置文件

```
/lib/config/
├── ai.ts                  # AI服务配置
├── database.ts            # 数据库配置
├── env.ts                 # 环境变量配置
├── security.ts            # 安全配置
└── services.ts            # 服务配置
```

### 5. 客户端增强

#### React Hooks增强

```
/hooks/
├── useAIService.ts        # AI服务hook
├── useAsyncTask.ts        # 异步任务hook
├── useCache.ts            # 缓存hook
├── useDataProcessor.ts    # 数据处理hook（已存在，需增强）
├── useFileUpload.ts       # 文件上传hook
└── useLocalStorage.ts     # 本地存储hook
```

#### 组件库增强

```
/components/
├── ai/                    # AI相关组件
│   ├── AIChat.tsx         # AI聊天组件
│   ├── AIModal.tsx        # AI模态框
│   └── AITooltip.tsx      # AI提示框
├── dashboard/             # 仪表板组件
│   ├── Card.tsx           # 卡片组件
│   ├── Chart.tsx          # 图表组件
│   └── StatsGrid.tsx      # 统计网格组件
└── ui/                    # UI组件
    ├── Button.tsx         # 按钮组件
    ├── Form.tsx           # 表单组件
    └── Table.tsx          # 表格组件
```

## 🔄 现有文件修改计划

### 1. 配置文件修改

| 文件路径 | 修改内容 | 优先级 |
|---------|---------|-------|
| /next.config.mjs | 添加AI服务配置，优化构建配置 | 🔴 高 |
| /tsconfig.json | 更新TypeScript配置，添加路径别名 | 🔴 高 |
| /package.json | 添加新依赖包 | 🔴 高 |
| /tailwind.config.ts | 更新Tailwind配置，添加新的颜色和工具类 | 🟠 中 |

### 2. 核心文件修改

| 文件路径 | 修改内容 | 优先级 |
|---------|---------|-------|
| /app/layout.tsx | 添加AI服务providers | 🔴 高 |
| /hooks/useDataProcessor.ts | 增强数据处理能力，添加异步处理 | 🔴 高 |
| /services/ | 添加AI和缓存服务 | 🔴 高 |
| /types/ | 添加新的类型定义 | 🟠 中 |

### 3. 页面组件修改

| 文件路径 | 修改内容 | 优先级 |
|---------|---------|-------|
| /app/dashboard/page.tsx | 更新仪表板，添加AI功能入口 | 🔴 高 |
| /app/industries/IndustryDashboard.tsx | 更新行业仪表板，添加新工具入口 | 🟠 中 |
| /app/page.tsx | 更新主页，突出新功能 | 🟠 中 |

## 🗓️ 文件创建时间表

### 第1周
- 配置文件更新
- AI服务核心架构文件
- 缓存系统文件
- 异步处理框架文件

### 第2-3周
- 知识库系统文件
- 元宇宙/Web3行业工具基础文件
- React Hooks增强文件
- 组件库核心组件文件

### 第4周
- 页面组件更新
- 测试文件创建
- 文档完善

## 📊 代码组织原则

1. **功能模块化**：按功能域划分目录，避免大而全的文件
2. **关注点分离**：UI、业务逻辑、数据访问分离
3. **类型优先**：使用TypeScript严格类型定义
4. **可测试性**：设计支持单元测试的代码结构
5. **扩展性**：使用适配器模式、策略模式支持未来扩展

## 🛠️ 开发工具与规范

1. **代码规范**：使用ESLint和Prettier
2. **命名规范**：
   - 文件/目录：kebab-case
   - 组件/类：PascalCase
   - 函数/变量：camelCase
3. **注释规范**：为公共API添加JSDoc注释
4. **提交规范**：使用语义化提交信息

## 📝 依赖管理

| 依赖类别 | 新增依赖 | 用途 |
|---------|---------|------|
| AI服务 | langchain, openai, @pinecone-database/pinecone | AI模型集成 |
| 数据库 | prisma, @prisma/client | ORM和数据库访问 |
| 缓存 | ioredis, node-cache | 缓存实现 |
| 消息队列 | amqplib | 异步消息处理 |
| UI组件 | recharts, framer-motion | 图表和动画效果 |
| 工具库 | lodash-es, date-fns | 通用工具函数 |
| Web3 | ethers, web3 | 区块链集成 |

---

**文档版本**：v1.0.0
**创建日期**：2024.10.25
**最后更新**：2024.10.25
**责任团队**：YYC³ Easy Table Converter 开发团队