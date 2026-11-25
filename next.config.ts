import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@imgly/background-removal', 'onnxruntime-web'],
};

export default nextConfig;
