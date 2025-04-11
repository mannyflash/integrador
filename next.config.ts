/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // No necesitas la opción distDir si usas la configuración predeterminada
});