import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ]
  },
  env: {
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    NOTION_AUTH_DB: process.env.NOTION_AUTH_DB,
    NOTION_TRANSACTIONS_DB: process.env.NOTION_TRANSACTIONS_DB,
    NOTION_INCOME_DB: process.env.NOTION_INCOME_DB,
    NOTION_TOTAL_SAVINGS_DB: process.env.NOTION_TOTAL_SAVINGS_DB,
    NOTION_ACCOUNTS_DB: process.env.NOTION_ACCOUNTS_DB,
    NOTION_DEBTS_DB: process.env.NOTION_DEBTS_DB,
    NOTION_BUDGET_DB: process.env.NOTION_BUDGET_DB,
  }
};

export default nextConfig;
