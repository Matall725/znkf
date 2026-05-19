import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({ title, children, style, onClick }: CardProps) {
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', ...style }}>
      {title && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 15, color: '#1f2937' }}>
          {title}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
