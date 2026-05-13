/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
}

module.exports = nextConfig

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
