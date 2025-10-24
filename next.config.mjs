/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Désactiver ESLint pendant le build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Suppression de l'option swcMinify qui cause un avertissement
  
  // Configuration SWC pour masquer les logs en production
  compiler: {
    // Supprime tous les console.log en production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;