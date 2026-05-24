# 📖 YYC³ Easy Table Converter 前端驱动使用指南

> **YYC³（YanYu Cloud Cube）**
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***英文***：*All Realms Converge at Cloud Nexus, DeepStack Ignites a New Era*

---

**创建日期**：2024-10-15
**作者**：YYC³团队
**版本**：1.0.0
**更新日期**：2024-10-15

## 🚀 快速开始

### 1. 项目结构概览

前端驱动模块位于项目的 `app/industries/frontend-driver/` 目录下，主要包含以下几个核心子目录：

```
frontend-driver/
├── hooks/          # React Hooks 集成
├── utils/          # 工具函数和核心实现
├── types/          # TypeScript 类型定义
├── components/     # 响应式UI组件
└── docs/           # 文档
```

### 2. 基本配置

在使用前端驱动之前，确保您的项目环境已经正确配置：

```bash
# 安装必要的依赖（如果尚未安装）
npm install --save react react-dom typescript
```

### 3. 导入模块

您可以直接从前端驱动模块导入所需的功能：

```typescript
// 导入状态管理相关功能
import { createStore, useStore, useSelector, useDispatch } from '@/industries/frontend-driver/hooks/useStore';
import { createSlice, createAsyncThunk } from '@/industries/frontend-driver/utils/SliceFactory';

// 导入响应式UI相关功能
import { useReactiveState, useReactiveComputed } from '@/industries/frontend-driver/hooks/useReactive';
import { ReactiveButton, ReactiveTextField } from '@/industries/frontend-driver/components/ReactiveComponents';

// 导入事件处理相关功能
import { createEventHandler } from '@/industries/frontend-driver/utils/EventHandler';
import { createGestureHandler } from '@/industries/frontend-driver/utils/GestureHandler';
import { createKeyboardHandler } from '@/industries/frontend-driver/utils/KeyboardHandler';
```

## 🔧 状态管理使用指南

### 1. 创建状态切片

使用 `createSlice` 创建一个状态切片，管理特定功能模块的状态：

```typescript
// counterSlice.ts
import { createSlice } from '@/industries/frontend-driver/utils/SliceFactory';

interface CounterState {
  value: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
  error: null,
};

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
    reset: (state) => {
      state.value = 0;
      state.error = null;
    },
  },
});

export const {
  increment,
  decrement,
  incrementByAmount,
  reset,
} = counterSlice.actions;

export default counterSlice.reducer;
```

### 2. 创建异步操作

使用 `createAsyncThunk` 创建处理异步逻辑的 action：

```typescript
// counterSlice.ts (继续添加)
import { createAsyncThunk } from '@/industries/frontend-driver/utils/SliceFactory';

// 模拟API调用
export const fetchCounterValue = createAsyncThunk(
  'counter/fetchValue',
  async (userId: string, { rejectWithValue }) => {
    try {
      // 这里可以替换为实际的API调用
      const response = await new Promise<{ value: number }>((resolve) => {
        setTimeout(() => resolve({ value: 42 }), 1000);
      });
      return response.value;
    } catch (error) {
      return rejectWithValue('Failed to fetch counter value');
    }
  }
);

// 更新切片以处理异步action
const updatedCounterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    // 前面已定义的reducer...
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCounterValue.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCounterValue.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.value = action.payload;
      })
      .addCase(fetchCounterValue.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});
```

### 3. 创建并使用 Store

将多个切片组合起来，创建一个全局的 Redux store：

```typescript
// store.ts
import { createStore, combineReducers } from '@/industries/frontend-driver/utils/StateStore';
import counterReducer from './counterSlice';
import userReducer from './userSlice'; // 假设您还有其他切片

// 组合reducer
const rootReducer = combineReducers({
  counter: counterReducer,
  user: userReducer,
  // 添加其他切片...
});

// 创建store
export const store = createStore(rootReducer);

// 导出RootState类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 4. 在 React 组件中使用

使用 `useStore`, `useSelector` 和 `useDispatch` 在 React 组件中访问和更新状态：

```tsx
// Counter.tsx
import { useStore, useSelector, useDispatch } from '@/industries/frontend-driver/hooks/useStore';
import { RootState } from './store';
import { increment, decrement, incrementByAmount, reset, fetchCounterValue } from './counterSlice';
import { useState } from 'react';

export const Counter = () => {
  const store = useStore();
  const counter = useSelector((state: RootState) => state.counter);
  const dispatch = useDispatch();
  const [incrementAmount, setIncrementAmount] = useState<string>('2');

  // 处理同步操作
  const handleIncrement = () => {
    dispatch(increment());
  };

  const handleDecrement = () => {
    dispatch(decrement());
  };

  const handleIncrementByAmount = () => {
    dispatch(incrementByAmount(Number(incrementAmount) || 0));
  };

  const handleReset = () => {
    dispatch(reset());
  };

  // 处理异步操作
  const handleFetchCounter = () => {
    dispatch(fetchCounterValue('user123'));
  };

  return (
    <div>
      <h1>Counter: {counter.value}</h1>
      
      {counter.status === 'loading' && <div>Loading...</div>}
      {counter.status === 'failed' && <div>Error: {counter.error}</div>}
      
      <div>
        <button onClick={handleDecrement}>-</button>
        <button onClick={handleIncrement}>+</button>
      </div>
      
      <div>
        <input 
          type="text" 
          value={incrementAmount}
          onChange={(e) => setIncrementAmount(e.target.value)}
        />
        <button onClick={handleIncrementByAmount}>Add Amount</button>
      </div>
      
      <button onClick={handleReset}>Reset</button>
      <button onClick={handleFetchCounter} disabled={counter.status === 'loading'}>
        {counter.status === 'loading' ? 'Fetching...' : 'Fetch Counter'}
      </button>
    </div>
  );
};
```

## ⚡ 响应式 UI 使用指南

### 1. 基本响应式状态

使用 `useReactiveState` 创建响应式状态，当状态变化时自动触发组件更新：

```tsx
// ReactiveCounter.tsx
import { useReactiveState } from '@/industries/frontend-driver/hooks/useReactive';

export const ReactiveCounter = () => {
  // 创建响应式状态对象
  const state = useReactiveState({
    count: 0,
    message: 'Hello World'
  });

  // 状态更新会自动触发组件重新渲染
  const increment = () => {
    state.count++;
  };

  const updateMessage = () => {
    state.message = `Count is now: ${state.count}`;
  };

  return (
    <div>
      <h1>Count: {state.count}</h1>
      <p>{state.message}</p>
      <button onClick={increment}>+</button>
      <button onClick={updateMessage}>Update Message</button>
    </div>
  );
};
```

### 2. 计算属性

使用 `useReactiveComputed` 创建计算属性，实现派生状态：

```tsx
// ShoppingCart.tsx
import { useReactiveState, useReactiveComputed } from '@/industries/frontend-driver/hooks/useReactive';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const ShoppingCart = () => {
  const state = useReactiveState({
    items: [
      { id: '1', name: 'Product 1', price: 10.99, quantity: 1 },
      { id: '2', name: 'Product 2', price: 19.99, quantity: 2 },
    ] as CartItem[],
  });

  // 计算总金额
  const total = useReactiveComputed(() => {
    return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  // 计算商品总数
  const itemCount = useReactiveComputed(() => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  });

  // 更新商品数量
  const updateQuantity = (id: string, quantity: number) => {
    const item = state.items.find(item => item.id === id);
    if (item) {
      item.quantity = Math.max(0, quantity);
    }
  };

  return (
    <div>
      <h2>Shopping Cart</h2>
      {state.items.map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          <span>${item.price.toFixed(2)}</span>
          <input 
            type="number" 
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
      ))}
      <div>
        <strong>Total Items: {itemCount}</strong>
      </div>
      <div>
        <strong>Total Price: ${total.toFixed(2)}</strong>
      </div>
    </div>
  );
};
```

### 3. 响应式副作用

使用 `useReactiveEffect` 处理响应式状态变化引起的副作用：

```tsx
// ThemeToggle.tsx
import { useReactiveState, useReactiveEffect } from '@/industries/frontend-driver/hooks/useReactive';

export const ThemeToggle = () => {
  const state = useReactiveState({
    isDarkMode: false,
  });

  // 当isDarkMode变化时，更新document的class和localStorage
  useReactiveEffect(() => {
    // 更新document的class
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }

    // 保存到localStorage
    localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');

    // 清理函数（可选）
    return () => {
      // 组件卸载时的清理工作
      console.log('Theme effect cleaned up');
    };
  }, [state.isDarkMode]);

  // 切换主题
  const toggleTheme = () => {
    state.isDarkMode = !state.isDarkMode;
  };

  return (
    <div>
      <p>Current Theme: {state.isDarkMode ? 'Dark' : 'Light'}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};
```

### 4. 使用响应式组件

前端驱动提供了一系列预定义的响应式组件，可以直接在项目中使用：

```tsx
// FormExample.tsx
import { ReactiveButton, ReactiveTextField, ReactiveCheckbox } from '@/industries/frontend-driver/components/ReactiveComponents';
import { useReactiveState } from '@/industries/frontend-driver/hooks/useReactive';

export const FormExample = () => {
  const state = useReactiveState({
    username: '',
    email: '',
    rememberMe: false,
    isSubmitting: false,
  });

  const handleSubmit = async () => {
    state.isSubmitting = true;
    try {
      // 模拟表单提交
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form submitted:', {
        username: state.username,
        email: state.email,
        rememberMe: state.rememberMe,
      });
      // 重置表单
      state.username = '';
      state.email = '';
      state.rememberMe = false;
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      state.isSubmitting = false;
    }
  };

  return (
    <div className="form">
      <h2>Registration Form</h2>
      
      <ReactiveTextField
        label="Username"
        value={state.username}
        onChange={(value) => { state.username = value; }}
        placeholder="Enter your username"
        required
        error={state.username.length < 3 && state.username.length > 0 ? 'Username must be at least 3 characters' : ''}
      />
      
      <ReactiveTextField
        label="Email"
        value={state.email}
        onChange={(value) => { state.email = value; }}
        placeholder="Enter your email"
        required
        type="email"
        error={!state.email.includes('@') && state.email.length > 0 ? 'Invalid email format' : ''}
      />
      
      <ReactiveCheckbox
        label="Remember me"
        checked={state.rememberMe}
        onChange={(checked) => { state.rememberMe = checked; }}
      />
      
      <ReactiveButton
        onClick={handleSubmit}
        disabled={state.isSubmitting || state.username.length < 3 || !state.email.includes('@')}
        loading={state.isSubmitting}
        variant="primary"
      >
        Register
      </ReactiveButton>
    </div>
  );
};
```

## 🎮 事件处理使用指南

### 1. 基本事件处理

使用 `EventHandler` 创建和管理自定义事件：

```tsx
// EventExample.tsx
import { useEffect, useRef } from 'react';
import { createEventHandler } from '@/industries/frontend-driver/utils/EventHandler';

export const EventExample = () => {
  const eventHandlerRef = useRef<ReturnType<typeof createEventHandler>>();
  const [message, setMessage] = useState('');
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    // 初始化事件处理器
    eventHandlerRef.current = createEventHandler();

    // 注册事件监听器
    eventHandlerRef.current.on('message', (data) => {
      setMessage(data.text);
    });

    // 注册一次性事件监听器
    eventHandlerRef.current.once('counterReset', () => {
      setCounter(0);
      console.log('Counter reset (one-time event)');
    });

    return () => {
      // 清理事件处理器
      if (eventHandlerRef.current) {
        eventHandlerRef.current.destroy();
      }
    };
  }, []);

  // 触发事件
  const handleSendMessage = () => {
    eventHandlerRef.current?.emit('message', { 
      text: 'Hello from EventHandler!',
      timestamp: new Date().toISOString() 
    });
    setCounter(prev => prev + 1);
  };

  const handleResetCounter = () => {
    eventHandlerRef.current?.emit('counterReset');
  };

  return (
    <div>
      <h2>Event Handler Example</h2>
      <p>Message: {message}</p>
      <p>Counter: {counter}</p>
      <button onClick={handleSendMessage}>Send Message</button>
      <button onClick={handleResetCounter}>Reset Counter</button>
    </div>
  );
};
```

### 2. 手势识别

使用 `GestureHandler` 处理各种触摸手势：

```tsx
// GestureExample.tsx
import { useEffect, useRef, useState } from 'react';
import { createGestureHandler } from '@/industries/frontend-driver/utils/GestureHandler';

export const GestureExample = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureHandlerRef = useRef<ReturnType<typeof createGestureHandler>>();
  const [gestureInfo, setGestureInfo] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;

    // 初始化手势处理器
    gestureHandlerRef.current = createGestureHandler(containerRef.current);

    // 监听各种手势事件
    gestureHandlerRef.current.on('tap', (event) => {
      setGestureInfo(`Tap at position (${event.x}, ${event.y})`);
    });

    gestureHandlerRef.current.on('swipe', (event) => {
      let direction = '';
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        direction = event.deltaX > 0 ? 'Right' : 'Left';
      } else {
        direction = event.deltaY > 0 ? 'Down' : 'Up';
      }
      setGestureInfo(`Swipe ${direction}`);
    });

    gestureHandlerRef.current.on('pinch', (event) => {
      setGestureInfo(`Pinch scale: ${event.scale?.toFixed(2)}`);
    });

    gestureHandlerRef.current.on('rotate', (event) => {
      setGestureInfo(`Rotate: ${event.rotation?.toFixed(2)} degrees`);
    });

    return () => {
      // 清理手势处理器
      if (gestureHandlerRef.current) {
        gestureHandlerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div>
      <h2>Gesture Handler Example</h2>
      <p>{gestureInfo}</p>
      <div 
        ref={containerRef}
        style={{
          width: '300px',
          height: '300px',
          backgroundColor: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '20px 0',
          touchAction: 'none', // 禁用浏览器默认触摸行为
          userSelect: 'none', // 防止选择文本
          cursor: 'pointer'
        }}
      >
        <p>Perform gestures here</p>
      </div>
      <p>Try tap, double tap, swipe, pinch, rotate, and long press</p>
    </div>
  );
};
```

### 3. 键盘事件处理

使用 `KeyboardHandler` 处理键盘输入和快捷键：

```tsx
// KeyboardExample.tsx
import { useEffect, useRef, useState } from 'react';
import { createKeyboardHandler } from '@/industries/frontend-driver/utils/KeyboardHandler';

export const KeyboardExample = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardHandlerRef = useRef<ReturnType<typeof createKeyboardHandler>>();
  const [keyInfo, setKeyInfo] = useState('');
  const [shortcutActive, setShortcutActive] = useState(false);

  useEffect(() => {
    if (!inputRef.current) return;

    // 初始化键盘处理器
    keyboardHandlerRef.current = createKeyboardHandler(inputRef.current);

    // 监听键盘事件
    keyboardHandlerRef.current.on('keydown', (event) => {
      const modifierState = keyboardHandlerRef.current?.getModifierState();
      const modifiers = [];
      
      if (modifierState?.ctrl) modifiers.push('Ctrl');
      if (modifierState?.shift) modifiers.push('Shift');
      if (modifierState?.alt) modifiers.push('Alt');
      if (modifierState?.meta) modifiers.push('Meta');
      
      const keyInfoText = `${modifiers.length ? modifiers.join('+') + '+' : ''}${event.key}`;
      setKeyInfo(keyInfoText);
    });

    // 注册快捷键
    keyboardHandlerRef.current.registerShortcut('Ctrl+S', (event) => {
      event.preventDefault();
      setShortcutActive(true);
      setTimeout(() => setShortcutActive(false), 1000);
      console.log('Save shortcut pressed!');
    }, {
      description: 'Save document',
      preventDefault: true
    });

    return () => {
      // 清理键盘处理器
      if (keyboardHandlerRef.current) {
        keyboardHandlerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div>
      <h2>Keyboard Handler Example</h2>
      <div>
        <label>Press keys in the input field:</label>
        <input 
          ref={inputRef} 
          type="text" 
          placeholder="Type here..."
          style={{ width: '300px', padding: '5px' }}
        />
      </div>
      <p>Last key pressed: <strong>{keyInfo}</strong></p>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Keyboard Shortcuts:</h3>
        <div>
          <kbd>Ctrl+S</kbd> - Save (simulated)
          {shortcutActive && (
            <span style={{ color: 'green', marginLeft: '10px' }}>✓ Saved!</span>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 4. 拖拽功能

使用 `DragDropHandler` 实现元素拖拽和放置功能：

```tsx
// DragDropExample.tsx
import { useEffect, useRef, useState } from 'react';
import { createDragDropHandler } from '@/industries/frontend-driver/utils/DragDropHandler';

export const DragDropExample = () => {
  const dragDropHandlerRef = useRef<ReturnType<typeof createDragDropHandler>>();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [droppedItems, setDroppedItems] = useState<string[]>([]);

  useEffect(() => {
    // 初始化拖拽处理器
    dragDropHandlerRef.current = createDragDropHandler();

    // 为可拖拽元素添加拖拽功能
    const draggableElements = document.querySelectorAll('.draggable-item');
    draggableElements.forEach((element) => {
      dragDropHandlerRef.current?.makeDraggable(element as HTMLElement, {
        data: element.textContent,
        type: 'text/plain',
        onDragStart: (event, data) => {
          setDraggedItem(data as string);
          console.log('Drag started:', data);
        },
        onDragEnd: () => {
          setDraggedItem(null);
          console.log('Drag ended');
        }
      });
    });

    // 添加放置区域
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
      dragDropHandlerRef.current?.addDropZone(dropZone, {
        acceptTypes: ['text/plain'],
        onDragEnter: () => {
          setDropZoneActive(true);
          console.log('Drag entered drop zone');
        },
        onDragOver: (event) => {
          // 阻止默认行为以允许放置
          event.preventDefault();
        },
        onDragLeave: () => {
          setDropZoneActive(false);
          console.log('Drag left drop zone');
        },
        onDrop: (event, data) => {
          setDropZoneActive(false);
          setDroppedItems(prev => [...prev, data as string]);
          console.log('Dropped:', data);
        },
        onFileDrop: (event, files) => {
          console.log('Files dropped:', files);
        }
      });
    }

    return () => {
      // 清理拖拽处理器
      if (dragDropHandlerRef.current) {
        dragDropHandlerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div>
      <h2>Drag and Drop Example</h2>
      
      <div style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0' }}>
        <div>
          <h3>Draggable Items</h3>
          <div className="draggable-item" style={{ 
            padding: '10px', 
            margin: '5px 0', 
            backgroundColor: '#f0f0f0',
            cursor: 'grab',
            border: '1px solid #ccc',
            userSelect: 'none'
          }}>
            Item 1
          </div>
          <div className="draggable-item" style={{ 
            padding: '10px', 
            margin: '5px 0', 
            backgroundColor: '#f0f0f0',
            cursor: 'grab',
            border: '1px solid #ccc',
            userSelect: 'none'
          }}>
            Item 2
          </div>
          <div className="draggable-item" style={{ 
            padding: '10px', 
            margin: '5px 0', 
            backgroundColor: '#f0f0f0',
            cursor: 'grab',
            border: '1px solid #ccc',
            userSelect: 'none'
          }}>
            Item 3
          </div>
        </div>
        
        <div 
          id="drop-zone" 
          style={{
            width: '200px',
            height: '200px',
            padding: '10px',
            backgroundColor: dropZoneActive ? '#e6f7ff' : '#f5f5f5',
            border: `2px ${dropZoneActive ? 'dashed #1890ff' : 'dashed #d9d9d9'}`,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <h3>Drop Zone</h3>
          {draggedItem && (
            <p style={{ color: '#1890ff' }}>Dragging: {draggedItem}</p>
          )}
          {!droppedItems.length && (
            <p>Drop items here</p>
          )}
        </div>
      </div>
      
      {droppedItems.length > 0 && (
        <div>
          <h3>Dropped Items:</h3>
          <ul>
            {droppedItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

## 🎨 动画效果使用指南

使用 `AnimationHandler` 为元素添加动画效果：

```tsx
// AnimationExample.tsx
import { useEffect, useRef, useState } from 'react';
import { createAnimationHandler } from '@/industries/frontend-driver/utils/AnimationHandler';

export const AnimationExample = () => {
  const animationHandlerRef = useRef<ReturnType<typeof createAnimationHandler>>();
  const animatedElementRef = useRef<HTMLDivElement>(null);
  const [animationName, setAnimationName] = useState('fadeIn');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // 初始化动画处理器
    animationHandlerRef.current = createAnimationHandler();

    return () => {
      // 清理动画处理器
      if (animationHandlerRef.current) {
        animationHandlerRef.current.destroy();
      }
    };
  }, []);

  // 执行预设动画
  const runAnimation = () => {
    if (!animatedElementRef.current || !animationHandlerRef.current) return;

    setIsAnimating(true);
    
    // 执行动画并获取动画控制对象
    const animationControl = animationHandlerRef.current.preset(
      animatedElementRef.current,
      animationName as any,
      {
        duration: 1000,
        easing: 'ease-in-out',
        fill: 'both'
      }
    );

    // 监听动画完成
    animationControl.onFinish(() => {
      setIsAnimating(false);
    });
  };

  // 可用的预设动画列表
  const animations = [
    'fadeIn', 'fadeOut',
    'slideInLeft', 'slideInRight', 'slideInTop', 'slideInBottom',
    'slideOutLeft', 'slideOutRight', 'slideOutTop', 'slideOutBottom',
    'zoomIn', 'zoomOut',
    'rotateIn', 'rotateOut',
    'bounce', 'shake', 'pulse', 'flip'
  ];

  return (
    <div>
      <h2>Animation Handler Example</h2>
      
      <div style={{ margin: '20px 0' }}>
        <label htmlFor="animation-select">Select Animation:</label>
        <select 
          id="animation-select"
          value={animationName}
          onChange={(e) => setAnimationName(e.target.value)}
          style={{ marginLeft: '10px' }}
        >
          {animations.map(anim => (
            <option key={anim} value={anim}>{anim}</option>
          ))}
        </select>
        
        <button 
          onClick={runAnimation}
          disabled={isAnimating}
          style={{ marginLeft: '10px' }}
        >
          {isAnimating ? 'Animating...' : 'Run Animation'}
        </button>
      </div>
      
      <div 
        ref={animatedElementRef}
        style={{
          width: '200px',
          height: '200px',
          backgroundColor: '#1890ff',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '20px 0',
          borderRadius: '8px'
        }}
      >
        Animated Element
      </div>
    </div>
  );
};
```

## 🚀 高级交互使用指南

使用 `AdvancedInteractionHandler` 实现复杂的交互场景：

```tsx
// AdvancedInteractionExample.tsx
import { useEffect, useRef } from 'react';
import { createAdvancedInteractionHandler } from '@/industries/frontend-driver/utils/AdvancedInteractionHandler';

export const AdvancedInteractionExample = () => {
  const interactionHandlerRef = useRef<ReturnType<typeof createAdvancedInteractionHandler>>();
  const interactiveElementRef = useRef<HTMLDivElement>(null);
  const [currentState, setCurrentState] = useState('idle');
  const [combinationTriggered, setCombinationTriggered] = useState(false);

  useEffect(() => {
    if (!interactiveElementRef.current) return;

    // 初始化高级交互处理器
    interactionHandlerRef.current = createAdvancedInteractionHandler();

    // 初始化交互元素
    interactionHandlerRef.current.initialize(interactiveElementRef.current, {
      draggable: true,
      gestures: true,
      keyboard: true,
      animations: true,
      stateStyles: {
        idle: { backgroundColor: '#f5f5f5' },
        hover: { backgroundColor: '#e6f7ff', cursor: 'pointer' },
        active: { backgroundColor: '#bae7ff' },
        focus: { outline: '2px solid #1890ff' },
        disabled: { opacity: 0.5, cursor: 'not-allowed' },
        loading: { backgroundColor: '#fff7e6' },
        error: { backgroundColor: '#fff2f0' },
        success: { backgroundColor: '#f6ffed' }
      },
      combinationRules: [
        {
          condition: (context) => context.currentState === 'hover' && context.eventData?.ctrlKey,
          action: (context) => {
            context.element.style.backgroundColor = '#52c41a';
            setCombinationTriggered(true);
            setTimeout(() => setCombinationTriggered(false), 1000);
          },
          priority: 50
        }
      ]
    });

    // 监听状态变化
    interactionHandlerRef.current.on('stateChange', (event) => {
      setCurrentState(event.context.currentState);
    });

    // 监听组合规则触发
    interactionHandlerRef.current.on('combinationTriggered', (event) => {
      console.log('Combination rule triggered:', event.rule?.description);
    });

    return () => {
      // 清理交互处理器
      if (interactionHandlerRef.current && interactiveElementRef.current) {
        interactionHandlerRef.current.destroy(interactiveElementRef.current);
      }
    };
  }, []);

  // 手动切换状态
  const changeState = (state: string) => {
    if (interactionHandlerRef.current && interactiveElementRef.current) {
      interactionHandlerRef.current.setState(interactiveElementRef.current, state as any);
    }
  };

  return (
    <div>
      <h2>Advanced Interaction Handler Example</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Current State: </label>
        <strong>{currentState}</strong>
        {combinationTriggered && (
          <span style={{ color: '#52c41a', marginLeft: '10px' }}>✓ Combination triggered!</span>
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Try these interactions:</label>
        <ul>
          <li>Hover over the element</li>
          <li>Click and drag the element</li>
          <li>Press Ctrl key while hovering (triggers combination rule)</li>
          <li>Press Tab to focus the element</li>
          <li>Use arrow keys to move the element when focused</li>
        </ul>
      </div>
      
      <div 
        ref={interactiveElementRef}
        style={{
          width: '200px',
          height: '200px',
          padding: '20px',
          borderRadius: '8px',
          userSelect: 'none'
        }}
        tabIndex={0}
      >
        <h3>Interactive Element</h3>
        <p>Try various interactions</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <label>Manual State Change:</label>
        <button onClick={() => changeState('idle')}>Idle</button>
        <button onClick={() => changeState('loading')}>Loading</button>
        <button onClick={() => changeState('error')}>Error</button>
        <button onClick={() => changeState('success')}>Success</button>
        <button onClick={() => changeState('disabled')}>Disabled</button>
      </div>
    </div>
  );
};
```

## 🔄 实际应用案例

### 1. 数据表格组件

结合状态管理、响应式UI和事件处理，创建一个完整的数据表格组件：

```tsx
// DataTable.tsx
import { useState, useEffect, useMemo } from 'react';
import { useReactiveState, useReactiveComputed } from '@/industries/frontend-driver/hooks/useReactive';
import { createEventHandler } from '@/industries/frontend-driver/utils/EventHandler';

interface TableData {
  id: string;
  name: string;
  value: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export const DataTable = () => {
  // 响应式状态
  const state = useReactiveState({
    loading: false,
    error: null as string | null,
    searchQuery: '',
    sortField: 'name',
    sortDirection: 'asc' as 'asc' | 'desc',
    currentPage: 1,
    pageSize: 10,
  });

  // 普通状态（数据）
  const [rawData, setRawData] = useState<TableData[]>([]);
  const eventHandlerRef = useMemo(() => createEventHandler(), []);

  // 计算属性 - 过滤和排序数据
  const processedData = useReactiveComputed(() => {
    // 过滤
    let filtered = [...rawData].filter(item => 
      item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(state.searchQuery.toLowerCase())
    );

    // 排序
    filtered.sort((a, b) => {
      const fieldA = a[state.sortField as keyof TableData];
      const fieldB = b[state.sortField as keyof TableData];

      let comparison = 0;
      if (fieldA > fieldB) {
        comparison = 1;
      } else if (fieldA < fieldB) {
        comparison = -1;
      }
      return state.sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [rawData]);

  // 计算属性 - 分页数据
  const paginatedData = useReactiveComputed(() => {
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData]);

  // 计算属性 - 总页数
  const totalPages = useReactiveComputed(() => {
    return Math.ceil(processedData.length / state.pageSize);
  }, [processedData]);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      state.loading = true;
      state.error = null;

      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 生成模拟数据
        const mockData: TableData[] = Array.from({ length: 100 }, (_, i) => ({
          id: `item-${i + 1}`,
          name: `Item ${i + 1}`,
          value: Math.floor(Math.random() * 1000),
          status: Math.random() > 0.5 ? 'active' : 'inactive',
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 31536000000)).toISOString()
        }));

        setRawData(mockData);
      } catch (error) {
        state.error = 'Failed to load data';
        console.error('Error loading data:', error);
      } finally {
        state.loading = false;
      }
    };

    loadData();

    // 清理
    return () => {
      eventHandlerRef.destroy();
    };
  }, []);

  // 处理排序
  const handleSort = (field: keyof TableData) => {
    if (state.sortField === field) {
      state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortField = field as string;
      state.sortDirection = 'asc';
    }
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    state.currentPage = page;
  };

  // 处理删除
  const handleDelete = (id: string) => {
    setRawData(prev => prev.filter(item => item.id !== id));
    eventHandlerRef.emit('itemDeleted', { id });
  };

  // 处理行点击
  const handleRowClick = (item: TableData) => {
    eventHandlerRef.emit('rowClick', item);
    console.log('Row clicked:', item);
  };

  return (
    <div className="data-table-container">
      <h2>Data Table Example</h2>
      
      {/* 控制面板 */}
      <div className="table-controls" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search..."
          value={state.searchQuery}
          onChange={(e) => { state.searchQuery = e.target.value; state.currentPage = 1; }}
          style={{ padding: '5px', width: '200px' }}
        />
      </div>
      
      {/* 错误信息 */}
      {state.error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          Error: {state.error}
        </div>
      )}
      
      {/* 加载状态 */}
      {state.loading ? (
        <div>Loading data...</div>
      ) : (
        <>
          {/* 表格 */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ddd' }}>
                  ID {state.sortField === 'id' && (state.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ddd' }}>
                  Name {state.sortField === 'name' && (state.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('value')} style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ddd' }}>
                  Value {state.sortField === 'value' && (state.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ddd' }}>
                  Status {state.sortField === 'status' && (state.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ddd' }}>
                  Created At {state.sortField === 'createdAt' && (state.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleRowClick(item)}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: item.status === 'active' ? '#f6ffed' : '#fff2f0'
                    }}
                  >
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.id}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.name}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.value}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <span style={{ 
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: item.status === 'active' ? '#52c41a' : '#ff4d4f',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '5px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={state.currentPage === page}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: state.currentPage === page ? '#1890ff' : 'white',
                    color: state.currentPage === page ? 'white' : 'black',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: state.currentPage === page ? 'default' : 'pointer'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

## 🎯 总结

通过本指南，您已经了解了如何使用前端驱动模块的核心功能，包括：

- **状态管理**：使用类似Redux的状态管理系统
- **响应式UI**：使用基于依赖追踪的响应式状态管理
- **事件处理**：实现各种交互事件的监听和处理
- **动画效果**：为元素添加各种动画和过渡效果
- **高级交互**：处理复杂的交互场景和组合操作

前端驱动模块提供了一套完整、灵活且强大的工具集，可以帮助您快速构建高性能、可维护的现代Web应用。通过组合使用这些功能，您可以实现复杂的用户界面和交互体验。

如果您有任何问题或需要更多信息，请参考详细的API文档或联系开发团队。

保持代码健康，稳步前行！ 🌹
