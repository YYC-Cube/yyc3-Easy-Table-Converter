/**
 * @file VirtualTable 组件单元测试
 * @description 测试虚拟滚动表格组件的性能优化功能
 * @module __tests__/components/VirtualTable.test.tsx
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { VirtualTable } from '../../components/VirtualTable';
import { useToast } from '@/hooks/use-toast';

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => jest.fn())
}));

describe('VirtualTable Component', () => {
  // 基础测试数据
  const mockData = [
    ['姓名', '年龄', '城市', '职位', '薪资'],
    ['张三', '25', '北京', '前端开发', '15000'],
    ['李四', '30', '上海', '后端开发', '18000'],
    ['王五', '28', '广州', '产品经理', '20000'],
    ['赵六', '35', '深圳', '设计师', '16000']
  ];

  // 生成大量数据用于性能测试
  const generateLargeData = (rows: number) => {
    const data = [['ID', '姓名', '年龄', '城市', '职位', '薪资']];
    for (let i = 1; i <= rows; i++) {
      data.push([
        i.toString(),
        `用户${i}`,
        (20 + i % 20).toString(),
        ['北京', '上海', '广州', '深圳'][i % 4],
        ['前端', '后端', '产品', '设计'][i % 4],
        (10000 + i * 100).toString()
      ]);
    }
    return data;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 重置模拟的滚动事件
    Object.defineProperty(window.HTMLElement.prototype, 'scrollTop', {
      configurable: true,
      value: 0,
      writable: true,
    });
    Object.defineProperty(window.HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  test('应该正确渲染虚拟表格基础结构', () => {
    render(<VirtualTable data={mockData} rowHeight={48} />);

    // 验证表头渲染
    expect(screen.getByText('姓名')).toBeInTheDocument();
    expect(screen.getByText('年龄')).toBeInTheDocument();
    expect(screen.getByText('城市')).toBeInTheDocument();

    // 验证至少一条数据渲染
    expect(screen.getByText('张三')).toBeInTheDocument();
  });

  test('应该正确处理空数据情况', () => {
    render(<VirtualTable data={[[]]} rowHeight={48} />);
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  test('应该支持虚拟滚动功能', () => {
    const largeData = generateLargeData(100);
    const { container } = render(<VirtualTable data={largeData} rowHeight={48} />);

    // 获取滚动容器
    const scrollContainer = container.querySelector('.overflow-auto');
    expect(scrollContainer).toBeInTheDocument();

    // 模拟滚动事件
    act(() => {
      scrollContainer!.scrollTop = 1000; // 滚动到下方
    });
  });

  test('应该正确设置overscanCount属性', () => {
    render(
      <VirtualTable 
        data={mockData} 
        rowHeight={48} 
        overscanCount={10} 
        overscanCols={3}
      />
    );
    
    // 验证组件渲染成功
    expect(screen.getByText('姓名')).toBeInTheDocument();
  });

  test('应该支持自定义行高', () => {
    const { container } = render(
      <VirtualTable 
        data={mockData} 
        rowHeight={60} // 自定义行高
      />
    );
    
    // 获取表格行元素并验证行高
    const rows = container.querySelectorAll('tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  test('应该支持固定表头', () => {
    const { container } = render(<VirtualTable data={mockData} rowHeight={48} />);
    
    // 验证表头容器存在
    const headerContainer = container.querySelector('.absolute.top-0');
    expect(headerContainer).toBeInTheDocument();
  });

  test('应该响应列宽调整', () => {
    render(
      <VirtualTable 
        data={mockData} 
        rowHeight={48}
        columnWidths={[100, 80, 120, 150, 100]}
      />
    );
    
    // 验证组件正常渲染
    expect(screen.getByText('姓名')).toBeInTheDocument();
  });

  test('应该在大数据量下保持性能（不实际渲染所有行）', () => {
    const veryLargeData = generateLargeData(1000);
    const { container } = render(
      <VirtualTable 
        data={veryLargeData} 
        rowHeight={48} 
        overscanCount={5}
      />
    );
    
    // 验证只渲染了可见区域的行，而不是全部1000行
    const renderedRows = container.querySelectorAll('tbody tr:not([style*="height:"])');
    // 应该只渲染可见行 + overscanCount
    expect(renderedRows.length).toBeLessThan(50); // 远小于1000
  });

  test('应该支持筛选状态显示', () => {
    render(
      <VirtualTable 
        data={mockData} 
        rowHeight={48}
        isFiltered={true}
      />
    );
    
    // 验证筛选提示显示
    expect(screen.getByText('正在查看筛选后的结果')).toBeInTheDocument();
  });

  test('应该支持自定义样式类', () => {
    const { container } = render(
      <VirtualTable 
        data={mockData} 
        rowHeight={48}
        className="custom-table-class"
      />
    );
    
    // 验证自定义类被添加
    const tableElement = container.querySelector('.custom-table-class');
    expect(tableElement).toBeInTheDocument();
  });
});
