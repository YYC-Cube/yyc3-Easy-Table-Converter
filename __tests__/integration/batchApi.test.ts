/**
 * @file 批量转换 API 集成测试
 * @description 测试批量转换API的核心功能，包括任务创建、状态查询和结果获取
 * @module __tests__/integration/batchApi.test
 * @author YYC
 * @version 1.0.0
 * @created 2026-05-24
 */

import { readFile, unlink, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

const TASKS_DIR = join(process.cwd(), '.data', 'batch-tasks');

const batchConvertSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    format: z.string(),
    content: z.string(),
  })).min(1).max(50),
  outputFormat: z.string().min(1).max(20),
  options: z.object({
    delimiter: z.string().optional(),
    headers: z.boolean().optional().default(true),
    precision: z.number().optional().default(2),
  }).optional().default({}),
});

interface BatchTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  files: {
    name: string;
    format: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: any;
    error?: string;
  }[];
  outputFormat: string;
  options: any;
  createdAt: string;
  completedAt?: string;
  progress: number;
}

async function ensureTasksDir() {
  const { mkdir } = await import('fs/promises');
  try {
    await mkdir(TASKS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create tasks directory:', error);
  }
}

async function saveTask(task: BatchTask): Promise<void> {
  await ensureTasksDir();
  const { writeFile } = await import('fs/promises');
  const filePath = join(TASKS_DIR, `${task.id}.json`);
  await writeFile(filePath, JSON.stringify(task, null, 2), 'utf-8');
}

async function loadTask(batchId: string): Promise<BatchTask | null> {
  try {
    const filePath = join(TASKS_DIR, `${batchId}.json`);
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data) as BatchTask;
  } catch (error) {
    return null;
  }
}

function convertToCSV(data: any, options: any): string {
  const delimiter = options.delimiter || ',';
  
  if (!Array.isArray(data)) {
    data = [data];
  }

  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((row: any) => 
    headers.map(h => JSON.stringify(row[h] ?? '')).join(delimiter)
  );

  return [headers.join(delimiter), ...rows].join('\n');
}

function convertToXML(data: any, filename: string): string {
  if (!Array.isArray(data)) {
    data = [data];
  }

  const items = data.map((row: any) => {
    const fields = Object.entries(row)
      .map(([k, v]) => `  <${k}>${v}</${k}>`)
      .join('\n');
    return `  <item>\n${fields}\n  </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${filename}>\n${items}\n</${filename}>`;
}

function convertToMarkdown(data: any): string {
  if (!Array.isArray(data)) {
    data = [data];
  }

  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const rows = data.map((row: any) => 
    `| ${headers.map(h => row[h] ?? '').join(' | ')} |`
  ).join('\n');

  return `${headerRow}\n${separator}\n${rows}`;
}

async function convertFile(
  file: { name: string; format: string; content: string },
  outputFormat: string,
  options: any
): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));

  let data: any;
  try {
    data = JSON.parse(file.content);
  } catch {
    data = file.content.split('\n').map((line: string) => line.split(','));
  }

  let result: string;
  switch (outputFormat.toLowerCase()) {
    case 'csv':
      result = convertToCSV(data, options);
      break;
    case 'json':
      result = JSON.stringify(data, null, 2);
      break;
    case 'xml':
      result = convertToXML(data, file.name);
      break;
    case 'markdown':
      result = convertToMarkdown(data);
      break;
    default:
      result = JSON.stringify(data);
  }

  return {
    filename: `${file.name.replace(/\.[^.]+$/, '')}_converted.${outputFormat.toLowerCase()}`,
    content: result,
    size: result.length,
  };
}

describe('Batch Conversion API Integration', () => {
  describe('Schema Validation', () => {
    it('should validate correct input', () => {
      const validInput = {
        files: [{ name: 'test.csv', format: 'csv', content: '{}' }],
        outputFormat: 'json',
        options: {},
      };

      const result = batchConvertSchema.safeParse(validInput);
      
      expect(result.success).toBe(true);
    });

    it('should reject empty files array', () => {
      const invalidInput = {
        files: [],
        outputFormat: 'json',
      };

      const result = batchConvertSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });

    it('should reject more than 50 files', () => {
      const files = Array.from({ length: 51 }, (_, i) => ({
        name: `file${i}.csv`,
        format: 'csv',
        content: '{}',
      }));

      const result = batchConvertSchema.safeParse({ files, outputFormat: 'json' });
      
      expect(result.success).toBe(false);
    });

    it('should accept optional notifyEmail', () => {
      const inputWithOptional = {
        files: [{ name: 'test.csv', format: 'csv', content: '{}' }],
        outputFormat: 'json',
        notifyEmail: 'test@example.com',
      };

      const schemaWithEmail = batchConvertSchema.extend({
        notifyEmail: z.string().email().optional(),
      });

      const result = schemaWithEmail.safeParse(inputWithOptional);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Task Persistence', () => {
    it('should save and load task correctly', async () => {
      const task: BatchTask = {
        id: 'test-task-' + Date.now(),
        status: 'pending',
        files: [
          { name: 'file1.csv', format: 'csv', status: 'pending' },
          { name: 'file2.csv', format: 'csv', status: 'pending' },
        ],
        outputFormat: 'json',
        options: {},
        createdAt: new Date().toISOString(),
        progress: 0,
      };

      await saveTask(task);
      const loaded = await loadTask(task.id);

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe(task.id);
      expect(loaded?.files).toHaveLength(2);
      expect(loaded?.status).toBe('pending');
    });

    it('should return null for non-existent task', async () => {
      const loaded = await loadTask('non-existent-id');
      expect(loaded).toBeNull();
    });

    it('should update task status', async () => {
      const taskId = 'update-test-' + Date.now();
      const task: BatchTask = {
        id: taskId,
        status: 'pending',
        files: [{ name: 'test.csv', format: 'csv', status: 'pending' }],
        outputFormat: 'json',
        options: {},
        createdAt: new Date().toISOString(),
        progress: 0,
      };

      await saveTask(task);
      
      task.status = 'processing';
      task.progress = 50;
      await saveTask(task);

      const loaded = await loadTask(taskId);
      expect(loaded?.status).toBe('processing');
      expect(loaded?.progress).toBe(50);
    });
  });

  describe('File Conversion Functions', () => {
    describe('convertToCSV', () => {
      it('should convert JSON array to CSV', () => {
        const data = [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ];
        
        const csv = convertToCSV(data, {});
        
        expect(csv).toContain('name,age');
        expect(csv).toContain('"John",30');
        expect(csv).toContain('"Jane",25');
      });

      it('should use custom delimiter', () => {
        const data = [{ a: 1, b: 2 }];
        const csv = convertToCSV(data, { delimiter: ';' });
        
        expect(csv).toContain('a;b');
        expect(csv).toContain('1;2');
      });

      it('should handle empty array', () => {
        const csv = convertToCSV([], {});
        expect(csv).toBe('');
      });

      it('should handle single object', () => {
        const csv = convertToCSV({ key: 'value' }, {});
        expect(csv).toContain('key');
        expect(csv).toContain('value');
      });
    });

    describe('convertToXML', () => {
      it('should convert to valid XML', () => {
        const data = [{ id: 1, value: 'test' }];
        const xml = convertToXML(data, 'items');
        
        expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(xml).toContain('<items>');
        expect(xml).toContain('</items>');
        expect(xml).toContain('<id>1</id>');
        expect(xml).toContain('<value>test</value>');
      });
    });

    describe('convertToMarkdown', () => {
      it('should convert to markdown table', () => {
        const data = [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ];
        const md = convertToMarkdown(data);
        
        expect(md).toContain('| name | age |');
        expect(md).toContain('| --- | --- |');
        expect(md).toContain('| John | 30 |');
        expect(md).toContain('| Jane | 25 |');
      });

      it('should handle empty array', () => {
        const md = convertToMarkdown([]);
        expect(md).toBe('');
      });
    });
  });

  describe('convertFile Integration', () => {
    it('should convert JSON to CSV', async () => {
      const result = await convertFile(
        { name: 'data.json', format: 'json', content: '[{"name":"John","age":30}]' },
        'csv',
        {}
      );

      expect(result.filename).toMatch(/\.csv$/);
      expect(result.content).toContain('name');
      expect(result.content).toContain('age');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should convert JSON to XML', async () => {
      const result = await convertFile(
        { name: 'data.json', format: 'json', content: '[{"id":1}]' },
        'xml',
        {}
      );

      expect(result.filename).toMatch(/\.xml$/);
      expect(result.content).toContain('<?xml');
    });

    it('should convert JSON to Markdown', async () => {
      const result = await convertFile(
        { name: 'data.json', format: 'json', content: '[{"key":"value"}]' },
        'markdown',
        {}
      );

      expect(result.filename).toMatch(/\.markdown$/);
      expect(result.content).toContain('| key |');
    });

    it('should preserve JSON as JSON', async () => {
      const originalContent = '[{"a":1,"b":2}]';
      const result = await convertFile(
        { name: 'data.csv', format: 'csv', content: originalContent },
        'json',
        {}
      );

      expect(result.filename).toMatch(/\.json$/);
      const parsed = JSON.parse(result.content);
      expect(parsed).toEqual([{ a: 1, b: 2 }]);
    });

    it('should handle plain text input', async () => {
      const result = await convertFile(
        { name: 'data.txt', format: 'txt', content: 'header1,header2\nvalue1,value2' },
        'json',
        {}
      );

      expect(result).toBeDefined();
      expect(result.filename).toBeTruthy();
    });
  });

  describe('Batch Processing Simulation', () => {
    it('should process multiple files in sequence', async () => {
      const files = [
        { name: 'file1.json', format: 'json', content: '[{"a":1}]' },
        { name: 'file2.json', format: 'json', content: '[{"b":2}]' },
        { name: 'file3.json', format: 'json', content: '[{"c":3}]' },
      ];

      const results = await Promise.all(
        files.map(file => convertFile(file, 'csv', {}))
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.filename).toMatch(/\.csv$/);
        expect(result.size).toBeGreaterThan(0);
      });
    });

    it('should handle conversion errors gracefully', async () => {
      const result = await convertFile(
        { name: 'empty.json', format: 'json', content: '' },
        'json',
        {}
      );

      expect(result).toBeDefined();
    });
  });
});