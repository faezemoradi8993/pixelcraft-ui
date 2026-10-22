import type { ReactNode } from 'react';
import styles from './FeatureCard.module.css';

export type FeatureCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  icon?: ReactNode;
  theme?: 'violet' | 'mint' | 'peach';
  className?: string;
};

export function FeatureCard({ eyebrow, title, description, href, icon, theme = 'violet', className = '' }: FeatureCardProps) {
  return (
    <article className={`${styles.card} ${styles[theme]} ${className}`}>
      <div className={styles.top}>
        <span className={styles.icon} aria-hidden="true">{icon ?? '✦'}</span>
        <span className={styles.eyebrow}>{eyebrow}</span>
      </div>
      <div className={styles.body}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
      <a className={styles.link} href={href} aria-label={`Explore ${title}`}>
        Explore project <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}