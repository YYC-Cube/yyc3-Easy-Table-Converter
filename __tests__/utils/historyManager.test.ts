/**
 * @file HistoryManager 单元测试
 * @description 测试历史记录管理器功能
 */

import { HistoryManager } from '@/lib/utils/historyManager';

// Mock EnhancedStorage
jest.mock('@/lib/utils/enhancedStorage', () => ({
  EnhancedStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('HistoryManager', () => {
  let historyManager: HistoryManager;

  beforeEach(() => {
    // 清除单例实例
    (HistoryManager as any).instance = undefined;
    
    // 获取新实例
    historyManager = HistoryManager.getInstance();
    
    // 清除所有mock
    jest.clearAllMocks();
    
    // Mock EnhancedStorage.getItem返回空数组（初始状态）
    (require('@/lib/utils/enhancedStorage').EnhancedStorage.getItem as jest.Mock).mockReturnValue(null);
  });

  describe('单例模式', () => {
    it('应该返回相同的实例', () => {
      const instance1 = HistoryManager.getInstance();
      const instance2 = HistoryManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('addItem', () => {
    it('应该成功添加历史记录项', () => {
      const item = {
        type: 'table' as const,
        input: { format: 'csv', value: 'test data' },
        output: { format: 'json', value: '[]' },
      };

      const result = historyManager.addItem(item);

      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.type).toBe('table');
      expect(result.input.format).toBe('csv');
    });

    it('应该自动生成唯一ID', () => {
      const item = {
        type: 'image' as const,
        input: { format: 'png' },
        output: { format: 'jpg' },
      };

      const item1 = historyManager.addItem(item);
      const item2 = historyManager.addItem(item);

      expect(item1.id).not.toBe(item2.id);
    });

    it('应该自动添加时间戳', () => {
      const beforeTime = Date.now();
      
      const item = {
        type: 'table' as const,
        input: {},
        output: {},
      };
      
      const result = historyManager.addItem(item);
      
      const afterTime = Date.now();
      
      expect(result.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(result.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('应该保存到存储', () => {
      const item = {
        type: 'base64' as const,
        input: { value: 'input' },
        output: { value: 'output' },
      };

      historyManager.addItem(item);

      expect(require('@/lib/utils/enhancedStorage').EnhancedStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    beforeEach(() => {
      // 添加一些测试数据
      historyManager.addItem({ type: 'table', input: {}, output: {} });
      historyManager.addItem({ type: 'image', input: {}, output: {} });
      historyManager.addItem({ type: 'table', input: {}, output: {} });
    });

    it('应该返回所有历史记录', () => {
      const allHistory = historyManager.getHistory();

      expect(allHistory).toHaveLength(3);
    });

    it('应该按类型筛选历史记录', () => {
      const tableHistory = historyManager.getHistory('table');

      expect(tableHistory).toHaveLength(2);
      tableHistory.forEach(item => {
        expect(item.type).toBe('table');
      });
    });

    it('应该返回空数组对于不存在的类型', () => {
      const nonExistent = historyManager.getHistory('nonexistent');

      expect(nonExistent).toHaveLength(0);
    });

    it('应该按时间倒序排列（最新的在前）', () => {
      const allHistory = historyManager.getHistory();

      for (let i = 0; i < allHistory.length - 1; i++) {
        expect(allHistory[i].timestamp).toBeGreaterThanOrEqual(allHistory[i + 1].timestamp);
      }
    });
  });

  describe('getItem', () => {
    it('应该根据ID返回正确的项目', () => {
      const addedItem = historyManager.addItem({
        type: 'color',
        input: { value: '#fff' },
        output: { value: '#000' },
      });

      const retrieved = historyManager.getItem(addedItem.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(addedItem.id);
      expect(retrieved?.type).toBe('color');
    });

    it('应该返回undefined对于不存在的ID', () => {
      const result = historyManager.getItem('nonexistent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('removeItem', () => {
    it('应该正确删除指定的历史记录项', () => {
      const item = historyManager.addItem({
        type: 'unit',
        input: { value: 'meters' },
        output: { value: 'feet' },
      });

      expect(historyManager.getHistory()).toHaveLength(1);

      historyManager.removeItem(item.id);

      expect(historyManager.getHistory()).toHaveLength(0);
      expect(historyManager.getItem(item.id)).toBeUndefined();
    });

    it('应该调用存储的remove方法', () => {
      const item = historyManager.addItem({
        type: 'json-xml',
        input: {},
        output: {},
      });

      historyManager.removeItem(item.id);

      expect(require('@/lib/utils/enhancedStorage').EnhancedStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('clearHistory', () => {
    beforeEach(() => {
      historyManager.addItem({ type: 'table', input: {}, output: {} });
      historyManager.addItem({ type: 'image', input: {}, output: {} });
      historyManager.addItem({ type: 'timestamp', input: {}, output: {} });
    });

    it('应该清空所有历史记录', () => {
      expect(historyManager.getHistory()).toHaveLength(3);

      historyManager.clearHistory();

      expect(historyManager.getHistory()).toHaveLength(0);
    });

    it('应该只清空指定类型的历史记录', () => {
      historyManager.clearHistory('table');

      const remaining = historyManager.getHistory();
      expect(remaining).toHaveLength(2);
      remaining.forEach(item => {
        expect(item.type).not.toBe('table');
      });
    });

    it('应该在清空后更新存储', () => {
      historyManager.clearHistory();

      expect(require('@/lib/utils/enhancedStorage').EnhancedStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('边界条件', () => {
    it('应该处理最大数量限制', () => {
      // 添加超过50个项目
      for (let i = 0; i < 60; i++) {
        historyManager.addItem({
          type: 'test',
          input: { value: `item-${i}` },
          output: {},
        });
      }

      const history = historyManager.getHistory();
      
      // 不应超过50个
      expect(history.length).toBeLessThanOrEqual(50);
    });

    it('应该保留最新的项目当超出限制时', () => {
      for (let i = 0; i < 55; i++) {
        historyManager.addItem({
          type: 'limit-test',
          input: { value: `sequence-${i}` },
          output: {},
        });
      }

      const history = historyManager.getHistory('limit-test');
      
      // 最新的应该在前面，且总数量不超过限制
      if (history.length > 0) {
        // 第一个应该是最新添加的
        expect(history[0].input.value).toBe('sequence-54');
      }
    });

    it('应该处理各种类型的转换记录', () => {
      const types = ['table', 'image', 'base64', 'color', 'unit', 'json-xml', 'timestamp'];
      
      types.forEach(type => {
        historyManager.addItem({
          type: type as any,
          input: {},
          output: {},
        });
      });

      types.forEach(type => {
        const filtered = historyManager.getHistory(type);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].type).toBe(type);
      });
    });

    it('应该正确处理带settings的项目', () => {
      const itemWithSettings = {
        type: 'table' as const,
        input: { format: 'csv' },
        output: { format: 'json' },
        settings: {
          delimiter: ',',
          hasHeader: true,
          encoding: 'utf-8'
        }
      };

      const added = historyManager.addItem(itemWithSettings);
      const retrieved = historyManager.getItem(added.id);

      expect(retrieved?.settings?.delimiter).toBe(',');
      expect(retrieved?.settings?.hasHeader).toBe(true);
    });
  });
});
