/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
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
