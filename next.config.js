/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint配置，避免使用过时的选项
  eslint: {
    // 构建时忽略ESLint检查，使用单独的lint命令
    ignoreDuringBuilds: true,
  },
  // Server Actions现在默认可用，不再需要显式配置
  experimental: {
    // 移除冲突的配置
    // MUI组件由transpilePackages处理，不需要serverComponentsExternalPackages
  },
  
  // 图片优化配置
  images: {
    domains: ['assets.example.com', 'api.example.com'],
    // 启用现代图片格式
    formats: ['image/avif', 'image/webp'],
    // 图片尺寸优化
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24, // 24小时缓存
  },
  
  // 构建优化配置
  optimizeFonts: true,
  // 启用SWC最小化（比terser更快）
  swcMinify: true,
  
  // 输出文件命名和缓存策略
  generateBuildId: () => 'yyc3-table-converter-' + Date.now(),
  
  // 路径别名配置
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
      'react-native': 'react-native-web',
    };
    
    // 构建分析工具
    if (!dev && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: '../bundle-report.html',
          openAnalyzer: false,
        })
      );
    }
    
    // 优化大依赖包
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 10,
          minSize: 20000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module, chunks, cacheGroupKey) {
                if (!module.context) return 'npm.vendor';
                const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                const packageName = match ? match[1] : 'vendor';
                return `npm.${packageName.replace('@', '')}`;
              },
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // 静态资源缓存策略
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
      ],
    },
  ],
  
  // 项目特定配置
  env: {
    NEXT_PUBLIC_APP_NAME: 'YYC³ Easy Table Converter',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV || 'development',
  },
};

module.exports = nextConfig;