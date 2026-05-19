import { useEffect, useRef, useState } from 'react';
import type { ConversationMessage } from '@znkfxt/contracts';
import type { ConversationState } from './hooks/useConversation';

interface ChatPanelProps {
  onClose: () => void;
  conversationState: ConversationState;
  messages: ConversationMessage[];
  sending: boolean;
  onSend: (content: string) => void;
  onLoadHistory?: () => void;
}

export function ChatPanel({ onClose, conversationState, messages = [], sending = false, onSend = () => {} }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isReady = conversationState.kind === 'ready';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const bubbleStyle = (senderType: string): React.CSSProperties => {
    if (senderType === 'visitor') {
      return {
        alignSelf: 'flex-end',
        background: '#1d4ed8',
        color: '#fff',
        borderRadius: '12px 12px 4px 12px',
        maxWidth: '80%',
        padding: '8px 12px',
        fontSize: 14,
        lineHeight: 1.4,
        wordBreak: 'break-word',
      };
    }
    if (senderType === 'bot') {
      return {
        alignSelf: 'flex-start',
        background: '#f3f4f6',
        color: '#1f2937',
        borderRadius: '12px 12px 12px 4px',
        maxWidth: '80%',
        padding: '8px 12px',
        fontSize: 14,
        lineHeight: 1.4,
        wordBreak: 'break-word',
      };
    }
    // system
    return {
      alignSelf: 'center',
      background: 'transparent',
      color: '#9ca3af',
      fontStyle: 'italic',
      fontSize: 12,
      padding: '4px 8px',
      textAlign: 'center',
    };
  };

  const showWelcome = (messages ?? []).length === 0 && isReady;

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

      {/* Messages area */}
      <div
        data-testid="chat-messages-area"
        style={{
          flex: 1,
          padding: 16,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {conversationState.kind === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>连接中，请稍候...</p>
          </div>
        )}
        {showWelcome && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>开始对话吧 👋</p>
          </div>
        )}
        {conversationState.kind === 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>
              {conversationState.message}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', ...bubbleStyle(msg.senderType) }}>
            {msg.content}
          </div>
        ))}
        {sending && (
          <div style={{ alignSelf: 'flex-start', color: '#9ca3af', fontSize: 12, padding: '4px 0' }}>
            发送中...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
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
          value={inputValue}
          disabled={!isReady}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: `1px solid ${isReady ? '#d1d5db' : '#e5e7eb'}`,
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
            background: isReady ? '#fff' : '#f9fafb',
            color: isReady ? '#1f2937' : '#9ca3af',
          }}
        />
        <button
          disabled={!isReady}
          onClick={handleSend}
          style={{
            padding: '8px 16px',
            background: isReady ? '#1d4ed8' : '#e5e7eb',
            color: isReady ? '#fff' : '#9ca3af',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: isReady ? 'pointer' : 'not-allowed',
          }}
        >
          发送
        </button>
      </div>
    </div>
  );
}
