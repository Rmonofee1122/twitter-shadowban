/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番環境での最適化
  swcMinify: true,
  
  // 実験的機能
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@nextui-org/react', 'react-icons'],
  },
  
  // バンドル分析
  webpack: (config, { isServer, dev }) => {
    // 本番環境でのTree shaking改善
    if (!dev && !isServer) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }
    
    return config;
  },
  
  // 画像最適化
  images: {
    domains: ['pbs.twimg.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // 圧縮設定
  compress: true,
  
  // 静的ファイル最適化
  poweredByHeader: false,
  
  // ESLint設定
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;