# YYC³ Easy Table Converter - UI组件库

> **YYC³（YanYu Cloud Cube）**
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***英文***：*All Realms Converge at Cloud Nexus, DeepStack Ignites a New Era*

---

**创建日期**：2024-10-16
**作者**：YYC³团队
**版本**：1.0.0
**更新日期**：2024-10-16

## 📚 组件库介绍

YYC³ Easy Table Converter UI组件库是一个基于React和Tailwind CSS构建的现代、可定制的UI组件集合。本组件库旨在为YYC³ Easy Table Converter项目提供统一的视觉语言和交互体验。

### 🌟 核心特性

- **统一设计语言**：所有组件遵循一致的设计系统
- **响应式设计**：适配各种屏幕尺寸
- **深色模式支持**：内置深色/浅色主题切换
- **类型安全**：完整的TypeScript支持
- **高度可定制**：通过属性和CSS变量轻松定制
- **行业主题**：支持多行业主题配色方案

## 📦 安装

本组件库已内置在项目中，可直接导入使用：

```tsx
import { Button, Card, Input, Tooltip, Badge } from '@/components/ui';
```

## 🎨 组件使用指南

### Button 按钮

```tsx
import { Button } from '@/components/ui/Button';

// 基础按钮
<Button>点击我</Button>

// 变体按钮
<Button variant="secondary">次要按钮</Button>
<Button variant="destructive">危险按钮</Button>

// 尺寸按钮
<Button size="sm">小按钮</Button>
<Button size="lg">大按钮</Button>

// 图标按钮
<Button>
  <SearchIcon className="mr-2 h-4 w-4" />
  搜索
</Button>

// 加载按钮
<Button loading>加载中</Button>

// 禁用按钮
<Button disabled>禁用</Button>
```

### Card 卡片

```tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
    <CardDescription>卡片描述文本</CardDescription>
  </CardHeader>
  <CardContent>
    <p>卡片内容区域</p>
  </CardContent>
  <CardFooter>
    <Button>确定</Button>
    <Button variant="secondary">取消</Button>
  </CardFooter>
</Card>

// 带有点击效果的卡片
<Card asChild>
  <button>
    <CardContent>
      可点击的卡片
    </CardContent>
  </button>
</Card>
```

### Input 输入框

```tsx
import { Input } from '@/components/ui/Input';

// 基础输入框
<Input placeholder="请输入" />

// 带标签的输入框
<div className="space-y-1">
  <label htmlFor="name">名称</label>
  <Input id="name" placeholder="请输入名称" />
</div>

// 带状态的输入框
<Input variant="error" placeholder="错误状态" />
<Input variant="success" placeholder="成功状态" />

// 尺寸输入框
<Input size="sm" placeholder="小尺寸" />
<Input size="lg" placeholder="大尺寸" />

// 带图标的输入框
<div className="relative">
  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
  <Input placeholder="搜索" className="pl-9" />
</div>

// 密码输入框
<Input type="password" placeholder="密码" />
```

### Tooltip 工具提示

```tsx
import { Tooltip } from '@/components/ui/Tooltip';

<Tooltip title="提示内容">
  <Button variant="secondary">悬停查看提示</Button>
</Tooltip>

// 位置自定义
<Tooltip title="顶部提示" position="top">
  <Button variant="secondary">顶部</Button>
</Tooltip>

<Tooltip title="底部提示" position="bottom">
  <Button variant="secondary">底部</Button>
</Tooltip>

<Tooltip title="左侧提示" position="left">
  <Button variant="secondary">左侧</Button>
</Tooltip>

<Tooltip title="右侧提示" position="right">
  <Button variant="secondary">右侧</Button>
</Tooltip>

// 带箭头
<Tooltip title="带箭头的提示" arrow>
  <Button variant="secondary">带箭头</Button>
</Tooltip>

// 延迟显示
<Tooltip title="延迟显示" delay={300}>
  <Button variant="secondary">延迟显示</Button>
</Tooltip>
```

### Badge 徽章

```tsx
import { Badge } from '@/components/ui/Badge';

// 基础徽章
<Badge>默认</Badge>

// 状态徽章
<Badge variant="success">成功</Badge>
<Badge variant="warning">警告</Badge>
<Badge variant="error">错误</Badge>
<Badge variant="info">信息</Badge>

// 行业类别徽章
<Badge variant="data">数据处理</Badge>
<Badge variant="image">图像处理</Badge>
<Badge variant="text">文本分析</Badge>
<Badge variant="color">颜色提取</Badge>
<Badge variant="unit">单位转换</Badge>

// 尺寸徽章
<Badge size="sm">小型</Badge>
<Badge size="md">中型</Badge>
<Badge size="lg">大型</Badge>

// 带图标的徽章
<Badge>
  <Star className="h-3 w-3 mr-1" />
  热门
</Badge>

// 可点击徽章
<Badge clickable onClick={() => alert('徽章被点击了')}>可点击</Badge>
```

## 🎭 主题系统

组件库支持深色/浅色主题切换，以及多行业主题配置。

### 使用行业主题

```tsx
import { getIndustryTheme, applyThemeToDocument } from '@/utils/themeUtils';

// 获取智慧农业主题
const agricultureTheme = getIndustryTheme('agriculture');

// 应用主题
applyThemeToDocument(agricultureTheme);
```

### 主题配置

组件库使用CSS变量实现主题配置，主要变量包括：

- `--background`: 背景色
- `--foreground`: 前景色
- `--card`: 卡片背景色
- `--primary`: 主色调
- `--secondary`: 次要色调
- `--accent`: 强调色
- `--destructive`: 危险色

## 🔧 样式工具函数

组件库提供了一系列实用的样式工具函数：

```tsx
import { cn, hsl, getColorFromVar } from '@/utils/styleUtils';

// 合并类名
const className = cn('bg-primary', 'text-white', { 'font-bold': isBold });

// 生成HSL颜色
const color = hsl(210, 100, 50);

// 从CSS变量获取颜色
const primaryColor = getColorFromVar('primary');
```

## 📝 开发规范

### 组件开发原则

1. **原子化设计**：组件应遵循原子化设计原则，保持简单和专注
2. **可组合性**：组件应可组合使用，而不是孤立的
3. **类型安全**：提供完整的TypeScript类型定义
4. **可访问性**：确保组件符合WCAG可访问性标准
5. **性能优化**：避免不必要的重渲染，优化组件性能

### 样式规范

1. 使用Tailwind CSS进行样式开发
2. 使用`cn`函数合并类名
3. 遵循设计系统的颜色和间距规范
4. 确保响应式设计

## 📈 版本管理

当前组件库版本: `1.0.0`

## 🤝 贡献指南

欢迎贡献到YYC³ Easy Table Converter组件库！

1. 提交Issue或PR
2. 遵循项目的代码风格和命名规范
3. 添加适当的测试用例
4. 更新相关文档

## 📄 许可证

MIT License

---

**YYC³ Easy Table Converter - UI组件库**

设计精良，开发便捷！ 🌹