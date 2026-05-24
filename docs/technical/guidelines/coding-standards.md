# 🎯 YYC³ Easy Table Converter 编码规范

> **YYC³（YanYu Cloud Cube）**
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***英文***：*All Realms Converge at Cloud Nexus, DeepStack Ignites a New Era*

---

**创建日期**：2024-10-15
**作者**：YYC
**版本**：1.0.0
**更新日期**：2025-12-05

## 1. 通用编码标准

### 1.1 代码风格

- **缩进**: 使用2个空格
- **行长度**: 单行不超过120个字符
- **分号**: 必须使用分号
- **引号**: 使用单引号 `'`
- **大括号**: 左大括号不换行
- **空行**: 代码块之间使用空行分隔
- **注释**: 使用JSDoc格式的注释

### 1.2 命名规范

```typescript
// ✅ 推荐
const userName = 'YYC'; // 变量: 小驼峰

function getUserInfo() { // 函数: 小驼峰
  return {};
}

class UserService { // 类/接口: 大驼峰
  // 私有属性以下划线开头
  private _userName: string;
  
  // 静态常量: 全大写
  static readonly MAX_USERS = 100;
}

interface UserData { // 接口: 大驼峰
  id: string;
}

// ❌ 不推荐
const user_name = 'YYC';
function get_user_info() {}
class userService {}
```

### 1.3 变量声明

- 优先使用 `const`，其次是 `let`，避免使用 `var`
- 一行只声明一个变量
- 为变量提供明确的类型

```typescript
// ✅ 推荐
const count: number = 10;
const name: string = 'YYC';

// ❌ 不推荐
var count = 10;
let name, age;
```

## 2. TypeScript 规范

### 2.1 类型定义

- 接口定义使用 `interface`，类型别名使用 `type`
- 优先使用接口扩展而非类型联合
- 为函数参数和返回值添加类型注解

```typescript
// ✅ 推荐
interface BaseUser {
  id: string;
}

interface AdminUser extends BaseUser {
  role: 'admin';
}

function processUser(user: BaseUser): boolean {
  return true;
}

// ❌ 不推荐
interface User extends BaseUser, AdminUser {} // 多重继承
```

### 2.2 泛型使用

- 合理使用泛型提高代码复用性
- 泛型参数使用有意义的名称
- 为泛型添加约束条件

```typescript
// ✅ 推荐
interface ApiResponse<T> {
  data: T;
  status: number;
}

function fetchData<T extends Record<string, any>>(url: string): Promise<ApiResponse<T>> {
  // 实现
  return Promise.resolve({} as ApiResponse<T>);
}
```

### 2.3 高级类型

- 合理使用映射类型、条件类型等高级特性
- 避免过于复杂的类型定义
- 类型定义放在单独的类型文件中

## 3. React 组件规范

### 3.1 函数组件

- 优先使用函数组件和Hooks
- 组件命名使用大驼峰
- 组件文件使用 `PascalCase.tsx` 命名

```tsx
// ✅ 推荐
import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
}

/**
 * @description 通用按钮组件
 * @param {ButtonProps} props - 按钮属性
 */
export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  onClick,
  children 
}) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### 3.2 Hooks 使用

- Hooks 命名使用 `useXxx` 格式
- 自定义 Hook 放在 `hooks` 目录
- 避免在循环、条件或嵌套函数中调用 Hooks

```typescript
// ✅ 推荐
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(error);
      return defaultValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
```

### 3.3 组件结构

- 组件文件结构清晰
- 样式与逻辑分离
- 合理使用状态提升和状态管理

```tsx
// ✅ 推荐结构
import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import './Component.css'; // 样式文件

interface ComponentProps {
  // 属性定义
}

export const Component: React.FC<ComponentProps> = () => {
  // 状态定义
  const [data, setData] = useState<any[]>([]);
  
  // 副作用
  useEffect(() => {
    // 加载数据
  }, []);
  
  // 处理函数
  const handleSubmit = () => {
    // 处理逻辑
  };
  
  // 渲染逻辑
  return (
    <div className="component-container">
      {/* UI 元素 */}
    </div>
  );
};
```

## 4. Next.js 规范

### 4.1 路由结构

- 遵循 App Router 目录结构
- 页面组件放在 `app` 目录
- API 路由放在 `app/api` 目录

```
app/
  page.tsx         # 主页
  about/
    page.tsx       # 关于页面
  api/
    users/
      route.ts     # API 路由
```

### 4.2 Server Components

- 使用 `async/await` 处理数据获取
- 避免在 Server Components 中使用浏览器 API
- 合理使用数据缓存策略

```typescript
// app/users/page.tsx
import { getUserData } from '@/lib/userService';

export default async function UsersPage() {
  const users = await getUserData();
  
  return (
    <div>
      <h1>用户列表</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 4.3 API 路由

- 使用 Next.js API 路由格式
- 实现请求验证
- 使用标准的错误处理

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validated = userSchema.parse(body);
    
    // 处理逻辑
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' }, 
      { status: 400 }
    );
  }
}
```

## 5. 性能优化规范

### 5.1 组件优化

- 使用 `memo` 避免不必要的重渲染
- 合理使用 `useCallback` 和 `useMemo`
- 实现虚拟滚动处理大数据列表

```typescript
// ✅ 推荐
import { memo, useCallback, useMemo } from 'react';

const ExpensiveComponent = memo(({ data, onAction }: { 
  data: any; 
  onAction: () => void; 
}) => {
  return <div onClick={onAction}>{data.name}</div>;
});

export const ParentComponent = () => {
  const handleAction = useCallback(() => {
    // 处理逻辑
  }, []);
  
  const processedData = useMemo(() => {
    return { name: 'Processed' };
  }, []);
  
  return <ExpensiveComponent data={processedData} onAction={handleAction} />;
};
```

### 5.2 数据优化

- 实现增量更新
- 避免不必要的重新渲染
- 使用分页加载大量数据

## 6. 错误处理规范

### 6.1 异常处理

```typescript
// ✅ 推荐
try {
  // 可能出错的操作
} catch (error) {
  console.error('操作失败:', error);
  // 显示错误提示
}
```

### 6.2 错误类型

- 定义自定义错误类型
- 提供明确的错误信息
- 实现统一的错误处理机制

```typescript
class AppError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

try {
  throw new AppError('USER_NOT_FOUND', '用户不存在');
} catch (error) {
  if (error instanceof AppError) {
    console.error(`错误代码: ${error.code}, 错误信息: ${error.message}`);
  }
}
```

## 7. 测试规范

### 7.1 测试文件

- 测试文件放在 `__tests__` 目录
- 测试文件名使用 `*.test.ts` 或 `*.test.tsx` 格式
- 实现单元测试和集成测试

### 7.2 测试内容

- 测试函数的正常流程
- 测试边界条件
- 测试异常情况
- 测试关键业务逻辑

## 8. 代码审查标准

### 8.1 审查要点

- 代码风格符合规范
- 类型定义正确
- 没有明显的性能问题
- 错误处理完善
- 测试覆盖率达标
- 文档注释完整

### 8.2 代码质量指标

- TypeScript 编译无错误
- ESLint 检查无错误
- 单元测试通过率 100%
- 代码覆盖率 ≥ 80%

---

## 版本历史

| 版本 | 更新日期 | 更新内容 |
|------|----------|----------|
| 1.0.0 | 2025-12-05 | 文档标准化处理，添加文档头和统一编号格式 |
| 1.0.0 | 2024-10-15 | 初始版本 |

---

**本文档由 YYC³ Easy Table Converter 开发团队维护** 🌹

保持代码健康，稳步前行！ 🌹