import type { NextConfig } from "next";

const appBasePath = "/react-ssr-corp-srep-pop-map";

const nextConfig: NextConfig = {
  output: "standalone",
  distDir: "dist/react-ssr-corp-srep-pop-map",
  basePath: appBasePath,
  async redirects() {
    return [{
      source: "/",
      destination: appBasePath,
      permanent: false,
      basePath: false,
    }];
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
