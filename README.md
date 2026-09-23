# WEB SCOPE — 오픈웹 플로우 V4

오픈웹 플랫폼과 사건, 플랫폼 간 연결 관계를 탐색하는 생태계 지도입니다.

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

- `src/components/explorer/`: 헤더, 레이아웃, 검색·화면 상태 훅
- `src/components/map/`: 육각형 좌표·면 렌더링, 섬, 관계선, 지도 제어, 확대·축소 훅
- `src/components/detail-panel/`: 상세 패널, 개요·연결·사건 탭, 날짜 필터 훅
- `src/components/statistics/`: 통계 화면과 필터 훅
- `src/components/ui/`: 공통 UI 요소
- `src/lib/ecosystem-types.ts`: 화면에서 사용하는 공통 데이터 타입
- `src/lib/fixture.ts`: 로컬 테스트 fixture
- `src/lib/fixture-source.ts`: 서버에서 fixture를 읽는 데이터 소스
- `src/lib/ecosystem-source.ts`: 화면과 데이터 소스를 분리하는 인터페이스
- `src/app/globals.css`: Tailwind CSS, 디자인 토큰, 전역 기본값
- `tests/ecosystem.spec.ts`: 지도·검색·사건 필터·관계 상태·모바일 회귀 테스트

각 기능 폴더의 `.tsx`는 화면 표시, `use-*.ts`는 상태와 파생 데이터, `.module.css`는 해당 기능의 스타일을 담당합니다. 육각형 좌표 계산은 `map/geometry.ts`, SVG 면 렌더링은 `map/hex-tile.tsx`에 있습니다. 전역 CSS에는 개별 화면의 디자인을 넣지 않습니다.

## 기술 구성

- Next.js App Router · TypeScript · Tailwind CSS · D3.js · SVG
- 디자인 토큰: `src/app/globals.css`의 `@theme`
- 화면 상태: `Explorer`, 지도·상세 패널·통계 컴포넌트 분리
- 네이밍: 컴포넌트·타입 `PascalCase`, 함수·변수 `camelCase`, 파일 `kebab-case`
- Prettier: 작은따옴표, 세미콜론, 100자 폭
- ESLint: Next.js Core Web Vitals, TypeScript

현재 데이터 소스는 로컬 fixture이며, 실제 Supabase에는 연결되지 않았습니다. 서버 페이지가 `EcosystemSource.load()`로 읽은 데이터를 화면에 전달합니다. 백엔드 연동 시 Supabase 응답을 `EcosystemSnapshot`으로 변환하는 데이터 소스를 구현하고 서버 페이지의 소스를 교체합니다. 테이블 구조와 인증 방식은 백엔드와 협의 후 확정합니다.

fixture의 섬·노출 집계는 화면 검토용 예시이며 사건 목록은 일부 예시 레코드만 포함합니다. 조사 플랫폼 재구성과 미조사 섬 제거는 DB 연결 후 실제 목록을 기준으로 진행합니다. 지도 입체감은 SVG 상단면·측면·그림자로 표현하며, 별도 WebGL 3D 엔진을 사용하지 않습니다.

## 배포 계획

GitHub 저장소를 Vercel에 연결해 배포할 예정입니다. 배포 주소가 생성되면 이 문서에 추가하겠습니다!!!!
.

## 검증

검증 명령: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`.

브라우저 회귀 테스트는 `npx playwright install chromium`으로 브라우저를 설치하고, `npm run build` 후 `npm run test:e2e`로 실행합니다. 테스트 서버는 로컬 3100 포트를 사용합니다.
