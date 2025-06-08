/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We're using our own API route for proxying requests
  eslint: {
    // Temporarily disable ESLint during builds for deployment
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 