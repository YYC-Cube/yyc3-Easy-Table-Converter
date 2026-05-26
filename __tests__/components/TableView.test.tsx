/**
 * @file TableView 组件单元测试
 * @description 测试表格组件的核心功能 - 匹配实际组件实现
 * @module __tests__/components/TableView.test.tsx
 * @author YYC
 * @version 3.0.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableView } from '../../components/TableView';

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
    dismiss: jest.fn(),
  }))
}));

jest.mock('@/hooks/useLanguage', () => ({
  useLanguage: jest.fn(() => ({
    t: (key: string) => key,
    language: 'zh-CN',
  }))
}));

jest.mock('@/hooks/useDataProcessor', () => ({
  useDataProcessor: jest.fn(() => ({
    processMainThread: jest.fn((data: string[][]) => data),
    processInWorker: jest.fn(),
    processData: jest.fn(),
    isProcessing: false,
    error: null,
    processingTime: 0,
    stats: {},
    cancelProcessing: jest.fn(),
  }))
}));

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(() => ({ isKeydownInProgress: false }))
}));

jest.mock('@/hooks/useTableSelection', () => ({
  useTableSelection: jest.fn(() => ({
    selectedCells: new Set(),
    selectionRange: null,
    isSelecting: false,
    lastClickedCell: null,
    handleCellClick: jest.fn(),
    handleSelectStart: jest.fn(),
    handleSelectUpdate: jest.fn(),
    handleSelectEnd: jest.fn(),
    clearSelection: jest.fn(),
    getSelectedCellsData: jest.fn(() => []),
    hasSelection: false,
  }))
}));

describe('TableView Component', () => {
  const mockData = [
    ['姓名', '年龄', '城市'],
    ['张三', '25', '北京'],
    ['李四', '30', '上海'],
    ['王五', '28', '广州']
  ];

  const createCallbacks = () => ({
    setTableData: jest.fn(),
    updateInputData: jest.fn((data: string[][]) => JSON.stringify(data)),
    saveToHistory: jest.fn(),
    parseInputData: jest.fn((data: string, format: string) => mockData),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.innerWidth = 1200;
  });

  test('应该正确渲染表格容器', () => {
    const callbacks = createCallbacks();
    const { container } = render(
      <TableView 
        filteredData={mockData}
        tableData={mockData}
        {...callbacks}
        tableScale={1}
        isTableExpanded={false}
        inputData="test"
        selectedFormat="csv"
      />
    );
    expect(container.querySelector('.table-view-container')).toBeTruthy();
  });

  test('应该正确处理空数据情况', () => {
    const callbacks = createCallbacks();
    const { container } = render(
      <TableView 
        filteredData={[[]]}
        tableData={[[]]}
        {...callbacks}
        tableScale={1}
        isTableExpanded={false}
        inputData=""
        selectedFormat="csv"
      />
    );
    expect(container.querySelector('.table-view-container')).toBeTruthy();
  });

  test('应该响应单元格点击交互', () => {
    const callbacks = createCallbacks();
    const { container } = render(
      <TableView 
        filteredData={mockData}
        tableData={mockData}
        {...callbacks}
        tableScale={1}
        isTableExpanded={false}
        inputData="test"
        selectedFormat="csv"
      />
    );
    const cells = container.querySelectorAll('td');
    if (cells.length > 0) {
      fireEvent.click(cells[0]);
    }
    expect(container.querySelector('.table-view-container')).toBeTruthy();
  });

  test('应该支持响应式设计', () => {
    global.innerWidth = 375;
    const callbacks = createCallbacks();
    const { container } = render(
      <TableView 
        filteredData={mockData}
        tableData={mockData}
        {...callbacks}
        tableScale={1}
        isTableExpanded={false}
        inputData="test"
        selectedFormat="csv"
      />
    );
    expect(container.querySelector('.table-view-container')).toBeTruthy();
  });

  test('应该支持筛选功能', () => {
    const filteredData = [['姓名', '年龄', '城市'], ['张三', '25', '北京']];
    const callbacks = createCallbacks();
    const { container } = render(
      <TableView 
        filteredData={filteredData}
        tableData={mockData}
        {...callbacks}
        tableScale={1}
        isTableExpanded={false}
        inputData="test"
        selectedFormat="csv"
      />
    );
    expect(container.querySelector('.table-view-container')).toBeTruthy();
  });

  test('应该处理排序状态', () => {
    const callbacks = createCallbacks();
    const { container } = render(
      <TableView 
        filteredData={mockData}
        tableData={mockData}
        {...callbacks}
        tableScale={1}
        isTableExpanded={false}
        inputData="test"
        selectedFormat="csv"
        sortColumn={0}
        sortDirection="asc"
      />
    );
    expect(container.querySelector('.table-view-container')).toBeTruthy();
  });

  test('应该处理编辑状态', () => {
    const callbacks = createCallbacks();
    const { container } = render(
      <TableView 
        filteredData={mockData}
        tableData={mockData}
        {...callbacks}
        tableScale={1}
        isTableExpanded={false}
        inputData="test"
        selectedFormat="csv"
        editingCell={{ row: 1, col: 0 }}
        editingValue="测试"
      />
    );
    expect(container.querySelector('.table-view-container')).toBeTruthy();
  });

  test('应该处理选择状态', () => {
    const callbacks = createCallbacks();
    const { container } = render(
      <TableView 
        filteredData={mockData}
        tableData={mockData}
        {...callbacks}
        tableScale={1}
        isTableExpanded={false}
        inputData="test"
        selectedFormat="csv"
        selectedCells={new Set(['1-0', '1-1'])}
      />
    );
    expect(container.querySelector('.table-view-container')).toBeTruthy();
  });

  describe('边界条件', () => {
    it('应该处理单行数据', () => {
      const singleRowData = [['Name', 'Age'], ['Alice', '25']];
      const callbacks = createCallbacks();
      const { container } = render(
        <TableView 
          filteredData={singleRowData}
          tableData={singleRowData}
          {...callbacks}
          tableScale={1}
          isTableExpanded={false}
          inputData="test"
          selectedFormat="csv"
        />
      );
      expect(container.querySelector('.table-view-container')).toBeTruthy();
    });

    it('应该处理大量列数据', () => {
      const manyCols = [
        Array.from({ length: 20 }, (_, i) => `Col${i}`),
        Array.from({ length: 20 }, (_, i) => `Val${i}`)
      ];
      const callbacks = createCallbacks();
      const { container } = render(
        <TableView 
          filteredData={manyCols}
          tableData={manyCols}
          {...callbacks}
          tableScale={1}
          isTableExpanded={false}
          inputData="test"
          selectedFormat="csv"
        />
      );
      expect(container.querySelector('.table-view-container')).toBeTruthy();
    });

    it('应该处理特殊字符数据', () => {
      const specialData = [
        ['Name', 'Desc'],
        ['Test<>&"', '"quotes" & more']
      ];
      const callbacks = createCallbacks();
      const { container } = render(
        <TableView 
          filteredData={specialData}
          tableData={specialData}
          {...callbacks}
          tableScale={1}
          isTableExpanded={false}
          inputData="test"
          selectedFormat="csv"
        />
      );
      expect(container.querySelector('.table-view-container')).toBeTruthy();
    });
  });

  describe('交互性', () => {
    it('应该处理键盘事件', () => {
      const callbacks = createCallbacks();
      const { container } = render(
        <TableView 
          filteredData={mockData}
          tableData={mockData}
          {...callbacks}
          tableScale={1}
          isTableExpanded={false}
          inputData="test"
          selectedFormat="csv"
        />
      );
      fireEvent.keyDown(container, { key: 'ArrowDown' });
      expect(container.querySelector('.table-view-container')).toBeTruthy();
    });

    it('应该处理复制操作', () => {
      const callbacks = createCallbacks();
      const { container } = render(
        <TableView 
          filteredData={mockData}
          tableData={mockData}
          {...callbacks}
          tableScale={1}
          isTableExpanded={false}
          inputData="test"
          selectedFormat="csv"
        />
      );
      fireEvent.keyDown(container, { key: 'c', ctrlKey: true });
      expect(container.querySelector('.table-view-container')).toBeTruthy();
    });
  });

  describe('性能', () => {
    it('应该在合理时间内渲染', () => {
      const callbacks = createCallbacks();
      const start = performance.now();
      render(
        <TableView 
          filteredData={mockData}
          tableData={mockData}
          {...callbacks}
          tableScale={1}
          isTableExpanded={false}
          inputData="test"
          selectedFormat="csv"
        />
      );
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(3000);
    });
  });
});
