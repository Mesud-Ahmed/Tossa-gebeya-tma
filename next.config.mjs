/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.pinggy-free.link",
    "*.run.pinggy-free.link"
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co"
      }
    ]
  }
};

export default nextConfig;
