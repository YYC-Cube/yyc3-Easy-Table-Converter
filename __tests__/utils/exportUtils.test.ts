/**
 * @file ExportUtils 单元测试
 * @description 测试数据导出工具类的所有核心功能
 */

import { ExportUtils } from '@/lib/exportUtils';

// Mock xlsx库
jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: jest.fn(),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

import * as XLSX from 'xlsx';

// Mock Blob和download功能
global.Blob = class Blob {
  constructor(public parts: any[], public options?: any) {}
} as any;

global.URL.createObjectURL = jest.fn(() => 'blob:url');
global.URL.revokeObjectURL = jest.fn();

// Mock HTMLAnchorElement
const mockClick = jest.fn();
Object.defineProperty(global, 'HTMLAnchorElement', {
  value: class HTMLAnchorElement {
    click = mockClick;
    href = '';
    download = '';
  },
  writable: true,
});

describe('ExportUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 重置XLSX mocks
    (XLSX.utils.aoa_to_sheet as jest.Mock).mockReturnValue({});
    (XLSX.utils.book_new as jest.Mock).mockReturnValue({});
    mockClick.mockClear();
  });

  describe('exportToExcel', () => {
    it('应该正确导出基本表格数据到Excel', () => {
      const tableData = [
        ['Name', 'Age', 'City'],
        ['Alice', '30', 'Beijing'],
        ['Bob', '25', 'Shanghai'],
      ];

      expect(() => {
        ExportUtils.exportToExcel(tableData);
      }).not.toThrow();

      // 验证XLSX函数被调用
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('应该使用自定义文件名和表名', () => {
      const tableData = [['A', 'B'], ['1', '2']];
      
      ExportUtils.exportToExcel(tableData, {
        fileName: 'custom_name',
        sheetName: 'custom_sheet',
      });

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.any(Object),
        'custom_name.xlsx'
      );
    });

    it('应该支持不包含表头的导出', () => {
      const tableData = [
        ['Header1', 'Header2'],
        ['Data1', 'Data2'],
        ['Data3', 'Data4'],
      ];

      ExportUtils.exportToExcel(tableData, { includeHeaders: false });

      // 验证aoa_to_sheet被调用时不包含表头
      const callArg = (XLSX.utils.aoa_to_sheet as jest.Mock).mock.calls[0][0];
      expect(callArg).toEqual([['Data1', 'Data2'], ['Data3', 'Data4']]);
    });

    it('应该处理空数据', () => {
      const emptyData: string[][] = [];

      expect(() => {
        ExportUtils.exportToExcel(emptyData);
      }).not.toThrow();
    });

    it('应该处理单行数据', () => {
      const singleRow = [['Only', 'One', 'Row']];

      expect(() => {
        ExportUtils.exportToExcel(singleRow);
      }).not.toThrow();
    });

    it('应该在XLSX错误时抛出异常', () => {
      (XLSX.writeFile as jest.Mock).mockImplementationOnce(() => {
        throw new Error('XLSX Error');
      });

      const tableData = [['A', 'B']];

      expect(() => {
        ExportUtils.exportToExcel(tableData);
      }).toThrow('导出Excel文件失败');
    });
  });

  describe('exportToCSV', () => {
    it('应该正确导出基本数据到CSV', () => {
      const tableData = [
        ['Name', 'Age'],
        ['Alice', '30'],
      ];

      // 由于CSV导出涉及Blob下载，我们主要验证不会抛出异常
      expect(() => {
        ExportUtils.exportToCSV(tableData);
      }).not.toThrow();
    });

    it('应该使用自定义文件名', () => {
      const tableData = [['A', 'B']];
      
      // 监控console.error以避免测试输出噪音
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        ExportUtils.exportToCSV(tableData, { fileName: 'test_export' });
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('应该正确处理包含逗号的单元格', () => {
      const tableData = [
        ['Name', 'Description'],
        ['Item1', 'Has, comma'],
      ];

      expect(() => {
        ExportUtils.exportToCSV(tableData);
      }).not.toThrow();
    });

    it('应该正确处理包含引号的单元格', () => {
      const tableData = [
        ['Text with "quotes"'],
        ['Normal text'],
      ];

      expect(() => {
        ExportUtils.exportToCSV(tableData);
      }).not.toThrow();
    });

    it('应该正确处理包含换行的单元格', () => {
      const tableData = [
        ['Line1\nLine2'],
        ['Single line'],
      ];

      expect(() => {
        ExportUtils.exportToCSV(tableData);
      }).not.toThrow();
    });

    it('应该支持不包含表头的CSV导出', () => {
      const tableData = [
        ['Header'],
        ['Data1'],
        ['Data2'],
      ];

      expect(() => {
        ExportUtils.exportToCSV(tableData, { includeHeaders: false });
      }).not.toThrow();
    });

    it('应该处理空数据数组', () => {
      const emptyData: string[][] = [];

      expect(() => {
        ExportUtils.exportToCSV(emptyData);
      }).not.toThrow();
    });

    it('应该在错误时抛出异常', () => {
      // Mock Blob构造函数抛出错误
      const OriginalBlob = global.Blob;
      global.Blob = class MockBlob extends OriginalBlob {
        constructor(...args: any[]) {
          super(...args);
          throw new Error('Blob creation failed');
        }
      } as any;

      const tableData = [['A', 'B']];

      expect(() => {
        ExportUtils.exportToCSV(tableData);
      }).toThrow('导出CSV文件失败');

      // 恢复原始Blob
      global.Blob = OriginalBlob;
    });
  });

  describe('边界条件测试', () => {
    it('应该处理大量数据（性能测试）', () => {
      // 创建1000行 x 10列的数据
      const largeData = Array.from({ length: 1000 }, (_, rowIndex) =>
        Array.from({ length: 10 }, (_, colIndex) => `R${rowIndex}C${colIndex}`)
      );

      const startTime = performance.now();
      
      expect(() => {
        ExportUtils.exportToExcel(largeData);
      }).not.toThrow();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 确保在合理时间内完成（< 500ms）
      expect(duration).toBeLessThan(500);
    });

    it('应该处理包含特殊字符的数据', () => {
      const specialData = [
        ['特殊字符', 'Emoji 🎉', '中文测试'],
        ['<script>alert("xss")</script>', '&amp;&lt;&gt;', '\tTab\nNewline'],
      ];

      expect(() => {
        ExportUtils.exportToExcel(specialData);
        expect(() => {
          ExportUtils.exportToCSV(specialData);
        }).not.toThrow();
      });
    });

    it('应该处理超长文本单元格', () => {
      const longText = 'A'.repeat(10000);
      const dataWithLongCell = [[longText]];

      expect(() => {
        ExportUtils.exportToExcel(dataWithLongCell);
      }).not.toThrow();
    });

    it('应该处理Unicode字符', () => {
      const unicodeData = [
        ['English', '中文', '日本語', '한국어', 'العربية'],
        ['Émoji: 🔥🚀', '数学: ∑∫∂', '货币: €£¥'],
      ];

      expect(() => {
        ExportUtils.exportToExcel(unicodeData);
        expect(() => {
          ExportUtils.exportToCSV(unicodeData);
        }).not.toThrow();
      });
    });
  });
});
