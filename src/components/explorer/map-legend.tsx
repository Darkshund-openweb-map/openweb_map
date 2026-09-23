import styles from '@/components/explorer/explorer.module.css';
import { type Category, type CategoryId, type DetailTab } from '@/lib/ecosystem-types';
import { useEcosystemData } from './ecosystem-data-context';

function HexSwatch({ color }: { color: string }) {
  return <span className={styles['legend-hex']} style={{ background: color }} />;
}

type Props = {
  category: Category | null;
  selected: boolean;
  tab: DetailTab;
  statistics: boolean;
  onSelectCategory: (id: CategoryId) => void;
};

export function MapLegend({ category, selected, tab, statistics, onSelectCategory }: Props) {
  const { categories } = useEcosystemData();
  const showRelationDetails = !statistics && (!selected || tab === 'connections');
  return (
    <aside className={styles['legend']}>
      <h2>범례</h2>
      <p className={styles['legend-subtitle']}>섬 색 = 영역 (유형)</p>
      <div className={styles['legend-list']}>
        {categories.map((item) => (
          <button
            key={item.id}
            className={category?.id === item.id ? styles['active'] : ''}
            onClick={() => onSelectCategory(item.id)}
          >
            <HexSwatch color={item.color} />
            {item.name}
          </button>
        ))}
      </div>
      <div className={styles['legend-section']}>
        <p>
          {statistics
            ? '연결선 · 실제 관계 데이터'
            : selected
              ? '연결선 · 신뢰도'
              : '선 스타일 = 신뢰도'}
        </p>
        <div>
          <i className={styles['line-solid']} />
          {statistics ? '직접 근거' : '높음'}
        </div>
        <div>
          <i className={styles['line-dashed']} />
          {statistics ? '복수 정황' : '중간'}
        </div>
        <div>
          <i className={styles['line-dotted']} />
          {statistics ? '참고 신호' : '낮음'}
        </div>
      </div>
      <div className={[styles['legend-section'], styles['legend-reading']].join(' ')}>
        <p>읽는 법</p>
        <span>섬 = 플랫폼 유형 · 영토 = 공개 플랫폼</span>
        <span>영토 배치는 유지 · 수치는 현재 DB 기준</span>
        <span>
          {statistics
            ? '샘플 관계는 제외하고 실제 등록된 관계만 집계'
            : '사건 선택 시 발생 위치와 연결 경로 표시'}
        </span>
      </div>
      {showRelationDetails && (
        <>
          <div className={[styles['legend-section'], styles['relation-legend']].join(' ')}>
            <p>관계선 = 검증된 관계 레코드</p>
            <div>
              <i className={styles['dot']} style={{ background: '#f26420' }} />
              재게시 <i className={styles['dot']} style={{ background: '#139e77' }} />
              미러링
            </div>
            <div>
              <i className={styles['dot']} style={{ background: '#176bfa' }} />
              직접 링크 <i className={styles['dot']} style={{ background: '#8053e9' }} />
              동일 파일
            </div>
            <div>
              <i className={styles['dot']} style={{ background: '#f1a512' }} />
              동일 콘텐츠
            </div>
          </div>
          <div className={styles['legend-footer']}>
            굵기 = 관계 레코드 수<br />
            화살표 = 먼저 관측된 쪽 → 나중
            <br />
            검증 완료만 표시 · 후보/제외는 숨김
            <br />
            같은 플랫폼 안의 재게시 선이 아니라 영토 사건
          </div>
        </>
      )}
    </aside>
  );
}
