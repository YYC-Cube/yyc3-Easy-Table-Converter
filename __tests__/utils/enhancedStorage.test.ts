/**
 * @file EnhancedStorage 单元测试
 * @description 测试增强的本地存储管理器
 */

import { EnhancedStorage } from '@/lib/utils/enhancedStorage';

describe('EnhancedStorage', () => {
  let localStorageMock: Record<string, string>;
  
  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete localStorageMock[key];
        }),
        clear: jest.fn(() => {
          localStorageMock = {};
        }),
        get length() { return Object.keys(localStorageMock).length; },
      },
      writable: true,
    });
  });

  describe('setItem', () => {
    it('应该成功存储数据', () => {
      const result = EnhancedStorage.setItem('test-key', { name: 'test' });

      expect(result).toBe(true);
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    it('应该存储带TTL的数据', () => {
      const ttl = 60000; // 1分钟
      EnhancedStorage.setItem('temp-data', 'value', ttl);

      const stored = JSON.parse(localStorageMock['temp-data']);
      expect(stored.value).toBe('value');
      expect(stored.expires).toBeDefined();
      expect(stored.timestamp).toBeDefined();
    });

    it('应该处理不带TTL的数据', () => {
      EnhancedStorage.setItem('permanent', 'data');

      const stored = JSON.parse(localStorageMock['permanent']);
      expect(stored.expires).toBeUndefined();
    });

    it('应该存储不同类型的数据', () => {
      // 字符串
      expect(EnhancedStorage.setItem('str', 'text')).toBe(true);
      
      // 数字
      expect(EnhancedStorage.setItem('num', 42)).toBe(true);
      
      // 布尔值
      expect(EnhancedStorage.setItem('bool', true)).toBe(true);
      
      // 对象
      expect(EnhancedStorage.setItem('obj', { nested: 'data' })).toBe(true);
      
      // 数组
      expect(EnhancedStorage.setItem('arr', [1, 2, 3])).toBe(true);
    });
  });

  describe('getItem', () => {
    it('应该正确获取已存储的数据', () => {
      EnhancedStorage.setItem('key1', 'value1');
      
      const result = EnhancedStorage.getItem<string>('key1');
      
      expect(result).toBe('value1');
    });

    it('应该返回null对于不存在的键', () => {
      const result = EnhancedStorage.getItem('nonexistent');
      
      expect(result).toBeNull();
    });

    it('应该返回null对于已过期的数据', () => {
      // 设置一个已经过期的数据（TTL为-1000ms）
      EnhancedStorage.setItem('expired', 'data', -1000);
      
      const result = EnhancedStorage.getItem('expired');
      
      expect(result).toBeNull();
    });

    it('应该返回未过期的数据', () => {
      // 设置一个很长的TTL
      EnhancedStorage.setItem('valid', 'data', 9999999999999);
      
      const result = EnhancedStorage.getItem('valid');
      
      expect(result).toBe('data');
    });

    it('应该解析JSON对象', () => {
      const objData = { name: 'Alice', age: 30, items: [1, 2, 3] };
      EnhancedStorage.setItem('object', objData);
      
      const result = EnhancedStorage.getItem<typeof objData>('object');
      
      expect(result).toEqual(objData);
      expect(result?.name).toBe('Alice');
      expect(result?.items).toHaveLength(3);
    });

    it('应该在JSON解析失败时返回null', () => {
      localStorageMock['invalid'] = '{invalid json';
      
      const result = EnhancedStorage.getItem('invalid');
      
      expect(result).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('应该正确删除已存储的数据', () => {
      EnhancedStorage.setItem('to-remove', 'value');
      expect(EnhancedStorage.getItem('to-remove')).toBe('value');

      EnhancedStorage.removeItem('to-remove');
      
      expect(EnhancedStorage.getItem('to-remove')).toBeNull();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('to-remove');
    });

    it('应该安全处理删除不存在的键', () => {
      expect(() => {
        EnhancedStorage.removeItem('nonexistent');
      }).not.toThrow();
    });
  });

  describe('错误处理', () => {
    it('应该处理localStorage满的情况', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      try {
        const originalGetItem = window.localStorage.getItem;
        const originalSetItem = window.localStorage.setItem;
        const originalRemoveItem = window.localStorage.removeItem;
        
        window.localStorage.setItem = jest.fn((key: string) => {
          if (key !== 'enhanced_storage_info') {
            throw new DOMException('QuotaExceededError', 'QuotaExceededError');
          }
        });
        window.localStorage.getItem = jest.fn((key: string) => {
          if (key === 'enhanced_storage_info') return '{"items":{}}';
          return null;
        });
        window.localStorage.removeItem = jest.fn();
        
        const result = EnhancedStorage.setItem('big-data', 'test-value');
        
        window.localStorage.setItem = originalSetItem;
        window.localStorage.getItem = originalGetItem;
        window.localStorage.removeItem = originalRemoveItem;
        
        expect(result).toBe(false);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('应该处理存储时的其他错误', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      try {
        const originalSetItem = window.localStorage.setItem;
        const originalGetItem = window.localStorage.getItem;
        const originalRemoveItem = window.localStorage.removeItem;
        
        window.localStorage.setItem = jest.fn((key: string) => {
          if (key !== 'enhanced_storage_info') {
            throw new Error('Storage error');
          }
        });
        window.localStorage.getItem = jest.fn((key: string) => {
          if (key === 'enhanced_storage_info') return '{"items":{}}';
          return null;
        });
        window.localStorage.removeItem = jest.fn();
        
        const result = EnhancedStorage.setItem('error-test', 'data');
        
        window.localStorage.setItem = originalSetItem;
        window.localStorage.getItem = originalGetItem;
        window.localStorage.removeItem = originalRemoveItem;
        
        expect(result).toBe(false);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('边界条件', () => {
    it('应该处理空字符串键和值', () => {
      expect(EnhancedStorage.setItem('', '')).toBe(true);
      expect(EnhancedStorage.getItem('')).toBe('');
    });

    it('应该处理特殊字符键名', () => {
      const specialKeys = ['key-with-dashes', 'key.with.dots', 'key_with_underscores'];
      
      specialKeys.forEach(key => {
        expect(EnhancedStorage.setItem(key, key)).toBe(true);
        expect(EnhancedStorage.getItem(key)).toBe(key);
      });
    });

    it('应该处理大型数据', () => {
      const largeData = { 
        data: 'A'.repeat(100000),
        array: Array.from({ length: 1000 }, (_, i) => i)
      };

      expect(EnhancedStorage.setItem('large', largeData)).toBe(true);
      
      const retrieved = EnhancedStorage.getItem<typeof largeData>('large');
      expect(retrieved?.data.length).toBe(100000);
      expect(retrieved?.array).toHaveLength(1000);
    });

    it('应该处理嵌套对象结构', () => {
      const nestedData = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        },
        array: [{ nested: 'objects' }]
      };

      EnhancedStorage.setItem('nested', nestedData);
      const result = EnhancedStorage.getItem<typeof nestedData>('nested');

      expect(result?.level1.level2.level3.value).toBe('deep');
      expect(result?.array[0].nested).toBe('objects');
    });
  });
});
