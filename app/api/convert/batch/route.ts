/**
 * @file 批量转换 API 路由
 * @description 处理批量文件转换任务，支持多文件异步处理和持久化存储
 * @module app/api/convert/batch/route
 * @author YYC
 * @version 2.0.0
 * @created 2026-02-22
 * @updated 2026-05-24 - 添加文件系统持久化支持
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { readFile, writeFile, mkdir, unlink, readdir } from 'fs/promises';
import { join } from 'path';

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
  notifyEmail: z.string().email().optional(),
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

const TASKS_DIR = join(process.cwd(), '.data', 'batch-tasks');
const TASK_RETENTION_HOURS = 24;

async function ensureTasksDir() {
  try {
    await mkdir(TASKS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create tasks directory:', error);
  }
}

async function saveTask(task: BatchTask): Promise<void> {
  await ensureTasksDir();
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

async function deleteTask(batchId: string): Promise<void> {
  try {
    const filePath = join(TASKS_DIR, `${batchId}.json`);
    await unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete task ${batchId}:`, error);
  }
}

async function cleanupOldTasks(): Promise<void> {
  try {
    const files = await readdir(TASKS_DIR);
    const now = Date.now();
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = join(TASKS_DIR, file);
      const data = await readFile(filePath, 'utf-8');
      const task = JSON.parse(data) as BatchTask;
      const createdAt = new Date(task.createdAt).getTime();
      const ageHours = (now - createdAt) / (1000 * 60 * 60);
      
      if (ageHours > TASK_RETENTION_HOURS) {
        await unlink(filePath);
        console.log(`Cleaned up old task: ${task.id}`);
      }
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

setInterval(cleanupOldTasks, 60 * 60 * 1000); // 每小时清理一次

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = batchConvertSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: '参数验证失败', details: validated.error.errors },
        { status: 400 }
      );
    }

    const { files, outputFormat, options, notifyEmail } = validated.data;
    const batchId = uuidv4();

    const batchTask: BatchTask = {
      id: batchId,
      status: 'pending',
      files: files.map(f => ({
        name: f.name,
        format: f.format,
        status: 'pending' as const,
      })),
      outputFormat,
      options,
      createdAt: new Date().toISOString(),
      progress: 0,
    };

    await saveTask(batchTask);

    processBatchConversion(batchId, files, outputFormat, options);

    return NextResponse.json({
      success: true,
      batchId,
      message: '批量转换任务已创建',
      totalFiles: files.length,
      statusUrl: `/api/convert/batch/${batchId}`,
    });
  } catch (error) {
    console.error('Batch conversion error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const batchId = params.batchId || new URL(request.url).searchParams.get('batchId');
    
    if (!batchId) {
      return NextResponse.json(
        { success: false, message: '缺少 batchId 参数' },
        { status: 400 }
      );
    }

    const task = await loadTask(batchId);
    
    if (!task) {
      return NextResponse.json(
        { success: false, message: '任务不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      batchId: task.id,
      status: task.status,
      progress: task.progress,
      totalFiles: task.files.length,
      completedFiles: task.files.filter(f => f.status === 'completed').length,
      failedFiles: task.files.filter(f => f.status === 'failed').length,
      results: task.status === 'completed' ? task.files.map(f => ({
        name: f.name,
        result: f.result,
        error: f.error,
      })) : undefined,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    });
  } catch (error) {
    console.error('Get batch status error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

async function processBatchConversion(
  batchId: string,
  files: { name: string; format: string; content: string }[],
  outputFormat: string,
  options: any
) {
  const task = await loadTask(batchId);
  if (!task) return;

  task.status = 'processing';
  await saveTask(task);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    task.files[i].status = 'processing';
    task.progress = Math.round(((i) / files.length) * 100);
    await saveTask(task);

    try {
      const result = await convertFile(file, outputFormat, options);
      task.files[i].status = 'completed';
      task.files[i].result = result;
    } catch (error) {
      task.files[i].status = 'failed';
      task.files[i].error = error instanceof Error ? error.message : '转换失败';
    }

    task.progress = Math.round(((i + 1) / files.length) * 100);
  }

  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  task.progress = 100;
  await saveTask(task);
}

async function convertFile(
  file: { name: string; format: string; content: string },
  outputFormat: string,
  options: any
): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

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
