import styles from '@/styles/data-status.module.css';

const messages = {
  loading: { title: '지도를 불러오는 중이에요', description: '잠시만 기다려 주세요.' },
  empty: { title: '표시할 섬이 없습니다', description: '등록된 섬이 있는지 확인해 주세요.' },
  error: { title: '지도를 불러오지 못했어요', description: '잠시 후 다시 시도해 주세요.' },
};

export function DataStatus({ kind }: { kind: keyof typeof messages }) {
  const { title, description } = messages[kind];
  return (
    <main className={styles.page}>
      <div className={styles.brand}>WEB SCOPE</div>
      <div className={styles.content} role={kind === 'error' ? 'alert' : 'status'}>
        <h1>{title}</h1>
        <p>{description}</p>
        {kind !== 'loading' && (
          <form action="/" method="get">
            <button type="submit">다시 불러오기</button>
          </form>
        )}
      </div>
    </main>
  );
}
