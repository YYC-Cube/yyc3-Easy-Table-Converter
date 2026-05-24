/**
 * @file 数据库配置模块
 * @description MariaDB 数据库连接配置，基于 DATABASE_SUMMARY.md 的 Web 应用账号
 * @module lib/db
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import mysql, { Pool, PoolOptions } from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'yyc3_33',
  user: process.env.DB_USER || 'yyc3_web',
  password: process.env.DB_PASSWORD || 'yyc3_web_2026',
  charset: process.env.DB_CHARSET || 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool: Pool = mysql.createPool(dbConfig as PoolOptions);

export async function getConnection() {
  return pool.getConnection();
}

export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export { pool };
export default pool;
