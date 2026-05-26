/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.devServer = {
        ...config.devServer,
        port: 3737,
      };
    }
    return config;
  },
};

export default nextConfig;
