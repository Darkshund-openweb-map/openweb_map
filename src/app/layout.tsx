// 모든 페이지에 전역 스타일과 문서 메타데이터를 적용하는 루트 레이아웃 컴포넌트
import type { Metadata } from 'next';
import './globals.css';

const initialThemeScript = `(function() {
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="color-scheme"]').setAttribute('content', theme === 'light' ? 'only light' : 'dark');
  }
  try {
    var mobile = matchMedia('(max-width: 750px)').matches;
    var saved = mobile ? null : localStorage.getItem('openweb-map-theme-v2');
    applyTheme(saved === 'light' || saved === 'dark'
      ? saved
      : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (error) {
    applyTheme(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
})();`;

export const metadata: Metadata = {
  title: 'WEB SCOPE | 오픈웹 생태계 지도',
  description: '오픈웹 플랫폼의 노출, 사건, 관계를 탐색하는 생태계 지도',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
