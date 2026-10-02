import type { ReactNode } from 'react';
import styles from './Notice.module.css';

interface NoticeProps {
  children: ReactNode;
  /** `alert` for problems the user must act on; `status` for passive updates. */
  role?: 'alert' | 'status';
  /** `stage` scales with the host stage; `page` uses page sizes. */
  size?: 'page' | 'stage';
  className?: string;
}

/** A highlighted message bar (warning tone), with room for action buttons. */
export function Notice({ children, role, size = 'page', className }: NoticeProps) {
  return (
    <div className={`${styles.notice} ${styles[size]} ${className ?? ''}`} role={role}>
      {children}
    </div>
  );
}
