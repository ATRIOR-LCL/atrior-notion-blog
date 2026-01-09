/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许外部图片域名
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.notion.so',
      },
      {
        protocol: 'https',
        hostname: '*.notion.so',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.notionusercontent.com',
      },
    ],
  },
  // 实验性功能：增加服务器端获取超时时间
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // 日志配置，帮助调试
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
