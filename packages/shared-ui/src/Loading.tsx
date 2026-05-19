interface LoadingProps {
  text?: string;
  fullPage?: boolean;
}

export function Loading({ text = '加载中...', fullPage }: LoadingProps) {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: '#6b7280', fontSize: 14 }}>{text}</span>
    </div>
  );

  if (fullPage) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>{content}</div>;
  }

  return content;
}
