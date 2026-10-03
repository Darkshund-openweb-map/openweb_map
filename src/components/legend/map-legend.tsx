// 플랫폼 유형 탐색과 지도·통계 해석에 필요한 범례를 제공하는 사이드바
import styles from '@/styles/map-legend.module.css';
import { type Category, type CategoryId } from '@/lib/ecosystem-types';
import { useEcosystemData } from '@/hooks/use-ecosystem-data';
import { HexSwatch } from './hex-swatch';

type Props = {
  category: Category | null;
  statistics: boolean;
  onSelectCategory: (id: CategoryId) => void;
};

export function MapLegend({ category, statistics, onSelectCategory }: Props) {
  const { categories } = useEcosystemData();
  return (
    <aside className={styles.sidebar} aria-label="플랫폼 탐색">
      <h2 className={styles.heading}>지도 안내</h2>
      <p className={styles.subtitle}>플랫폼 유형</p>
      <nav className={styles.list} aria-label="플랫폼 유형">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className={category?.id === item.id ? styles.active : ''}
            aria-pressed={category?.id === item.id}
            onClick={() => onSelectCategory(item.id)}
          >
            <HexSwatch color={item.color} />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      <section className={styles.section} aria-label="연결 상태">
        <h3>연결 상태</h3>
        <div className={styles.connectionRow}>
          <i aria-hidden="true" />
          <span>검증 완료</span>
        </div>
        <div className={styles.connectionRow}>
          <i className={styles.dashed} aria-hidden="true" />
          <span>검증 전</span>
        </div>
      </section>
      <section className={styles.section} aria-label="지도 구성">
        <h3>지도 구성</h3>
        <dl className={styles.definitions}>
          <div>
            <dt>섬</dt>
            <dd>플랫폼 유형</dd>
          </div>
          <div>
            <dt>영토</dt>
            <dd>개별 플랫폼</dd>
          </div>
          <div>
            <dt>기준일</dt>
            <dd>사건 집계 시점</dd>
          </div>
        </dl>
        <p className={styles.note}>
          {statistics
            ? '선택한 날짜까지 집계하며, 실제 연결은 검증 완료 관계만 포함합니다.'
            : '플랫폼을 누르면 관련 사건과 연결 관계를 볼 수 있습니다.'}
        </p>
      </section>
      <section className={styles.section} aria-label="관계 유형">
        <h3>관계 유형</h3>
        <ul className={styles.relationTypes}>
          <li>재게시</li>
          <li>미러링</li>
          <li>직접 링크</li>
          <li>동일 파일</li>
          <li>동일 콘텐츠</li>
        </ul>
      </section>
    </aside>
  );
}
