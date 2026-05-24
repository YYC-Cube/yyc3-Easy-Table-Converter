/**
 * @file 数据库集成测试（使用内存数据库Mock）
 * @description 使用SQLite内存数据库进行集成测试，无需外部依赖
 * @module __tests__/integration/database.test
 * @author YYC
 * @version 2.0.0
 * @updated 2026-05-24 - 重构为使用内存数据库，解决环境依赖问题
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { createTestDatabase, seedTestDatabase } from '../helpers/testDb';
import { createAdapter } from '../helpers/dbAdapter';

describe('Database Integration Tests (SQLite Mock)', () => {
  let db: Database.Database;
  let adapter: ReturnType<typeof createAdapter>;

  beforeAll(() => {
    db = createTestDatabase();
    seedTestDatabase(db);
    adapter = createAdapter(db);
    console.log('[Test] SQLite in-memory database initialized');
  });

  afterAll(() => {
    adapter.close();
    console.log('[Test] Database connection closed');
  });

  beforeEach(() => {
    console.log('[Test] Starting new test case...');
  });

  describe('Connection Test', () => {
    it('应该能成功连接到数据库', () => {
      const conn = adapter.getConnection();
      expect(conn).toBeDefined();
      expect(conn.release).toBeDefined();
      conn.release();
    });

    it('应该能执行简单查询', () => {
      const result = adapter.query<{ test: number }>('SELECT 1 as test');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]?.test).toBe(1);
    });

    it('应该能执行参数化查询', () => {
      const result = adapter.query<{ value: string }>(
        'SELECT ? as value',
        ['hello']
      );
      expect(result[0]?.value).toBe('hello');
    });
  });

  describe('User Table Test', () => {
    it('应该能查询用户表结构', () => {
      const columns = adapter.query<{ name: string; type: string }>(
        "SELECT name, type FROM pragma_table_info('users')"
      );
      
      expect(columns.length).toBeGreaterThan(0);
      
      const columnNames = columns.map(col => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('username');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('role');
      
      console.log('[Test] Users table structure:', columnNames);
    });

    it('应该能查询用户表数据', () => {
      const users = adapter.query<any>('SELECT id, username, email, role FROM users LIMIT 10');
      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(2);
      
      console.log('[Test] Users data:', users.map(u => u.username));
    });

    it('应该能插入新用户', () => {
      const insertResult = adapter.execute(`
        INSERT INTO users (username, email, role) 
        VALUES (?, ?, ?)
      `, ['newuser', 'newuser@test.com', 'user']);
      
      expect(insertResult.changes).toBe(1);
      expect(insertResult.lastInsertRowid).toBeGreaterThan(0);
      
      const newUser = adapter.queryOne<any>(
        "SELECT * FROM users WHERE username = 'newuser'"
      );
      expect(newUser?.email).toBe('newuser@test.com');
    });

    it('应该能更新用户信息', () => {
      adapter.execute(
        "UPDATE users SET role = 'admin' WHERE username = 'testuser'"
      );
      
      const updatedUser = adapter.queryOne<any>(
        "SELECT role FROM users WHERE username = 'testuser'"
      );
      expect(updatedUser?.role).toBe('admin');
    });
  });

  describe('Error Logs Table Test', () => {
    it('应该能查询错误日志表结构', () => {
      const columns = adapter.query<{ name: string }>(
        "SELECT name FROM pragma_table_info('error_logs')"
      );
      
      expect(columns.length).toBeGreaterThan(0);
      const columnNames = columns.map(col => col.name);
      expect(columnNames).toContain('message');
      expect(columnNames).toContain('level');
      expect(columnNames).toContain('created_at');
    });

    it('应该能插入错误日志', () => {
      const testError = {
        message: 'Test error message',
        code: 'TEST_ERROR',
        stack: 'Test stack trace',
        level: 'error',
        url: '/test',
        userAgent: 'Jest Test',
      };

      const insertResult = adapter.execute(`
        INSERT INTO error_logs (message, code, stack, level, url, user_agent) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        testError.message,
        testError.code,
        testError.stack,
        testError.level,
        testError.url,
        testError.userAgent,
      ]);

      expect(insertResult.changes).toBe(1);
      
      const insertedLog = adapter.queryOne<any>(
        "SELECT * FROM error_logs WHERE code = 'TEST_ERROR'"
      );
      expect(insertedLog?.message).toBe(testError.message);
      expect(insertedLog?.level).toBe(testError.level);
    });

    it('应该能按级别查询错误日志', () => {
      adapter.execute(`
        INSERT INTO error_logs (message, level) 
        VALUES ('Warning message', 'warning')
      `);

      const errorLogs = adapter.query<any>(
        "SELECT * FROM error_logs WHERE level = 'error'"
      );
      const warningLogs = adapter.query<any>(
        "SELECT * FROM error_logs WHERE level = 'warning'"
      );

      expect(errorLogs.length).toBeGreaterThanOrEqual(1);
      expect(warningLogs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Conversion Tasks Table Test', () => {
    it('应该能查询转换任务表结构', () => {
      const columns = adapter.query<{ name: string }>(
        "SELECT name FROM pragma_table_info('conversion_tasks')"
      );
      
      expect(columns.length).toBeGreaterThan(0);
      const columnNames = columns.map(col => col.name);
      expect(columnNames).toContain('batch_id');
      expect(columnNames).toContain('file_name');
      expect(columnNames).toContain('status');
    });

    it('应该能创建和查询转换任务', () => {
      const batchId = `batch-${Date.now()}`;
      
      adapter.execute(`
        INSERT INTO conversion_tasks (batch_id, file_name, original_format, target_format, status)
        VALUES (?, ?, ?, ?, ?)
      `, [batchId, 'test.csv', 'csv', 'json', 'pending']);

      const tasks = adapter.query<any>(
        "SELECT * FROM conversion_tasks WHERE batch_id = ?",
        [batchId]
      );
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].status).toBe('pending');
    });

    it('应该能更新任务状态', () => {
      const batchId = `batch-update-${Date.now()}`;
      
      adapter.execute(`
        INSERT INTO conversion_tasks (batch_id, file_name, original_format, target_format, status)
        VALUES (?, ?, ?, ?, ?)
      `, [batchId, 'update-test.csv', 'csv', 'json', 'pending']);

      adapter.execute(
        "UPDATE conversion_tasks SET status = 'completed' WHERE batch_id = ?",
        [batchId]
      );

      const updatedTask = adapter.queryOne<any>(
        "SELECT status FROM conversion_tasks WHERE batch_id = ?",
        [batchId]
      );
      
      expect(updatedTask?.status).toBe('completed');
    });
  });

  describe('API Keys Table Test', () => {
    it('应该能查询API密钥表结构', () => {
      const columns = adapter.query<{ name: string }>(
        "SELECT name FROM pragma_table_info('api_keys')"
      );
      
      expect(columns.length).toBeGreaterThan(0);
      const columnNames = columns.map(col => col.name);
      expect(columnNames).toContain('key_value');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('permissions');
    });

    it('应该能验证API密钥存在性', () => {
      const apiKey = adapter.queryOne<any>(
        "SELECT key_value, name FROM api_keys WHERE key_value = ?",
        ['test-api-key-12345']
      );
      
      expect(apiKey).toBeDefined();
      expect(apiKey?.name).toBe('Test API Key');
    });
  });

  describe('Transaction Support Test', () => {
    it('应该支持事务操作', () => {
      const initialCount = adapter.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM users'
      )?.count || 0;

      try {
        adapter.transaction(() => {
          adapter.execute(
            "INSERT INTO users (username, email) VALUES ('tx-user-1', 'tx1@test.com')"
          );
          adapter.execute(
            "INSERT INTO users (username, email) VALUES ('tx-user-2', 'tx2@test.com')"
          );
          
          throw new Error('Intentional rollback');
        });
      } catch (error) {
        // Expected rollback
      }

      const finalCount = adapter.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM users'
      )?.count || 0;
      
      expect(finalCount).toBe(initialCount);
    });

    it('应该支持成功事务提交', () => {
      const beforeCount = adapter.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM error_logs'
      )?.count || 0;

      adapter.transaction(() => {
        adapter.execute(
          "INSERT INTO error_logs (message, level) VALUES ('Tx log 1', 'info')"
        );
        adapter.execute(
          "INSERT INTO error_logs (message, level) VALUES ('Tx log 2', 'info')"
        );
      });

      const afterCount = adapter.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM error_logs'
      )?.count || 0;
      
      expect(afterCount).toBe(beforeCount + 2);
    });
  });

  describe('Performance Test', () => {
    it('应该能在合理时间内完成批量插入', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        adapter.execute(
          'INSERT INTO error_logs (message, level) VALUES (?, ?)',
          [`Batch error ${i}`, 'warning']
        );
      }
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000);
      
      const count = adapter.queryOne<{ c: number }>(
        "SELECT COUNT(*) as c FROM error_logs WHERE level = 'warning'"
      )?.c || 0;
      expect(count).toBeGreaterThanOrEqual(100);
    });
  });
});
