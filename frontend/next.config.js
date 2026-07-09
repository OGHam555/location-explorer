// バックエンドの実アドレス。docker-compose内ではサービス名 "backend" がホスト名として
// 解決される。compose外（例:ローカルで frontend だけ `npm run dev` する場合）は
// BACKEND_INTERNAL_URL でホストを上書きできるようにする。
const BACKEND_ORIGIN = process.env.BACKEND_INTERNAL_URL ?? 'http://backend:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        // ブラウザは常に同一オリジンの /api/... を叩く。Next.jsサーバーが
        // サーバー間通信としてバックエンドへ中継するため、ブラウザ向けの
        // CORS設定やバックエンドURLの公開（NEXT_PUBLIC_...）が不要になる。
        source: '/api/:path*',
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
