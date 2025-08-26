// next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname), // permite import '@/...' apontando pra raiz
    };
    return config;
  },
};

module.exports = nextConfig;
