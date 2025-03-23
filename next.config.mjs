/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'firebasestorage.googleapis.com',  // Autoriser les images depuis Firebase Storage
      'lh3.googleusercontent.com'        // Pour les avatars Google (si vous utilisez l'authentification Google)
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
    ],
  }
};

export default nextConfig; 