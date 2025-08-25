/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: { rules: {} }, // ok deixar vazio
  },
};

module.exports = nextConfig;