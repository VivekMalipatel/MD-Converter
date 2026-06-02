/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['markitdown-ts', 'pdf-parse', 'mammoth', 'xlsx'],
};

export default nextConfig;
