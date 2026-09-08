const imageProtocol = process.env.NEXT_IMAGE_PROTOCOL === "https" ? "https" : "http"

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: imageProtocol,
        hostname: process.env.NEXT_IMAGE_DOMAIN || "localhost",
      },
    ],
  },
}

module.exports = nextConfig
