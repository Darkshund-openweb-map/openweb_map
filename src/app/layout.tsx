import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WEB SCOPE | 오픈웹 생태계 지도',
  description: '오픈웹 플랫폼의 노출, 사건, 관계를 탐색하는 생태계 지도',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
