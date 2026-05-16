import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.19.239.153", "localhost"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dssbr.com.br" },
      { protocol: "https", hostname: "englishtalktime.com.br" },
      { protocol: "https", hostname: "oworkshop.com.br" },
      { protocol: "https", hostname: "gubigdata.com.br" },
      { protocol: "https", hostname: "hadoop.com.br" },
    ],
  },
};

export default nextConfig;
