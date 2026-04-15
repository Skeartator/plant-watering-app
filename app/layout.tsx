import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arrosage des Plantes 🌿',
  description: 'Suivi d\'arrosage de plantes avec météo en temps réel à La Ciotat',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
