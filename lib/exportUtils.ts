/**
 * @file 数据导出工具类
 * @description 提供表格数据导出为Excel、CSV、PDF等格式的功能
 * @module exportUtils
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-01
 * @updated 2024-01-01
 */
import * as XLSX from 'xlsx';

/**
 * 导出格式类型
 */
export type ExportFormat = 'excel' | 'csv' | 'pdf';

/**
 * 导出选项接口
 */
export interface ExportOptions {
  fileName?: string;
  sheetName?: string;
  includeHeaders?: boolean;
}

/**
 * 数据导出工具类
 */
export class ExportUtils {
  /**
   * 将表格数据导出为Excel文件
   * @param tableData 表格数据（二维数组）
   * @param options 导出选项
   */
  static exportToExcel(tableData: string[][], options: ExportOptions = {}): void {
    const {
      fileName = 'table_data',
      sheetName = 'Sheet1',
      includeHeaders = true
    } = options;

    try {
      // 准备数据（如果不包含表头，则从第一行开始）
      const dataToExport = includeHeaders ? tableData : tableData.slice(1);
      
      // 创建工作簿
      const ws = XLSX.utils.aoa_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // 设置列宽（根据内容自动调整）
      const colWidths = this.calculateColumnWidths(dataToExport);
      ws['!cols'] = colWidths.map(width => ({ wch: width }));

      // 导出文件
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } catch (error) {
      console.error('Excel导出失败:', error);
      throw new Error('导出Excel文件失败');
    }
  }

  /**
   * 将表格数据导出为CSV文件
   * @param tableData 表格数据（二维数组）
   * @param options 导出选项
   */
  static exportToCSV(tableData: string[][], options: ExportOptions = {}): void {
    const {
      fileName = 'table_data',
      includeHeaders = true
    } = options;

    try {
      // 准备数据
      const dataToExport = includeHeaders ? tableData : tableData.slice(1);
      
      // 生成CSV内容
      const csvContent = dataToExport
        .map(row => {
          // 处理包含逗号、引号或换行的单元格
          return row
            .map(cell => {
              // 如果单元格包含逗号、引号或换行符，需要用引号包裹并转义内部的引号
              if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                return `"${cell.replace(/"/g, '""')}"`;
              }
              return cell;
            })
            .join(',');
        })
        .join('\n');

      // 创建Blob并下载
      const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      this.downloadBlob(blob, `${fileName}.csv`);
    } catch (error) {
      console.error('CSV导出失败:', error);
      throw new Error('导出CSV文件失败');
    }
  }

  /**
   * 将表格数据导出为PDF文件（简化版实现）
   * @param tableData 表格数据（二维数组）
   * @param options 导出选项
   */
  static exportToPDF(tableData: string[][], options: ExportOptions = {}): void {
    const {
      fileName = 'table_data',
      includeHeaders = true
    } = options;

    try {
      // 准备数据
      const dataToExport = includeHeaders ? tableData : tableData.slice(1);
      
      // 生成HTML表格
      let html = `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif;">`;
      
      // 添加表头（如果需要）
      if (includeHeaders && dataToExport.length > 0) {
        html += '<thead><tr>';
        dataToExport[0].forEach(header => {
          html += `<th style="background-color: #f2f2f2; font-weight: bold; text-align: left;">${this.escapeHtml(header)}</th>`;
        });
        html += '</tr></thead>';
      }
      
      // 添加数据行
      html += '<tbody>';
      const startRow = includeHeaders ? 1 : 0;
      for (let i = startRow; i < dataToExport.length; i++) {
        const rowClass = i % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9f9f9;';
        html += `<tr style="${rowClass}">`;
        dataToExport[i].forEach(cell => {
          html += `<td style="text-align: left;">${this.escapeHtml(cell)}</td>`;
        });
        html += '</tr>';
      }
      html += '</tbody></table>';

      // 生成完整的HTML文档
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${fileName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${fileName}</h1>
          <p>导出时间: ${new Date().toLocaleString()}</p>
          ${html}
        </body>
        </html>
      `;

      // 创建Blob并下载
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
      
      // 使用window.print()实现简单的PDF导出
      // 注意：这是一个简化实现，实际项目中可能需要使用专业的PDF生成库如jsPDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(fullHtml);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
          // 可选：自动关闭窗口
          // setTimeout(() => printWindow.close(), 1000);
        };
      } else {
        // 如果无法打开新窗口，提供HTML下载选项
        this.downloadBlob(blob, `${fileName}_export.html`);
        alert('无法自动打开打印窗口，请下载HTML文件并手动打印为PDF');
      }
    } catch (error) {
      console.error('PDF导出失败:', error);
      throw new Error('导出PDF文件失败');
    }
  }

  /**
   * 根据格式导出表格数据
   * @param tableData 表格数据（二维数组）
   * @param format 导出格式
   * @param options 导出选项
   */
  static exportData(tableData: string[][], format: ExportFormat, options: ExportOptions = {}): void {
    if (!tableData || tableData.length === 0) {
      throw new Error('没有可导出的数据');
    }

    try {
      switch (format) {
        case 'excel':
          this.exportToExcel(tableData, options);
          break;
        case 'csv':
          this.exportToCSV(tableData, options);
          break;
        case 'pdf':
          this.exportToPDF(tableData, options);
          break;
        default:
          throw new Error(`不支持的导出格式: ${format}`);
      }
    } catch (error) {
      console.error(`导出${format.toUpperCase()}失败:`, error);
      throw error;
    }
  }

  /**
   * 计算列宽（基于内容长度）
   * @param data 表格数据
   * @private
   */
  private static calculateColumnWidths(data: string[][]): number[] {
    if (!data || data.length === 0) return [];
    
    const numCols = data[0].length;
    const widths = Array(numCols).fill(10); // 默认最小宽度
    
    data.forEach(row => {
      row.forEach((cell, colIndex) => {
        // 计算单元格内容的长度（考虑中文字符为2个宽度单位）
        const length = this.getDisplayLength(cell);
        widths[colIndex] = Math.max(widths[colIndex], Math.min(length, 50)); // 最大宽度限制
      });
    });
    
    return widths;
  }

  /**
   * 获取字符串的显示长度（中文字符计为2个长度单位）
   * @param str 要计算长度的字符串
   * @private
   */
  private static getDisplayLength(str: string): number {
    if (!str) return 0;
    let length = 0;
    for (let i = 0; i < str.length; i++) {
      // 中文字符判断
      const charCode = str.charCodeAt(i);
      if ((charCode >= 0x4e00 && charCode <= 0x9fff) || // 基本汉字
          (charCode >= 0x3400 && charCode <= 0x4dbf) || // 扩展A
          (charCode >= 0x20000 && charCode <= 0x2a6df) || // 扩展B
          (charCode >= 0x2a700 && charCode <= 0x2b73f)) { // 扩展C
        length += 2;
      } else {
        length += 1;
      }
    }
    return length;
  }

  /**
   * 下载Blob文件
   * @param blob Blob对象
   * @param fileName 文件名
   * @private
   */
  private static downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * 转义HTML特殊字符
   * @param text 要转义的文本
   * @private
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default ExportUtils;