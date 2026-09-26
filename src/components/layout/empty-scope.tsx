// 선택한 탐색 범위에 데이터가 없을 때 복귀 안내를 표시하는 컴포넌트
import styles from '@/styles/explorer.module.css';
import { Button } from '@/components/button/button';

export function EmptyScope({ onReturn }: { onReturn: () => void }) {
  return (
    <div className={styles['empty-scope']}>
      <h2>등록된 다크웹 플랫폼이 없습니다</h2>
      <p>현재 등록된 데이터가 없습니다.</p>
      <Button onClick={onReturn}>오픈웹으로 돌아가기</Button>
    </div>
  );
}
