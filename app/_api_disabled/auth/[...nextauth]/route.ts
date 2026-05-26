/**
 * @file NextAuth API 路由
 * @description NextAuth.js 的 API 端点
 * @module app/api/auth/[...nextauth]/route
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
