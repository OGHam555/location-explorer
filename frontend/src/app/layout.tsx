import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Location Explorer',
  description: '地図上で周辺のスポットを検索・探索できるWebアプリケーション',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
