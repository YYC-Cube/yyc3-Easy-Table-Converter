/**
 * @file 功能开发中占位页面组件
 * @description 统一的占位页面组件，用于展示"功能正在开发中"的状态
 * @module components/ComingSoon
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

'use client';

import React from 'react';
import Link from 'next/link';

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: string;
  estimatedTime?: string;
  features?: string[];
  contactEmail?: string;
  className?: string;
}

const defaultFeatures = [
  '智能数据处理引擎',
  '多格式转换支持',
  'AI 辅助分析',
  '实时协作功能'
];

export const ComingSoon: React.FC<ComingSoonProps> = ({
  title = '功能开发中',
  description = '该功能正在紧张开发中，敬请期待！我们正在努力为您打造更好的体验。',
  icon = '🚧',
  estimatedTime,
  features = defaultFeatures,
  contactEmail = 'support@yyc3.com',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] p-8 ${className}`}>
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">{icon}</div>
          <h1 className="text-3xl font-bold text-foreground mb-3">{title}</h1>
          <p className="text-muted-foreground text-lg">{description}</p>
          {estimatedTime && (
            <p className="mt-3 text-sm text-primary font-medium">
              ⏱️ 预计上线时间：{estimatedTime}
            </p>
          )}
        </div>

        <div className="bg-card rounded-lg border p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>✨</span> 即将推出的功能
          </h3>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            了解更多功能更新
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/industries"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <span className="mr-2">🏠</span>
              返回行业中心
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
            >
              <span className="mr-2">🏠</span>
              返回首页
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            有建议或需求？联系我们：{contactEmail}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
