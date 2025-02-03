import type { NextConfig } from 'next';

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const nextConfig: NextConfig = {
  experimental: {
    //ppr: true,
    reactCompiler: true,
  },
  serverExternalPackages: ['@triton-one/yellowstone-grpc'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });
    return config;
  },
};

export default nextConfig;
