import { useState, useCallback } from 'react';
import { LoginPage } from './pages/LoginPage';
import { ConversationsPage } from './pages/ConversationsPage';
import { isLoggedIn, getStoredAccount, clearAuth } from './api-client';
import type { AuthenticatedAccount } from '@znkfxt/contracts';
import type { ConversationListItem } from '@znkfxt/contracts';

export function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [account, setAccount] = useState<AuthenticatedAccount | null>(getStoredAccount);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  const handleLogin = (acc: AuthenticatedAccount) => {
    setAccount(acc);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    clearAuth();
    setLoggedIn(false);
    setAccount(null);
  };

  const handleSelectConversation = useCallback((convId: string) => {
    setActiveConvId(convId);
  }, []);

  const handleBack = useCallback(() => {
    setActiveConvId(null);
  }, []);

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, background: '#1f2937', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #374151' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>智能客服</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>客服工作台</div>
        </div>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #374151', fontSize: 13, color: '#9ca3af' }}>
          {account?.displayName}
        </div>
        <div style={{ flex: 1, padding: '12px 0' }}>
          <button
            onClick={() => setActiveConvId(null)}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 20px',
              textAlign: 'left',
              background: !activeConvId ? '#374151' : 'transparent',
              color: !activeConvId ? '#fff' : '#d1d5db',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            会话列表
          </button>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #374151' }}>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: 13 }}>退出登录</button>
        </div>
      </nav>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <ConversationsPage
          activeConvId={activeConvId}
          onSelectConversation={handleSelectConversation}
          onBack={handleBack}
        />
      </main>
    </div>
  );
}
