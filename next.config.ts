import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
    LOGIN_USER: process.env.LOGIN_USER,
    LOGIN_PASSWORD: process.env.LOGIN_PASSWORD,
    SECRET_COOKIE_PASSWORD: process.env.SECRET_COOKIE_PASSWORD,
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    NOTION_TRANSACTIONS_DB: process.env.NOTION_TRANSACTIONS_DB,
    NOTION_INCOME_DB: process.env.NOTION_INCOME_DB,
    NOTION_TOTAL_SAVINGS_DB: process.env.NOTION_TOTAL_SAVINGS_DB,
    NOTION_ACCOUNTS_DB: process.env.NOTION_ACCOUNTS_DB,
    NOTION_DEBTS_DB: process.env.NOTION_DEBTS_DB,
    NOTION_BUDGET_DB: process.env.NOTION_BUDGET_DB,
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
    AIRTABLE_USERS_TABLE_ID: process.env.AIRTABLE_USERS_TABLE_ID,
  }
};

export default nextConfig;
