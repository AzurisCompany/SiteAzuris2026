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
  async redirects() {
    return [
      // A "adesão" virou "ativação acompanhada" em 09/11/2026; links antigos (site do
      // ETT, WhatsApp) continuam funcionando. Query string (utm, ?c=) vai junto.
      { source: "/ett/adesao", destination: "/ett/ativacao", permanent: false },
      { source: "/ett/dedicacao", destination: "/ett/assinatura", permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/lakehouse-comunidade",
        destination: "/lakehouse-comunidade/index.html",
      },
      {
        source: "/lakehouse-comunidade/",
        destination: "/lakehouse-comunidade/index.html",
      },
    ];
  },
};

export default nextConfig;
