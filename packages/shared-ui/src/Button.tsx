import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const base: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  border: 'none',
  borderRadius: 6,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background 0.15s, opacity 0.15s',
  lineHeight: 1.4,
};

const variants: Record<string, React.CSSProperties> = {
  primary: { background: '#1d4ed8', color: '#fff' },
  secondary: { background: '#e5e7eb', color: '#374151' },
  danger: { background: '#ef4444', color: '#fff' },
  ghost: { background: 'transparent', color: '#1d4ed8' },
};

const sizes: Record<string, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: 12 },
  md: { padding: '8px 16px', fontSize: 14 },
  lg: { padding: '10px 20px', fontSize: 16 },
};

export function Button({ variant = 'primary', size = 'md', loading, children, disabled, style, ...rest }: ButtonProps) {
  return (
    <button
      style={{
        ...base,
        ...variants[variant],
        ...sizes[size],
        opacity: disabled || loading ? 0.5 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        ...style,
      }}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}
      {children}
    </button>
  );
}
