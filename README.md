# WEB SCOPE — 오픈웹 플로우 V4

오픈웹 플랫폼과 사건, 플랫폼 간 연결 관계를 탐색하는 생태계 지도입니다.

## 실행

Node.js 24 · npm 10.8.2

```bash
npm install
npm run dev
```

개발 서버 주소는 실행 시 터미널에 표시됩니다.

실행 환경에는 `.env.example`의 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`가 필요합니다. 실제 키를 담은 `.env`는 Git 추적 대상에서 제외합니다.

## 화면 구성

지도 기본 화면, 섬/영토의 개요·사건·연결 탭, 후보 관계와 검증 관계의 표시, 관계선 근거 카드, 통계 화면을 한 페이지에서 탐색할 수 있습니다. 섬 또는 영토를 누르면 해당 상세 패널이 열립니다. 지도에서 휠/트랙패드로 확대·축소하고 드래그로 이동할 수 있습니다. 검색은 `Ctrl+K` 또는 `⌘K`로 엽니다.

## 코드 위치

- `src/components/button/`: 공통 버튼과 상세 패널 토글
- `src/components/chart/`: 지표, 비율 막대와 미니 차트
- `src/components/detail/`: 상세 패널, 개요·연결·사건 탭
- `src/components/header/`: 앱 헤더, 콘텐츠 헤더와 브랜드 마크
- `src/components/layout/`: 탐색 화면, 셸과 빈 상태 레이아웃
- `src/components/legend/`: 지도 범례와 색상 스와치
- `src/components/map/`: 육각형 좌표·면 렌더링, 섬, 관계선과 지도 제어
- `src/components/platform/`: 플랫폼 추가·수정·삭제 화면
- `src/components/provider/`: 생태계 데이터 공급자
- `src/components/statistics/`: 통계 화면
- `src/hooks/`: 검색, 화면 상태, 지도, 상세 패널, 편집기와 통계 커스텀 훅
- `src/contexts/`: 생태계 데이터 컨텍스트 계약
- `src/styles/`: 컴포넌트에서 공유하는 CSS 모듈
- `src/types/`: 화면 영역에서 공유하는 타입
- `src/lib/ecosystem-types.ts`: 화면에서 사용하는 공통 데이터 타입
- `src/lib/fixture.ts`: 로컬 테스트 fixture
- `src/lib/fixture-source.ts`: 서버에서 fixture를 읽는 데이터 소스
- `src/lib/ecosystem-source.ts`: 화면과 데이터 소스를 분리하는 인터페이스
- `src/lib/supabase-ecosystem-source.ts`: 실제 Supabase 테이블 조회와 데이터 소스 구성
- `src/lib/supabase/`: 환경 설정 검증, 페이지 단위 REST 조회, DB 응답 변환
- `src/lib/island-categories.ts`: DB 섬 이름의 한국어 표시와 Other 제외
- `src/lib/island-layouts.ts`, `src/lib/platform-layout.ts`: 데이터와 분리된 지도 배치 설정
- `src/app/globals.css`: Tailwind CSS, 디자인 토큰, 전역 기본값
- `tests/ecosystem.spec.ts`: 지도·검색·사건 필터·관계 상태·모바일 회귀 테스트

`src/components`는 버튼·헤더·레이아웃·지도처럼 UI 요소 종류별로 구분하며 `.tsx` 한 파일당 하나의 화면 컴포넌트를 둡니다. `src/hooks/use-*.ts`는 상태와 파생 데이터, `src/styles/*.module.css`는 기존 컴포넌트 스타일을 담당합니다. 육각형 좌표 계산은 `map/geometry.ts`, SVG 면 렌더링은 `map/hex-tile-top.tsx`와 `map/hex-tile-sides.tsx`에 있습니다. 전역 CSS에는 개별 화면의 디자인을 넣지 않습니다.

## 기술 구성

- Next.js App Router · TypeScript · Tailwind CSS · D3.js · SVG
- 디자인 토큰: `src/app/globals.css`의 `@theme`
- 화면 상태: `Explorer`, 지도·상세 패널·통계 컴포넌트 분리
- 네이밍: 컴포넌트·타입 `PascalCase`, 함수·변수 `camelCase`, 파일 `kebab-case`
- Prettier: 작은따옴표, 세미콜론, 100자 폭
- ESLint: Next.js Core Web Vitals, TypeScript

기본 데이터 소스는 실제 Supabase입니다. 서버 페이지가 `EcosystemSource.load()`로 `island`, `platforms`, `incidents`, `incidents_data_types`, `platform_connections`를 조회하고, `EcosystemSnapshot`으로 변환해 지도·상세 패널·통계에 전달합니다. 페이지를 새로 불러올 때 DB를 조회하며, 실시간 구독 방식은 아닙니다. 조회 실패 시 오류 화면을 표시하고 fixture로 대체하지 않습니다.

섬 이름은 한국어로 표시하고 `Other`는 제외합니다. 플랫폼 이름과 섬 소속은 DB의 `name`, `island_id`를 사용합니다. 사건 수는 `incidents` 레코드로 집계하고 노출 유형은 `incidents_data_types.incident_id`로 연결합니다. 같은 사건에 중복 등록된 동일 노출 유형은 한 번만 집계합니다. 관계가 없으면 관계선을 만들지 않으며, 검증 정보가 없는 관계를 검증 완료로 처리하지 않습니다.

현재 실제 DB 화면은 조회 전용이며 데이터 추가·수정·삭제 버튼은 비활성화되어 있습니다. 영구 저장에는 관리자 인증 및 쓰기 권한 연동이 필요합니다. 서비스 역할 키를 프론트엔드에 사용하지 않습니다.

fixture는 `ECOSYSTEM_DATA_SOURCE=fixture`를 명시한 테스트 환경에서만 사용합니다. 이 모드의 플랫폼 편집은 메모리에만 반영되고 새로고침하면 초기화됩니다. 지도 입체감은 SVG 상단면·측면·그림자로 표현하며, 별도 WebGL 3D 엔진을 사용하지 않습니다.

## 배포 계획

GitHub 저장소를 Vercel에 연결해 배포할 예정입니다. 배포 주소가 생성되면 이 문서에 추가합니다.

Vercel에도 동일한 Supabase 환경 변수를 설정하며, 배포 환경에는 테스트용 `ECOSYSTEM_DATA_SOURCE=fixture`를 설정하지 않습니다.

## 검증

검증 명령: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`.

브라우저 회귀 테스트는 `npx playwright install chromium`으로 브라우저를 설치하고, `npm run build` 후 `npm run test:e2e`로 실행합니다. 테스트 서버는 로컬 3100 포트를 사용합니다.

회귀 테스트는 고정 fixture를 사용하며 실제 DB를 변경하지 않습니다. 별도로 DB 응답 매핑, 중복 노출 유형 집계, 빈 데이터, 조회 오류 및 페이지 단위 조회를 검증합니다.
