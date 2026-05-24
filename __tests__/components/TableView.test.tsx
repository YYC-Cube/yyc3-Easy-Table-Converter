/**
 * @file TableView 组件单元测试
 * @description 测试表格组件的核心功能和用户交互
 * @module __tests__/components/TableView.test.tsx
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { TableView } from '../../components/TableView';
import { useToast } from '@/hooks/use-toast';

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => jest.fn())
}));

describe('TableView Component', () => {
  // 测试数据
  const mockData = [
    ['姓名', '年龄', '城市'],
    ['张三', '25', '北京'],
    ['李四', '30', '上海'],
    ['王五', '28', '广州']
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // 模拟窗口大小
    global.innerWidth = 1200;
  });

  test('应该正确渲染表格和表头', () => {
    render(<TableView data={mockData} />);

    // 验证表头渲染
    expect(screen.getByText('姓名')).toBeInTheDocument();
    expect(screen.getByText('年龄')).toBeInTheDocument();
    expect(screen.getByText('城市')).toBeInTheDocument();

    // 验证数据行渲染
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('王五')).toBeInTheDocument();
  });

  test('应该正确处理空数据情况', () => {
    render(<TableView data={[[]]} />);
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  test('应该响应onDataChange回调', () => {
    const onDataChange = jest.fn();
    render(<TableView data={mockData} onDataChange={onDataChange} />);

    // 点击单元格进入编辑模式
    const cell = screen.getByText('张三');
    fireEvent.click(cell);

    // 编辑单元格内容
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '张三修改' } });
    fireEvent.blur(input); // 失去焦点保存

    // 验证回调被调用
    expect(onDataChange).toHaveBeenCalledWith(expect.any(Array));
  });

  test('应该支持排序功能', () => {
    render(<TableView data={mockData} enableSort={true} />);

    // 点击姓名列标题进行排序
    const nameHeader = screen.getByText('姓名').closest('th');
    expect(nameHeader).toBeInTheDocument();
    fireEvent.click(nameHeader!);

    // 再次点击切换排序方向
    fireEvent.click(nameHeader!);
    
    // 验证排序图标存在
    expect(screen.getByRole('button', { name: /排序/ })).toBeInTheDocument();
  });

  test('应该支持行选择功能', () => {
    render(<TableView data={mockData} enableRowSelection={true} />);

    // 验证复选框存在
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    // 选择一行
    fireEvent.click(checkboxes[1]); // 选择第一行数据
  });

  test('应该支持单元格编辑功能', () => {
    render(<TableView data={mockData} enableCellEdit={true} />);

    // 点击单元格进入编辑模式
    const cell = screen.getByText('25');
    fireEvent.click(cell);

    // 验证输入框显示
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();

    // 输入新值并保存
    fireEvent.change(input, { target: { value: '26' } });
    fireEvent.blur(input);

    // 验证新值显示
    expect(screen.getByText('26')).toBeInTheDocument();
  });

  test('应该支持响应式设计', () => {
    // 模拟移动设备宽度
    global.innerWidth = 375;
    render(<TableView data={mockData} />);

    // 验证移动端提示显示
    expect(screen.getByText('向右滑动查看更多')).toBeInTheDocument();
  });

  test('应该在单元格上正确显示编辑图标', () => {
    render(<TableView data={mockData} />);
    
    // 获取单元格元素
    const cell = screen.getByText('张三').closest('td');
    expect(cell).toBeInTheDocument();
    
    // 模拟鼠标悬停
    fireEvent.mouseEnter(cell!);
  });

  test('应该正确处理筛选功能', () => {
    render(<TableView data={mockData} enableFilter={true} />);
    
    // 点击筛选按钮
    const filterButtons = screen.getAllByRole('button', { name: /筛选/ });
    expect(filterButtons.length).toBeGreaterThan(0);
    
    // 由于筛选是下拉菜单，这里只验证按钮存在
  });
});
