/** @type {import('next').NextConfig} */
// @spec INFRA-CFG-001, INFRA-CFG-002
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
