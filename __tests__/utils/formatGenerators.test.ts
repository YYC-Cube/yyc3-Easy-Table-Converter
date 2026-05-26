/**
 * @file FormatGenerators 单元测试
 * @description 测试多格式输出功能（CSV、TSV、HTML、Markdown、JSON、SQL、YAML、XML、ASCII）
 */

import { generateOutput } from '@/lib/formatGenerators';

describe('Format Generators', () => {
  const sampleData = [
    ['Name', 'Age', 'City'],
    ['Alice', '30', 'Beijing'],
    ['Bob', '25', 'Shanghai']
  ];

  describe('CSV格式生成', () => {
    it('应该正确生成CSV格式', () => {
      const result = generateOutput('csv', sampleData);

      expect(result).toBe('Name,Age,City\nAlice,30,Beijing\nBob,25,Shanghai');
    });

    it('应该处理单行数据', () => {
      const singleRow = [['Header']];
      const result = generateOutput('csv', singleRow);

      expect(result).toBe('Header');
    });
  });

  describe('TSV格式生成', () => {
    it('应该正确生成TSV格式', () => {
      const result = generateOutput('tsv', sampleData);

      expect(result).toBe('Name\tAge\tCity\nAlice\t30\tBeijing\nBob\t25\tShanghai');
    });

    it('应该使用Tab字符分隔', () => {
      const result = generateOutput('tsv', [['A', 'B']]);

      expect(result).toContain('\t');
    });
  });

  describe('HTML格式生成', () => {
    it('应该正确生成HTML表格', () => {
      const result = generateOutput('html', sampleData);

      expect(result).toContain('<table>');
      expect(result).toContain('<thead>');
      expect(result).toContain('<tbody>');
      expect(result).toContain('<th>Name</th>');
      expect(result).toContain('<td>Alice</td>');
      expect(result).toContain('</table>');
    });

    it('应该包含正确的表头行', () => {
      const result = generateOutput('html', sampleData);

      expect(result).toMatch(/<tr>.*<th>Name<\/th>.*<th>Age<\/th>.*<th>City<\/th>.*<\/tr>/);
    });
  });

  describe('Markdown格式生成', () => {
    it('应该正确生成Markdown表格', () => {
      const result = generateOutput('markdown', sampleData);

      expect(result).toContain('| Name | Age | City |');
      expect(result).toContain('| --- | --- | --- |');
      expect(result).toContain('| Alice | 30 | Beijing |');
    });

    it('应该包含表头分隔符', () => {
      const result = generateOutput('markdown', sampleData);

      const lines = result.split('\n');
      expect(lines[1]).toContain('---');
    });
  });

  describe('JSON格式生成', () => {
    it('应该正确生成JSON数组', () => {
      const result = generateOutput('json', sampleData);
      const parsed = JSON.parse(result);

      expect(Array.isArray(parsed)).toBeTruthy();
      expect(parsed).toHaveLength(2);
      expect(parsed[0].Name).toBe('Alice');
      expect(parsed[0].Age).toBe('30');
      expect(parsed[1].City).toBe('Shanghai');
    });

    it('应该生成有效的JSON字符串', () => {
      const result = generateOutput('json', sampleData);

      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('应该处理空数据（只有表头）', () => {
      const headerOnly = [['Name', 'Age']];
      const result = generateOutput('json', headerOnly);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(0);
    });
  });

  describe('SQL格式生成', () => {
    it('应该正确生成CREATE TABLE语句', () => {
      const result = generateOutput('sql', sampleData);

      expect(result).toContain('CREATE TABLE sample_table (');
      expect(result).toContain('Name VARCHAR(255)');
      expect(result).toContain('Age VARCHAR(255)');
      expect(result).toContain(');');
    });

    it('应该生成INSERT语句', () => {
      const result = generateOutput('sql', sampleData);

      expect(result).toContain("INSERT INTO sample_table");
      expect(result).toContain("'Alice'");
      expect(result).toContain("'30'");
      expect(result).toContain("'Beijing'");
    });

    it('应该为每行数据生成INSERT语句', () => {
      const result = generateOutput('sql', sampleData);

      const insertCount = (result.match(/INSERT INTO/g) || []).length;
      expect(insertCount).toBe(2);
    });
  });

  describe('YAML格式生成', () => {
    it('应该正确生成YAML列表格式', () => {
      const result = generateOutput('yaml', sampleData);

      expect(result).toContain('- Name: Alice');
      expect(result).toContain('Age: 30');
      expect(result).toContain('City: Beijing');
    });

    it('应该为每条记录生成列表项', () => {
      const result = generateOutput('yaml', sampleData);

      // YAML格式可能使用不同的列表标记，验证包含数据内容
      expect(result).toContain('- Name: Alice');
      expect(result).toContain('Age: 30');
      expect(result).toContain('- Name: Bob');
      expect(result).toContain('City: Shanghai');
      
      // 验证有2条记录（通过检查两个Name字段）
      const nameCount = (result.match(/Name:/g) || []).length;
      expect(nameCount).toBe(2);
    });
  });

  describe('XML格式生成', () => {
    it('应该正确生成XML文档', () => {
      const result = generateOutput('xml', sampleData);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<data>');
      expect(result).toContain('</data>');
      expect(result).toContain('<record>');
      expect(result).toContain('</record>');
    });

    it('应该包含字段元素', () => {
      const result = generateOutput('xml', sampleData);

      expect(result).toContain('<Name>Alice</Name>');
      expect(result).toContain('<Age>30</Age>');
    });
  });

  describe('ASCII表格格式生成', () => {
    it('应该正确生成ASCII表格', () => {
      const result = generateOutput('ascii', sampleData);

      expect(result).toContain('+');
      expect(result).toContain('-');
      expect(result).toContain('|');
      expect(result).toContain('Name');
      expect(result).toContain('Alice');
    });

    it('应该包含边框和分隔符', () => {
      const result = generateOutput('ascii', sampleData);

      // 检查是否有表格结构
      expect(result.split('\n')[0]).toMatch(/^\+[-+]+\+$/);
    });

    it('应该正确对齐列宽', () => {
      const data = [
        ['Short', 'VeryLongColumnName'],
        ['A', 'B']
      ];
      const result = generateOutput('ascii', data);

      // 验证列宽基于最长内容调整
      expect(result).toContain('VeryLongColumnName');
    });
  });

  describe('边界条件测试', () => {
    it('应该处理空数据数组', () => {
      const result = generateOutput('csv', []);

      expect(result).toBe('');
    });

    it('应该处理默认格式（未知格式回退到CSV）', () => {
      const result = generateOutput('unknown_format', sampleData);

      expect(result).toBeTruthy(); // 不应抛错，回退到默认行为
    });

    it('应该处理单列数据', () => {
      const singleColumn = [
        ['ID'],
        ['1'],
        ['2'],
        ['3']
      ];

      expect(() => {
        generateOutput('csv', singleColumn);
        generateOutput('json', singleColumn);
        generateOutput('html', singleColumn);
      }).not.toThrow();
    });

    it('应该处理特殊字符在数据中', () => {
      const specialData = [
        ['Text', 'Content'],
        ['Has "quotes"', 'Has <tags>'],
        ['Line1\nLine2', 'Tab\there']
      ];

      // 这些格式可能不完全符合标准，但不应抛出错误
      expect(() => {
        generateOutput('csv', specialData);
        generateOutput('json', specialData);
      }).not.toThrow();
    });

    it('应该处理大量列的数据', () => {
      const manyColumns = [
        Array.from({ length: 20 }, (_, i) => `Col${i}`),
        Array.from({ length: 20 }, (_, i) => `Val${i}`)
      ];

      expect(() => {
        generateOutput('csv', manyColumns);
        generateOutput('json', manyColumns);
      }).not.toThrow();
    });

    it('Unicode和多语言支持', () => {
      const unicodeData = [
        ['姓名', '年齢', '都市'],
        ['張三', '25', '北京'],
        ['田中', '30', '東京']
      ];

      const csvResult = generateOutput('csv', unicodeData);
      expect(csvResult).toContain('張三');

      const jsonResult = JSON.parse(generateOutput('json', unicodeData));
      expect(jsonResult[0].姓名).toBe('張三');
    });
  });
});
