import { useEffect, useState } from 'react';
import { adminApi } from '../api-client';
import { Card, Loading } from '@znkfxt/shared-ui';
import type { MetricsOverview } from '@znkfxt/contracts';

export function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    adminApi.getMetrics()
      .then(setMetrics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="加载数据..." />;
  if (error) return <div style={{ color: '#ef4444' }}>{error}</div>;
  if (!metrics) return null;

  const items = [
    { label: '咨询总数', value: metrics.consultationCount },
    { label: '转接人工数', value: metrics.handoffConversationCount },
    { label: '转接率', value: `${(metrics.handoffRate * 100).toFixed(1)}%` },
    { label: '自动解决数', value: metrics.autoResolvedConversationCount },
    { label: '自动解决率', value: `${(metrics.autoResolutionRate * 100).toFixed(1)}%` },
    { label: '评价数', value: metrics.ratingCount },
    { label: '平均评分', value: metrics.averageSatisfactionScore != null ? metrics.averageSatisfactionScore.toFixed(1) : '-' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>仪表盘</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {items.map((item) => (
          <Card key={item.label}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1d4ed8' }}>{item.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{item.label}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
