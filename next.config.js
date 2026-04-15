/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Empêche webpack de bundler node-sqlite3-wasm (requis pour charger le .wasm)
    serverComponentsExternalPackages: ['node-sqlite3-wasm'],
  },
  // Inclut explicitement le fichier .wasm dans le bundle Vercel pour toutes les routes
  outputFileTracingIncludes: {
    '/': ['./node_modules/node-sqlite3-wasm/dist/*.wasm'],
    '/api/plants': ['./node_modules/node-sqlite3-wasm/dist/*.wasm'],
    '/api/water/[id]': ['./node_modules/node-sqlite3-wasm/dist/*.wasm'],
    '/api/subscribe': ['./node_modules/node-sqlite3-wasm/dist/*.wasm'],
    '/api/cron/notify': ['./node_modules/node-sqlite3-wasm/dist/*.wasm'],
  },
}

module.exports = nextConfig
