/** @type {import('next').NextConfig} */
const nextConfig = {
  // 性能优化配置
  experimental: {
    // 启用服务器操作
    serverActions: true,
    // 启用并行路由
    parallelRoutes: true,
    // 启用服务端组件流式渲染
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // 生产优化
  productionBrowserSourceMaps: false,
  
  // 图片优化
  images: {
    domains: ['assets.example.com'],
    minimumCacheTTL: 60,
    formats: ['image/webp', 'image/avif'],
  },
  
  // 构建优化
  optimizeFonts: true,
  
  // 输出优化
  output: 'standalone',
  
  // SWC 配置
  swcMinify: true,
  
  // 路由优化
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  
  // 环境变量
  env: {
    APP_NAME: 'YYC³ Easy Table Converter',
    APP_VERSION: '1.0.0',
    NODE_ENV: process.env.NODE_ENV,
  },
  
  // 模块解析
  webpack: (config, { isServer, webpack }) => {
    // 自定义 webpack 配置
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NEXT_RUNTIME': JSON.stringify(process.env.NEXT_RUNTIME),
      })
    );
    
    // 优化导入
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, 'app/components'),
      '@/utils': path.resolve(__dirname, 'app/utils'),
      '@/types': path.resolve(__dirname, 'app/types'),
    };
    
    // 启用持久化缓存
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };
    
    return config;
  },
};

module.exports = nextConfig;