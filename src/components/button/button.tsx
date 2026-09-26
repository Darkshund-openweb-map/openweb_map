// 화면 전반에서 공통 스타일과 변형을 제공하는 버튼 컴포넌트
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from '@/styles/button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className}`.trim()}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
