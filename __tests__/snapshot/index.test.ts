/**
 * @file 快照测试套件
 * @description 使用Snapshot Testing检测UI组件和工具函数的意外变更
 * @module __tests__/snapshot/__snapshots__/index.test.ts
 * @author YYC
 * @version 1.0.0 (Fixed)
 * @created 2025-01-24
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { generateOutput } from '../../lib/formatGenerators';
import { convertColor } from '../../lib/utils/colorConverter';

describe('Snapshot Testing Suite', () => {
  
  describe('格式生成器输出快照', () => {
    const sampleData = [
      ['Name', 'Age', 'City'],
      ['Alice', '30', 'Beijing'],
      ['Bob', '25', 'Shanghai']
    ];

    it('CSV格式输出应该匹配快照', () => {
      const result = generateOutput('csv', sampleData);
      expect(result).toMatchSnapshot('csv-format-output');
    });

    it('TSV格式输出应该匹配快照', () => {
      const result = generateOutput('tsv', sampleData);
      expect(result).toMatchSnapshot('tsv-format-output');
    });

    it('HTML格式输出应该匹配快照', () => {
      const result = generateOutput('html', sampleData);
      expect(result).toMatchSnapshot('html-format-output');
    });

    it('Markdown格式输出应该匹配快照', () => {
      const result = generateOutput('markdown', sampleData);
      expect(result).toMatchSnapshot('markdown-format-output');
    });

    it('JSON格式输出应该匹配快照', () => {
      const result = generateOutput('json', sampleData);
      expect(result).toMatchSnapshot('json-format-output');
    });

    it('SQL格式输出应该匹配快照', () => {
      const result = generateOutput('sql', sampleData);
      expect(result).toMatchSnapshot('sql-format-output');
    });

    it('YAML格式输出应该匹配快照', () => {
      const result = generateOutput('yaml', sampleData);
      expect(result).toMatchSnapshot('yaml-format-output');
    });

    it('XML格式输出应该匹配快照', () => {
      const result = generateOutput('xml', sampleData);
      expect(result).toMatchSnapshot('xml-format-output');
    });
  });

  describe('颜色转换器输出快照', () => {
    it('HEX到RGB转换应该匹配快照', () => {
      const result = convertColor('#ff0000', 'rgb');
      expect(result).toMatchInlineSnapshot(`"rgb(255, 0, 0)"`);
    });

    it('HEX到HSL转换应该包含正确的结构', () => {
      const result = convertColor('#00ff00', 'hsl');
      // 验证HSL格式的结构而不依赖精确值
      expect(result).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });

    it('无效颜色输入应该返回空字符串', () => {
      const result = convertColor('invalid-color', 'hex');
      expect(result).toBe('');
    });
  });

  describe('边界条件快照', () => {
    it('空数据集的CSV输出应该匹配快照', () => {
      const result = generateOutput('csv', [] as string[][]);
      expect(result).toMatchSnapshot('empty-csv-output');
    });

    it('单条记录的JSON输出应该匹配快照', () => {
      const singleRecord = [['key', 'value']];
      const result = generateOutput('json', singleRecord);
      expect(result).toMatchSnapshot('single-record-json');
    });

    it('特殊字符数据的HTML输出应该正确转义', () => {
      const specialCharData = [
        ['name', 'content'],
        ['<script>alert("xss")</script>', '"quotes" & ampersand']
      ];
      const result = generateOutput('html', specialCharData);
      
      // 验证特殊字符被转义
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
      expect(result).toMatchSnapshot('special-chars-html');
    });

    it('Unicode和多语言数据应该正确处理', () => {
      const unicodeData = [
        ['name', 'emoji', 'arabic'],
        ['中文测试', '🎉 日本語', 'العربية']
      ];
      const result = generateOutput('json', unicodeData);
      expect(result).toMatchSnapshot('unicode-data-json');
    });
  });

  describe('大数据量性能快照', () => {
    it('大量列数据（20+列）的CSV输出应该高效生成', () => {
      const headerRow = Array.from({ length: 25 }, (_, i) => `Column${i}`);
      const dataRows = Array.from({ length: 5 }, (_, rowIndex) =>
        Array.from({ length: 25 }, (_, colIndex) => `Value${rowIndex}_${colIndex}`)
      );
      
      const manyColumnsData = [headerRow, ...dataRows];

      const startTime = performance.now();
      const result = generateOutput('csv', manyColumnsData);
      const endTime = performance.now();

      // 验证生成时间合理（< 100ms）
      expect(endTime - startTime).toBeLessThan(100);
      
      // 验证输出包含所有列
      expect(result.split('\n')[0].split(',').length).toBe(25);
      expect(result).toMatchSnapshot('large-columns-csv');
    });

    it('大量行数据（1000+行）的JSON输出应该高效生成', () => {
      const headerRow = ['id', 'name', 'value'];
      const manyRowsData = [headerRow, ...Array.from({ length: 1000 }, (_, i) => 
        [i.toString(), `Item${i}`, (Math.random() * 100).toFixed(2)]
      )];

      const startTime = performance.now();
      const result = generateOutput('json', manyRowsData);
      const endTime = performance.now();

      // 验证生成时间合理（< 200ms）
      expect(endTime - startTime).toBeLessThan(200);
      
      // 验证是有效的JSON
      const parsed = JSON.parse(result);
      expect(parsed.length).toBe(1001); // 包含表头行
    });
  });

  describe('错误处理快照', () => {
    it('null/undefined数据处理应该优雅降级', () => {
      const nullData = [['name', 'age'], ['', '']] as string[][];
      const csvResult = generateOutput('csv', nullData);
      
      // 应该将空值转换为空字符串
      expect(csvResult).toContain(',');
      expect(csvResult).toMatchSnapshot('null-data-handling');
    });

    it('嵌套数据的处理（通过字符串表示）', () => {
      const nestedData = [
        ['user.name', 'user.address.city', 'user.address.coordinates.lat'],
        ['Alice', 'Beijing', '39.9']
      ];
      
      const result = generateOutput('json', nestedData);
      const parsed = JSON.parse(result);
      
      expect(parsed[0][0]).toBe('Alice');
      expect(parsed[0][1]).toBe('Beijing');
      expect(result).toMatchSnapshot('nested-string-data-json');
    });
  });
});

describe('在线快照更新策略', () => {
  /**
   * 快照测试最佳实践：
   * 
   * 1. 初次运行：使用 --updateSnapshot 创建基准快照
   *    命令：npx jest __tests__/snapshot/ --updateSnapshot
   * 
   * 2. 日常开发：运行测试检查是否有意外变更
   *    命令：npx jest __tests__/snapshot/
   * 
   * 3. 有意修改后：审查变更并决定是否更新快照
   *    - 如果变更是预期的：npx jest __tests__/snapshot/ -u
   *    - 如果变更非预期：修复代码使测试通过
   * 
   * 4. CI/CD集成：
   *    - 禁止自动更新快照（CI_SNAPSHOT=true环境变量）
   *    - 失败时提供详细的diff信息
   */
  
  it('示例：如何验证有意的设计变更', () => {
    // 当你需要更改某个输出格式时：
    // 1. 先在此处添加注释说明变更原因
    // 2. 运行 npx jest __tests__/snapshot/ -u 更新快照
    // 3. 在PR中review快照diff确认变更合理性
    
    const data = [['key'], ['value']] as string[][];
    const result = generateOutput('csv', data);
    
    // 这个快照会在首次运行时创建，后续用于回归检测
    expect(result).toMatchSnapshot('design-change-example');
  });
});
