/**
 * @file NextAuth 认证配置
 * @description 配置 NextAuth.js 的认证提供者
 * @module lib/auth/auth
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from '../db/database';
import bcrypt from 'bcryptjs';

interface User {
  id: number;
  user_code: string;
  username: string;
  email?: string;
  real_name?: string;
  avatar?: string;
  role_id?: number;
  status: number;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('请输入用户名和密码');
        }

        const users = await query<User[]>(
          'SELECT * FROM sys_user WHERE username = ? AND status = 1',
          [credentials.username]
        );

        if (users.length === 0) {
          throw new Error('用户不存在');
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password || '');

        if (!isPasswordValid) {
          throw new Error('密码错误');
        }

        return {
          id: user.id.toString(),
          name: user.real_name || user.username,
          email: user.email || undefined,
          image: user.avatar || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
};
