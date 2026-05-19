import { useEffect, useState, useCallback, useRef } from 'react';
import { agentApi } from '../api-client';
import { Button, Card, Loading, StatusBadge } from '@znkfxt/shared-ui';
import type { ConversationListItem, ConversationMessage } from '@znkfxt/contracts';

interface ConversationsPageProps {
  activeConvId: string | null;
  onSelectConversation: (convId: string) => void;
  onBack: () => void;
}

export function ConversationsPage({ activeConvId, onSelectConversation, onBack }: ConversationsPageProps) {
  const [tab, setTab] = useState<'waiting' | 'active'>('waiting');
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    const fetcher = tab === 'waiting'
      ? agentApi.listWaitingConversations()
      : agentApi.listActiveConversations();
    fetcher
      .then((res) => setConversations(res.conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (activeConvId) {
    return <ChatView conversationId={activeConvId} onBack={onBack} />;
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>会话列表</h2>
      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        <button onClick={() => setTab('waiting')} style={{ padding: '8px 20px', border: '1px solid #d1d5db', background: tab === 'waiting' ? '#1d4ed8' : '#fff', color: tab === 'waiting' ? '#fff' : '#374151', borderRadius: '6px 0 0 6px', cursor: 'pointer', fontSize: 14 }}>待接入</button>
        <button onClick={() => setTab('active')} style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderLeft: 'none', background: tab === 'active' ? '#1d4ed8' : '#fff', color: tab === 'active' ? '#fff' : '#374151', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontSize: 14 }}>进行中</button>
      </div>
      {loading ? <Loading /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {conversations.length === 0 && <div style={{ color: '#9ca3af', textAlign: 'center', padding: 40, fontSize: 14 }}>{tab === 'waiting' ? '暂无待接入会话' : '暂无进行中会话'}</div>}
          {conversations.map((item) => (
            <Card key={item.conversation.id} style={{ cursor: 'pointer' }} onClick={() => onSelectConversation(item.conversation.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>访客 {item.conversation.visitorId.slice(0, 8)}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{item.latestMessagePreview ?? '暂无消息'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <StatusBadge status={item.conversation.status} />
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{item.conversation.createdAt ? new Date(item.conversation.createdAt).toLocaleString('zh-CN') : ''}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatView({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    agentApi.getMessages(conversationId)
      .then((res) => setMessages(res.messages))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await agentApi.sendMessage(conversationId, trimmed);
      setMessages((prev) => [...prev, res.message]);
      setInputValue('');
    } catch { /* ignore */ } finally { setSending(false); }
  };

  const handleClose = async () => {
    try {
      await agentApi.closeConversation(conversationId);
      onBack();
    } catch { /* ignore */ }
  };

  const bubbleStyle = (senderType: string): React.CSSProperties => {
    if (senderType === 'visitor') {
      return { alignSelf: 'flex-start', background: '#f3f4f6', color: '#1f2937', borderRadius: '12px 12px 12px 4px', maxWidth: '75%', padding: '8px 12px', fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word' };
    }
    if (senderType === 'agent') {
      return { alignSelf: 'flex-end', background: '#1d4ed8', color: '#fff', borderRadius: '12px 12px 4px 12px', maxWidth: '75%', padding: '8px 12px', fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word' };
    }
    return { alignSelf: 'center', background: 'transparent', color: '#9ca3af', fontStyle: 'italic', fontSize: 12, padding: '4px 8px', textAlign: 'center' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#1d4ed8', color: '#fff' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>← 返回</button>
        <span style={{ fontWeight: 600, fontSize: 15 }}>会话 {conversationId.slice(0, 8)}</span>
        <button onClick={handleClose} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>结束会话</button>
      </div>
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? <Loading /> : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', ...bubbleStyle(msg.senderType) }}>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
                  {msg.senderType === 'visitor' ? '访客' : msg.senderType === 'agent' ? '客服' : '系统'}
                </div>
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="输入回复内容..."
          disabled={sending}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }}
        />
        <Button onClick={handleSend} loading={sending} disabled={sending}>发送</Button>
      </div>
    </div>
  );
}
