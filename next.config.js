/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['node-sqlite3-wasm'],
    outputFileTracingIncludes: {
      '/': ['./node_modules/node-sqlite3-wasm/dist/*.wasm'],
      '/api/plants': ['./node_modules/node-sqlite3-wasm/dist/*.wasm'],
      '/api/water/[id]': ['./node_modules/node-sqlite3-wasm/dist/*.wasm'],
      '/api/subscribe': ['./node_modules/node-sqlite3-wasm/dist/*.wasm'],
      '/api/cron/notify': ['./node_modules/node-sqlite3-wasm/dist/*.wasm'],
    },
  },
}

module.exports = nextConfig
