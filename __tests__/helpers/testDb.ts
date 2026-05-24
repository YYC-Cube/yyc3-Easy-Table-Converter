import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

export function createTestDatabase(): Database.Database {
  const testDb = new Database(':memory:', { 
    verbose: process.env.NODE_ENV === 'test' ? console.log : undefined
  });
  
  testDb.pragma('journal_mode = WAL');
  testDb.pragma('foreign_keys = ON');
  
  return testDb;
}

export function seedTestDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS error_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      code TEXT,
      stack TEXT,
      level TEXT DEFAULT 'error',
      url TEXT,
      user_agent TEXT,
      user_id INTEGER,
      ip_address TEXT,
      metadata JSON,
      resolved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS conversion_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      original_format TEXT NOT NULL,
      target_format TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      file_size INTEGER,
      result JSON,
      error_message TEXT,
      processing_time_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_value TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      permissions JSON,
      rate_limit INTEGER DEFAULT 1000,
      is_active INTEGER DEFAULT 1,
      expires_at DATETIME,
      last_used_at DATETIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
    CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_conversion_tasks_batch ON conversion_tasks(batch_id);
    CREATE INDEX IF NOT EXISTS idx_conversion_tasks_status ON conversion_tasks(status);
  `);
  
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, role) 
    VALUES (?, ?, ?)
  `);
  
  insertUser.run('admin', 'admin@yyc3.com', 'admin');
  insertUser.run('testuser', 'test@yyc3.com', 'user');
  
  const insertApiKey = db.prepare(`
    INSERT OR IGNORE INTO api_keys (key_value, name, permissions, created_by)
    VALUES (?, ?, ?, ?)
  `);
  
  insertApiKey.run(
    'test-api-key-12345', 
    'Test API Key', 
    JSON.stringify(['read', 'write']), 
    1
  );
}
