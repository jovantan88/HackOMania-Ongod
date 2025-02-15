/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    assetPrefix: process.env.NODE_ENV === 'production' ? '/.' : '',
    output: 'export',
    trailingSlash: true,
};

export default nextConfig;