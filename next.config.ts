import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
  },
  async redirects() {
    return [{ source: "/contacts", destination: "/requisites", permanent: true }];
  },
};

export default nextConfig;
