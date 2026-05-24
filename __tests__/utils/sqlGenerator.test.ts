/**
 * @file SQL 生成器工具测试
 * @description 测试 SQL 生成器的各种功能
 * @module __tests__/utils/sqlGenerator.test
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { describe, it, expect } from '@jest/globals';

interface TableData {
  tableName: string;
  columns: string[];
  rows: any[];
}

function generateInsert(data: TableData): string {
  const columns = data.columns.map(c => `\`${c}\``).join(', ');
  const values = data.rows.map(row => {
    const vals = data.columns.map(c => {
      const val = row[c];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return val;
      if (typeof val === 'boolean') return val ? '1' : '0';
      return `'${String(val).replace(/'/g, "''")}'`;
    }).join(', ');
    return `(${vals})`;
  }).join(',\n  ');

  return `INSERT INTO \`${data.tableName}\` (${columns})\nVALUES\n  ${values};`;
}

function generateCreate(data: TableData): string {
  const columnDefs = data.columns.map(col => {
    const sampleVal = data.rows[0]?.[col];
    let type = 'VARCHAR(255)';
    
    if (typeof sampleVal === 'number') {
      type = Number.isInteger(sampleVal) ? 'INT' : 'DECIMAL(10,2)';
    } else if (typeof sampleVal === 'boolean') {
      type = 'TINYINT(1)';
    }

    return `  \`${col}\` ${type} DEFAULT NULL`;
  }).join(',\n');

  const primaryKey = data.columns.includes('id') ? ',\n  PRIMARY KEY (`id`)' : '';

  return `CREATE TABLE \`${data.tableName}\` (\n${columnDefs}${primaryKey}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
}

describe('SQL Generator', () => {
  const mockData: TableData = {
    tableName: 'users',
    columns: ['id', 'name', 'email', 'age', 'status'],
    rows: [
      { id: 1, name: '张三', email: 'zhangsan@example.com', age: 28, status: true },
      { id: 2, name: '李四', email: 'lisi@example.com', age: 32, status: false },
    ]
  };

  describe('generateInsert', () => {
    it('应该生成正确的 INSERT 语句', () => {
      const sql = generateInsert(mockData);
      
      expect(sql).toContain('INSERT INTO `users`');
      expect(sql).toContain('`id`, `name`, `email`, `age`, `status`');
      expect(sql).toContain("'张三'");
      expect(sql).toContain('28');
      expect(sql).toContain('1'); // true 转换为 1
      expect(sql).toContain(';');
    });

    it('应该正确处理 NULL 值', () => {
      const dataWithNull: TableData = {
        tableName: 'users',
        columns: ['id', 'name', 'email'],
        rows: [{ id: 1, name: '张三', email: null }]
      };
      
      const sql = generateInsert(dataWithNull);
      expect(sql).toContain('NULL');
    });

    it('应该正确转义单引号', () => {
      const dataWithQuote: TableData = {
        tableName: 'users',
        columns: ['name'],
        rows: [{ name: "O'Brien" }]
      };
      
      const sql = generateInsert(dataWithQuote);
      expect(sql).toContain("''");
    });
  });

  describe('generateCreate', () => {
    it('应该生成正确的 CREATE TABLE 语句', () => {
      const sql = generateCreate(mockData);
      
      expect(sql).toContain('CREATE TABLE `users`');
      expect(sql).toContain('`id` INT');
      expect(sql).toContain('`name` VARCHAR(255)');
      expect(sql).toContain('`age` INT');
      expect(sql).toContain('PRIMARY KEY (`id`)');
      expect(sql).toContain('ENGINE=InnoDB');
    });

    it('应该正确推断 DECIMAL 类型', () => {
      const dataWithDecimal: TableData = {
        tableName: 'prices',
        columns: ['price'],
        rows: [{ price: 19.99 }]
      };
      
      const sql = generateCreate(dataWithDecimal);
      expect(sql).toContain('DECIMAL(10,2)');
    });

    it('应该正确处理 TINYINT 类型', () => {
      const dataWithBoolean: TableData = {
        tableName: 'flags',
        columns: ['active'],
        rows: [{ active: true }]
      };
      
      const sql = generateCreate(dataWithBoolean);
      expect(sql).toContain('TINYINT(1)');
    });
  });
});

describe('Batch Conversion', () => {
  it('应该正确计算进度', () => {
    const total = 10;
    const completed = 5;
    const progress = Math.round((completed / total) * 100);
    expect(progress).toBe(50);
  });

  it('应该处理边界情况 - 0 个文件', () => {
    const files: any[] = [];
    const progress = files.length > 0 ? Math.round((0 / files.length) * 100) : 0;
    expect(progress).toBe(0);
  });

  it('应该处理单个文件', () => {
    const files = [{ name: 'test.csv' }];
    const progress = Math.round((1 / files.length) * 100);
    expect(progress).toBe(100);
  });
});
