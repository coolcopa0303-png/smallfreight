import type { NextConfig } from "next";

// `live` mode proxies /api/* to the existing SMALL FREIGHT backend so the session cookie stays same-origin.
// `mock` mode (default) serves anonymized fixtures from src/mocks — no backend or login needed.
const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE ?? "mock";
const UPSTREAM = process.env.SMALL_FREIGHT_API_ORIGIN ?? "https://smallfreight.senmartintl.com";
// STATIC_EXPORT=1 builds a plain static site (sample data only) for demo hosting — see README.
const STATIC_EXPORT = process.env.STATIC_EXPORT === "1";

const staticConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  env: { STATIC_EXPORT: "1" },
};

const nextConfig: NextConfig = STATIC_EXPORT ? staticConfig : {
  // Keep the dev badge off the sidebar tagline.
  devIndicators: { position: "bottom-right" },
  async rewrites() {
    if (DATA_MODE !== "live") return [];
    return [{ source: "/api/:path*", destination: `${UPSTREAM}/api/:path*` }];
  },
  async redirects() {
    return [
      { source: "/", destination: "/dashboard", permanent: false },
      // Old portal URLs keep working.
      { source: "/booking", destination: "/shipments", permanent: false },
      // "My Shipments" was merged into Shipment Tracking's table view.
      { source: "/my-shipments", destination: "/shipments?view=table", permanent: false },
      { source: "/new-quote", destination: "/quotes/ltl", permanent: false },
      { source: "/new-fcl-quote", destination: "/quotes/drayage", permanent: false },
      { source: "/quotes", destination: "/my-inquiries?tab=ltl", permanent: false },
      { source: "/fcl-quotes", destination: "/my-inquiries?tab=drayage", permanent: false },
      { source: "/addresses", destination: "/address-book", permanent: false },
      { source: "/hts-inquiries", destination: "/hts", permanent: false },
    ];
  },
};

export default nextConfig;
