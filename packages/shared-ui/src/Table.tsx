import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  style?: React.CSSProperties;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyText?: string;
}

export function Table<T>({ columns, data, keyExtractor, loading, emptyText = '暂无数据' }: TableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            {columns.map((col) => (
              <th key={col.key} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 13, ...col.style }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>加载中...</td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>{emptyText}</td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)} style={{ borderBottom: '1px solid #f3f4f6' }}>
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: '10px 12px', ...col.style }}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
