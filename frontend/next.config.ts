import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  // Proxy /api/v1/* to the backend in development
  // This avoids CORS issues when calling the backend from the browser
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/v1/:path*`,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
