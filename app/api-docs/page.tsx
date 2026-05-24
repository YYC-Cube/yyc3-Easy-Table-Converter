/**
 * @file API 文档页面
 * @description Swagger UI API 文档展示页面
 * @module app/api-docs/page
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API 文档 | YYC³ 表格转换',
  description: 'YYC³ Easy Table Converter API 文档',
};

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            YYC³ Easy Table Converter API
          </h1>
          <p className="text-lg text-slate-600">
            企业级表格转换工具 API 文档
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">快速开始</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-xl p-6">
              <h3 className="text-white font-medium mb-3">基础 URL</h3>
              <code className="text-green-400 text-sm">https://yyc3.com/api</code>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-3">认证方式</h3>
              <p className="text-slate-600 mb-3">
                除公开接口外，所有 API 需要通过 JWT Token 进行认证。
              </p>
              <div className="bg-slate-900 rounded-xl p-4">
                <code className="text-green-400 text-sm">
                  Authorization: Bearer {'{token}'}
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-3">请求格式</h3>
              <div className="bg-slate-900 rounded-xl p-4">
                <code className="text-blue-400 text-sm">
                  Content-Type: application/json
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-3">响应格式</h3>
              <pre className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                <code className="text-green-400 text-sm">{`{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}`}</code>
              </pre>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mb-6 mt-12">API 端点</h2>
          
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">POST</span>
                <code className="text-slate-800 font-medium">/api/auth/register</code>
              </div>
              <p className="text-slate-600">用户注册</p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">POST</span>
                <code className="text-slate-800 font-medium">/api/auth/[...nextauth]</code>
              </div>
              <p className="text-slate-600">用户登录/登出</p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">GET</span>
                <code className="text-slate-800 font-medium">/api/convert/formats</code>
              </div>
              <p className="text-slate-600">获取支持的转换格式列表</p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">POST</span>
                <code className="text-slate-800 font-medium">/api/convert/execute</code>
              </div>
              <p className="text-slate-600">执行文件格式转换</p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">POST</span>
                <code className="text-slate-800 font-medium">/api/convert/batch</code>
              </div>
              <p className="text-slate-600">批量转换多个文件</p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">GET</span>
                <code className="text-slate-800 font-medium">/api/user/profile</code>
              </div>
              <p className="text-slate-600">获取当前用户信息</p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">GET</span>
                <code className="text-slate-800 font-medium">/api/tasks/history</code>
              </div>
              <p className="text-slate-600">获取用户任务历史</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl">
            <p className="text-blue-800">
              <strong>注意：</strong> 当前文档为简化版本。完整 OpenAPI 规范可通过安装 swagger-ui-express 并访问 /api-docs/full 获取。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
