import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { isLoggedIn, getStoredAccount, clearAuth } from './api-client';
import type { AuthenticatedAccount } from '@znkfxt/contracts';

type Page = 'dashboard' | 'knowledge';

export function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [account, setAccount] = useState<AuthenticatedAccount | null>(getStoredAccount);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const handleLogin = (acc: AuthenticatedAccount) => {
    setAccount(acc);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    clearAuth();
    setLoggedIn(false);
    setAccount(null);
  };

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const navItems: { key: Page; label: string }[] = [
    { key: 'dashboard', label: '仪表盘' },
    { key: 'knowledge', label: '知识库' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, background: '#1f2937', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #374151' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>智能客服</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>管理后台</div>
        </div>
        <div style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key)}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 20px',
                textAlign: 'left',
                background: currentPage === item.key ? '#374151' : 'transparent',
                color: currentPage === item.key ? '#fff' : '#d1d5db',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'background 0.15s',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #374151', fontSize: 13, color: '#9ca3af' }}>
          <div>{account?.displayName}</div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: 13, marginTop: 4 }}>退出登录</button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'knowledge' && <KnowledgePage />}
      </main>
    </div>
  );
}
