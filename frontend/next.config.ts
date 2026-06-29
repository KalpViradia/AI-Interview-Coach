import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rewrites removed to avoid Turbopack ECONNREFUSED issues on Windows.
  // The frontend will connect directly to the backend via CORS.
};

export default nextConfig;
