/**
 * @file 根布局组件
 * @description Next.js 应用的根布局组件，集成AI浮窗系统和主题管理
 * @module app/layout
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2026-02-22
 */

import { Inter } from 'next/font/google';
import { ClientLayout } from './ClientLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL('https://yyc3.com'),
  title: {
    default: 'YYC³ Easy Table Converter - 企业级表格转换工具',
    template: '%s | YYC³ 表格转换',
  },
  description: '高效的企业级表格转换工具，支持Excel、CSV、JSON、XML、Markdown等多种格式互转。提供批量转换、SQL生成、图片处理等实用功能。',
  keywords: ['表格转换', 'Excel转换', 'CSV转换', 'JSON转换', '数据转换', '在线工具'],
  authors: [{ name: 'YYC³ Team', url: 'https://yyc3.com' }],
  creator: 'YYC³',
  publisher: 'YYC³',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/yyc3-icons/favicon/favicon.ico' },
      { url: '/yyc3-icons/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/yyc3-icons/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/yyc3-icons/ios/icon-60@3x.png', sizes: '180x180', type: 'image/png' },
      { url: '/yyc3-icons/ios/icon-76.png', sizes: '76x76', type: 'image/png' },
      { url: '/yyc3-icons/ios/icon-152.png', sizes: '152x152', type: 'image/png' },
    ],
    other: [
      { url: '/yyc3-icons/pwa/icon-192x192.png', sizes: '192x192', type: 'image/png', rel: 'apple-touch-icon' },
      { url: '/yyc3-icons/pwa/icon-512x512.png', sizes: '512x512', type: 'image/png', rel: 'apple-touch-icon' },
    ],
  },
  manifest: '/yyc3-icons/pwa/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'YYC³ 表格转换',
    startupImage: [
      '/yyc3-icons/ios/icon-1024.png',
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://yyc3.com',
    siteName: 'YYC³ Easy Table Converter',
    title: 'YYC³ Easy Table Converter - 企业级表格转换工具',
    description: '高效的企业级表格转换工具，支持多种格式互转',
    images: [
      {
        url: '/yyc3-icons/pwa/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'YYC³ 表格转换',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YYC³ Easy Table Converter',
    description: '企业级表格转换工具',
    images: ['/yyc3-icons/pwa/icon-512x512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="apple-touch-icon" href="/yyc3-icons/pwa/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="YYC³ 表格转换" />
        <meta name="application-name" content="YYC³ 表格转换" />
        <meta name="msapplication-TileColor" content="#0C70F2" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#0C70F2" />
      </head>
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
