import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @bazi/engine ships raw TypeScript (Node type-stripping); compile it for the browser.
  transpilePackages: ['@bazi/engine'],
};

export default nextConfig;
