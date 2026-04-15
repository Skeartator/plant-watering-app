/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Empêche webpack de bundler node-sqlite3-wasm (requis pour charger le .wasm)
    serverComponentsExternalPackages: ['node-sqlite3-wasm'],
  },
}

module.exports = nextConfig
