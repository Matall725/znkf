interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  return (
    <div
      data-testid="chat-panel"
      style={{
        position: 'absolute',
        bottom: 68,
        right: 0,
        width: 360,
        maxWidth: 'calc(100vw - 40px)',
        height: 520,
        maxHeight: 'calc(100vh - 120px)',
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontSize: 14,
        color: '#1f2937',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#1d4ed8',
          color: '#fff',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 16 }}>智能客服</span>
        <button
          data-testid="chat-close-btn"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 18,
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 4,
          }}
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      {/* Welcome message */}
      <div
        style={{
          padding: '20px 16px 12px',
          textAlign: 'center',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <p style={{ margin: 0, fontWeight: 500, fontSize: 15 }}>您好，欢迎来到智能客服！</p>
        <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>
          请描述您的问题，我将为您解答。
        </p>
      </div>

      {/* Messages area (placeholder) */}
      <div
        data-testid="chat-messages-area"
        style={{
          flex: 1,
          padding: 16,
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>开始对话吧 👋</p>
      </div>

      {/* Input area (placeholder) */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          data-testid="chat-input"
          type="text"
          placeholder="输入您的问题..."
          disabled
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
            background: '#f9fafb',
            color: '#9ca3af',
          }}
        />
        <button
          disabled
          style={{
            padding: '8px 16px',
            background: '#e5e7eb',
            color: '#9ca3af',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'not-allowed',
          }}
        >
          发送
        </button>
      </div>
    </div>
  );
}
