interface StatusBadgeProps {
  status: string;
  mapping?: Record<string, { label: string; color: string }>;
}

const defaultMapping: Record<string, { label: string; color: string }> = {
  enabled: { label: '已启用', color: '#059669' },
  disabled: { label: '已禁用', color: '#dc2626' },
  draft: { label: '草稿', color: '#d97706' },
  bot_serving: { label: '机器人服务', color: '#2563eb' },
  waiting_agent: { label: '等待人工', color: '#d97706' },
  agent_serving: { label: '人工服务', color: '#059669' },
  closed: { label: '已结束', color: '#6b7280' },
  handoff_pending_confirmation: { label: '待确认转接', color: '#d97706' },
};

export function StatusBadge({ status, mapping }: StatusBadgeProps) {
  const resolved = { ...defaultMapping, ...mapping };
  const cfg = resolved[status] ?? { label: status, color: '#6b7280' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 500,
        background: `${cfg.color}18`,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}
