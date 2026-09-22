# WEB SCOPE — 오픈웹 플로우 V4

오픈웹 플랫폼과 사건, 플랫폼 간 연결 관계를 탐색하는 생태계 지도.

## 실행

Node.js 24 · npm 10.8.2

```bash
npm install
npm run dev
```

개발 서버 주소는 실행 시 터미널에 표시됩니다.

## 화면 구성

지도 기본 화면, 섬/영토의 개요·사건·연결 탭, 후보 관계와 검증 관계의 표시, 관계선 근거 카드, 통계 화면을 한 페이지에서 탐색할 수 있습니다. 섬 또는 영토를 누르면 해당 상세 패널이 열립니다. 지도에서 휠/트랙패드로 확대·축소하고 드래그로 이동할 수 있습니다. 검색은 `Ctrl+K` 또는 `⌘K`로 엽니다.

## 코드 위치

- `src/components/explorer.tsx`: 전체 화면과 탐색 상태
- `src/components/map.tsx`: SVG 육각형 지도와 D3 확대·축소·이동
- `src/components/detail-panel.tsx`: 개요·사건·연결 상세 패널
- `src/components/statistics.tsx`: 통계 화면
- `src/lib/fixture.ts`: 데이터 타입과 테스트 fixture
- `src/app/globals.css`: Tailwind CSS와 공통 디자인 규칙

## 기술 구성

- Next.js App Router · TypeScript · Tailwind CSS · D3.js · SVG
- 디자인 토큰: `src/app/globals.css`의 `@theme`
- 화면 상태: `Explorer`, 지도·상세 패널·통계 컴포넌트 분리
- 네이밍: 컴포넌트·타입 `PascalCase`, 함수·변수 `camelCase`, 파일 `kebab-case`
- Prettier: 작은따옴표, 세미콜론, 100자 폭
- ESLint: Next.js Core Web Vitals, TypeScript

데이터 소스: 로컬 fixture. API·Supabase 미연동.

## 배포 계획

GitHub 저장소를 Vercel에 연결해 배포할 예정입니다. 배포 주소가 생성되면 이 문서에 추가하겠습니다!!!!
.

## 검증

검증 명령: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`.
