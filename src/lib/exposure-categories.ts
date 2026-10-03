// incidents_data_types.category의 공통 입력 선택지. 기업·제품명은 name에 보존한다.
export const EXPOSURE_CATEGORIES: readonly string[] = [
  'API 키 노출',
  '토큰 노출',
  '클라우드 인증키 노출',
  'DB 접속 정보 노출',
  'DB 접근 권한 노출',
  '계정 정보 노출',
  '비밀번호 노출',
  '전화번호 노출',
  '이메일 노출',
  '개인정보 노출',
  '소스코드 노출',
  '파일·덤프 노출',
  '계정 판매',
  '계정 대여',
  '계정 인증',
  '미분류',
];

// 분류가 비어 있어도 기업명이 포함된 name으로 대체하거나 임의 추론하지 않는다.
export function exposureCategory(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '미분류';
}
