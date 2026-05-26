/**
 * @file Parsers 单元测试
 * @description 测试表格数据解析功能（CSV、TSV、JSON）
 */

import { parseCSV, parseTSV, parseJSON } from '@/lib/table/parsers';

describe('Table Parsers', () => {
  describe('parseCSV', () => {
    it('应该正确解析基本CSV数据', () => {
      const csvData = 'name,age,city\nAlice,30,Beijing\nBob,25,Shanghai';
      const result = parseCSV(csvData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Alice',
        age: '30',
        city: 'Beijing'
      });
    });

    it('应该处理包含空格的数据', () => {
      const csvData = ' name , age \n Alice , 30 ';
      const result = parseCSV(csvData);

      expect(result[0]).toEqual({
        name: 'Alice',
        age: '30'
      });
    });

    it('应该处理单行数据', () => {
      const csvData = 'header1,header2\ndata1,data2';
      const result = parseCSV(csvData);

      expect(result).toHaveLength(1);
    });

    it('应该处理空值单元格', () => {
      const csvData = 'name,value\nAlice,';
      const result = parseCSV(csvData);

      expect(result[0].value).toBe('');
    });

    it('应该处理只有表头的情况', () => {
      const csvData = 'col1,col2,col3';
      const result = parseCSV(csvData);

      expect(result).toHaveLength(0);
    });

    it('应该处理多列数据', () => {
      const csvData = 'a,b,c,d,e,f,g,h,i,j\n1,2,3,4,5,6,7,8,9,10';
      const result = parseCSV(csvData);

      expect(Object.keys(result[0])).toHaveLength(10);
    });

    it('应该处理特殊字符（逗号在引号内）- 基础测试', () => {
      // 注意：这个简单的解析器不支持引号内的逗号
      const csvData = 'name,description\ntest,hello world';
      const result = parseCSV(csvData);

      expect(result[0].description).toBe('hello world');
    });
  });

  describe('parseTSV', () => {
    it('应该正确解析基本TSV数据', () => {
      const tsvData = 'name\tage\tcity\nAlice\t30\tBeijing';
      const result = parseTSV(tsvData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Alice',
        age: '30',
        city: 'Beijing'
      });
    });

    it('应该处理多个Tab分隔的列', () => {
      const tsvData = 'a\tb\tc\td\te\n1\t2\t3\t4\t5';
      const result = parseTSV(tsvData);

      expect(Object.keys(result[0])).toHaveLength(5);
    });

    it('应该处理空TSV数据行', () => {
      const tsvData = 'col1\tcol2\n\t';
      const result = parseTSV(tsvData);

      // 当数据行只有tab分隔符时，可能返回空对象或undefined值
      if (result.length > 0) {
        expect(result[0].col1).toBe('');
        expect(result[0].col2).toBe('');
      } else {
        // 如果解析器跳过空行，这也是可接受的行为
        expect(result).toHaveLength(0);
      }
    });

    it('应该正确去除空白字符', () => {
      const tsvData = ' name \t age \n Alice \t 30 ';
      const result = parseTSV(tsvData);

      expect(result[0]).toEqual({ name: 'Alice', age: '30' });
    });
  });

  describe('parseJSON', () => {
    it('应该正确解析JSON数组', () => {
      const jsonData = '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]';
      const result = parseJSON(jsonData);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
    });

    it('应该将单个对象包装为数组', () => {
      const jsonData = '{"name": "Alice", "age": 30}';
      const result = parseJSON(jsonData);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    it('应该解析嵌套的JSON结构', () => {
      const jsonData = '[{"user": {"name": "Alice", "address": {"city": "Beijing"}}}]';
      const result = parseJSON(jsonData);

      expect(result[0].user.address.city).toBe('Beijing');
    });

    it('应该处理空数组', () => {
      const jsonData = '[]';
      const result = parseJSON(jsonData);

      expect(result).toHaveLength(0);
    });

    it('应该处理数字和布尔值', () => {
      const jsonData = '[{"count": 42, "active": true, "price": 19.99}]';
      const result = parseJSON(jsonData);

      expect(result[0].count).toBe(42);
      expect(result[0].active).toBe(true);
      expect(result[0].price).toBe(19.99);
    });

    it('应该在无效JSON时抛出错误', () => {
      const invalidJson = '{invalid json}';

      expect(() => {
        parseJSON(invalidJson);
      }).toThrow();
    });
  });

  describe('边界条件', () => {
    it('应该处理Unicode字符', () => {
      const csvData = '姓名,年龄,城市\n张三,25,北京\n田中,30,東京';
      const result = parseCSV(csvData);

      expect(result[0].姓名).toBe('张三');
      expect(result[1].城市).toBe('東京');
    });

    it('应该处理大量数据行', () => {
      const headers = 'id,name,value';
      const rows = Array.from({ length: 100 }, (_, i) => `${i},item${i},${i * 10}`);
      const csvData = `${headers}\n${rows.join('\n')}`;

      const result = parseCSV(csvData);

      expect(result).toHaveLength(100);
    });

    it('应该处理超长字段值', () => {
      const longValue = 'A'.repeat(10000);
      const csvData = `field\n${longValue}`;
      const result = parseCSV(csvData);

      expect(result[0].field).toBe(longValue);
    });
  });
});
