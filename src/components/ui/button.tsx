import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './button.module.css';

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
