import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
  },
  async redirects() {
    return [{ source: "/contacts", destination: "/requisites", permanent: true }];
  },
};

export default nextConfig;
