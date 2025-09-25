/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are available by default in Next.js 14
  eslint: {
    // Disable ESLint during builds temporarily
    ignoreDuringBuilds: true
  }
}

module.exports = nextConfig