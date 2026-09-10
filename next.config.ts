import type { NextConfig } from "next"

const imageProtocol = process.env.NEXT_IMAGE_PROTOCOL === "https" ? "https" : "http"

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: imageProtocol,
        hostname: process.env.NEXT_IMAGE_DOMAIN || "localhost",
      },
    ],
  },
}

export default nextConfig
