import styles from '@/styles/data-access-request.module.css';

export function DataAccessRequestCard({ onOpen }: { onOpen: () => void }) {
  return (
    <section className={styles.card} aria-labelledby="data-access-card-title">
      <span className={styles.eyebrow}>DATA ACCESS</span>
      <h3 id="data-access-card-title">DB 열람 요청</h3>
      <p>필요한 자료와 이용 목적을 알려주세요.</p>
      <button type="button" onClick={onOpen}>
        요청서 작성 <span aria-hidden="true">↗</span>
      </button>
    </section>
  );
}
