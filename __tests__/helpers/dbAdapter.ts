import Database from 'better-sqlite3';

export interface IDatabaseAdapter {
  query<T>(sql: string, params?: any[]): T[];
  queryOne<T>(sql: string, params?: any[]): T | undefined;
  execute(sql: string, params?: any[]): Database.RunResult;
  getConnection(): TestConnection;
  close(): void;
  transaction<T>(fn: () => T): T;
}

export interface TestConnection {
  release(): void;
}

export class SQLiteTestAdapter implements IDatabaseAdapter {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  query<T>(sql: string, params?: any[]): T[] {
    try {
      if (params && params.length > 0) {
        return this.db.prepare(sql).all(...params) as T[];
      }
      return this.db.prepare(sql).all() as T[];
    } catch (error) {
      console.error('[SQLiteTestAdapter] Query error:', { sql, params, error });
      throw error;
    }
  }

  queryOne<T>(sql: string, params?: any[]): T | undefined {
    const results = this.query<T>(sql, params);
    return results[0];
  }

  execute(sql: string, params?: any[]): Database.RunResult {
    try {
      if (params && params.length > 0) {
        return this.db.prepare(sql).run(...params);
      }
      return this.db.prepare(sql).run();
    } catch (error) {
      console.error('[SQLiteTestAdapter] Execute error:', { sql, params, error });
      throw error;
    }
  }

  getConnection(): TestConnection {
    return {
      release: () => {}
    };
  }

  close(): void {
    this.db.close();
  }

  transaction<T>(fn: () => T): T {
    const transaction = this.db.transaction(fn);
    return transaction();
  }
}

export function createAdapter(db: Database.Database): SQLiteTestAdapter {
  return new SQLiteTestAdapter(db);
}
