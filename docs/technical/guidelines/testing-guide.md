# 🧪 YYC³ Easy Table Converter 测试指南

> **YYC³（YanYu Cloud Cube）**
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***英文***：*All Realms Converge at Cloud Nexus, DeepStack Ignites a New Era*

---

**创建日期**：2024-10-15
**作者**：YYC
**版本**：1.0.0
**更新日期**：2025-12-05

## 1. 测试策略概述

### 1.1 测试分层

| 测试类型 | 目的 | 范围 | 工具 |
|---------|------|------|------|
| 单元测试 | 验证单个组件/函数 | 独立模块 | Jest |
| 集成测试 | 验证模块间协作 | 多个模块 | Jest + React Testing Library |
| E2E测试 | 验证完整用户流程 | 端到端 | Playwright/Cypress |
| 性能测试 | 验证性能指标 | 关键路径 | Lighthouse |

### 1.2 测试覆盖率目标

- **单元测试**: ≥ 80%
- **关键业务逻辑**: ≥ 90%
- **UI组件**: ≥ 75%
- **API路由**: ≥ 90%

## 2. 单元测试规范

### 2.1 测试文件结构

```
__tests__/
  components/       # 组件测试
  services/         # 服务测试
  utils/            # 工具函数测试
  hooks/            # Hooks测试
  api/              # API测试
```

### 2.2 测试文件命名

```
# ✅ 推荐
component.test.tsx     # 组件测试
function.test.ts       # 函数测试
hook.test.ts          # Hook测试
service.test.ts        # 服务测试
```

### 2.3 测试用例编写

```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from 'jest';
import { myFunction } from '@/utils/myFunction';

describe('myFunction', () => {
  // 测试准备
  beforeEach(() => {
    // 设置测试环境
  });
  
  // 测试清理
  afterEach(() => {
    // 清理测试环境
    jest.clearAllMocks();
  });
  
  // 正常情况测试
  it('should return correct result when valid input', () => {
    // 准备
    const input = { value: 10 };
    
    // 执行
    const result = myFunction(input);
    
    // 断言
    expect(result).toBe(20);
    expect(result).toBeGreaterThan(0);
  });
  
  // 边界条件测试
  it('should handle empty input correctly', () => {
    const input = {};
    const result = myFunction(input);
    expect(result).toBe(0);
  });
  
  // 异常情况测试
  it('should throw error when invalid input', () => {
    const input = null;
    expect(() => myFunction(input)).toThrow('Invalid input');
  });
});
```

## 3. React 组件测试

### 3.1 使用 React Testing Library

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('should render button with correct text', () => {
    // 渲染组件
    render(<Button>点击我</Button>);
    
    // 查找元素
    const buttonElement = screen.getByRole('button', { name: /点击我/i });
    
    // 断言
    expect(buttonElement).toBeInTheDocument();
  });
  
  it('should call onClick when clicked', () => {
    // 模拟点击事件
    const handleClick = jest.fn();
    
    render(<Button onClick={handleClick}>点击我</Button>);
    
    // 触发事件
    fireEvent.click(screen.getByRole('button'));
    
    // 验证回调被调用
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('should apply correct variant styles', () => {
    render(<Button variant="primary">主要按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });
});
```

### 3.2 Mock 外部依赖

```typescript
import { render } from '@testing-library/react';
import { UserProfile } from '@/components/UserProfile';
import { getUserData } from '@/services/userService';

// Mock 服务
jest.mock('@/services/userService');
const mockGetUserData = getUserData as jest.MockedFunction<typeof getUserData>;

describe('UserProfile', () => {
  beforeEach(() => {
    mockGetUserData.mockResolvedValue({ id: '1', name: 'YYC' });
  });
  
  it('should display user data', async () => {
    render(<UserProfile userId="1" />);
    const userName = await screen.findByText('YYC');
    expect(userName).toBeInTheDocument();
  });
});
```

## 4. API 测试

### 4.1 Mock 服务器响应

```typescript
import { describe, it, expect, jest } from 'jest';
import { fetchUsers } from '@/api/userApi';

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;

describe('fetchUsers', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });
  
  it('should fetch users successfully', async () => {
    // 准备模拟响应
    const mockUsers = [{ id: '1', name: 'YYC' }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUsers,
    } as Response);
    
    // 执行
    const users = await fetchUsers();
    
    // 断言
    expect(users).toEqual(mockUsers);
    expect(mockFetch).toHaveBeenCalledWith('/api/users');
  });
  
  it('should handle fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    await expect(fetchUsers()).rejects.toThrow('Network error');
  });
});
```

### 4.2 Next.js API 路由测试

```typescript
import { describe, it, expect, jest } from 'jest';
import { POST } from '@/app/api/users/route';
import { NextRequest } from 'next/server';

describe('API /api/users', () => {
  it('should create user successfully', async () => {
    // 创建模拟请求
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        name: 'YYC',
        email: 'yyc@example.com',
      }),
    } as NextRequest;
    
    // 执行API路由
    const response = await POST(mockRequest);
    
    // 验证响应
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

## 5. Hooks 测试

### 5.1 自定义 Hook 测试

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });
  
  it('should increment count', () => {
    const { result } = renderHook(() => useCounter(5));
    
    // 执行Hook方法
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(6);
  });
  
  it('should decrement count', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });
  
  it('should reset count', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.increment();
      result.current.reset();
    });
    
    expect(result.current.count).toBe(5);
  });
});
```

## 6. 测试工具和辅助函数

### 6.1 测试工厂

```typescript
// tests/factories/userFactory.ts
import { User } from '@/types/user';

export const createUser = (overrides?: Partial<User>): User => {
  return {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  };
};

// 使用示例
const user = createUser({ name: 'YYC' });
```

### 6.2 Mock 服务

```typescript
// tests/mocks/serviceMock.ts
export const mockUserService = {
  getUser: jest.fn().mockResolvedValue(createUser()),
  createUser: jest.fn().mockResolvedValue({ id: '1' }),
  deleteUser: jest.fn().mockResolvedValue(true),
};

// Jest配置
describe('Component', () => {
  beforeEach(() => {
    jest.doMock('@/services/userService', () => mockUserService);
  });
});
```

## 7. 测试命令

### 7.1 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- path/to/file.test.ts

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 监视模式运行测试
npm test -- --watch
```

### 7.2 测试报告

```bash
# 生成HTML覆盖率报告
npm test -- --coverage --coverageDirectory=coverage --coverageReporters=html

# 查看覆盖率报告
open coverage/index.html
```

## 8. 常见测试模式

### 8.1 异步测试

```typescript
// Promise方式
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe(true);
});

// 回调方式
it('should handle callback', (done) => {
  functionCallback((error, result) => {
    expect(error).toBeNull();
    expect(result).toBe(true);
    done();
  });
});
```

### 8.2 Mock 时间

```typescript
// 模拟时间
import { jest } from 'jest';

describe('time-based function', () => {
  it('should handle time correctly', () => {
    const mockDate = new Date('2024-10-15T00:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    
    const result = getCurrentDate();
    expect(result).toBe('2024-10-15');
    
    // 恢复原始Date
    jest.restoreAllMocks();
  });
});
```

---

## 版本历史

| 版本 | 更新日期 | 更新内容 |
|------|----------|----------|
| 1.0.0 | 2025-12-05 | 文档标准化处理，添加文档头和统一编号格式 |
| 1.0.0 | 2024-10-15 | 初始版本 |

---

**本文档由 YYC³ Easy Table Converter 开发团队维护** 🌹

编写高质量的测试，保障代码健康！ 🌹