import { useState } from 'react';
import { agentApi } from '../api-client';
import { Button, Input, Card } from '@znkfxt/shared-ui';
import type { AuthenticatedAccount } from '@znkfxt/contracts';

interface LoginPageProps {
  onLogin: (account: AuthenticatedAccount) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginName.trim() || !password.trim()) { setError('请输入账号和密码'); return; }
    setLoading(true);
    try {
      const res = await agentApi.login({ loginName: loginName.trim(), password });
      onLogin(res.account);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f3f4f6' }}>
      <Card style={{ width: 360 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>客服工作台登录</h1>
          <Input label="账号" value={loginName} onChange={(e) => setLoginName(e.target.value)} placeholder="请输入账号" />
          <Input label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" />
          {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
          <Button type="submit" loading={loading} style={{ width: '100%' }}>登录</Button>
        </form>
      </Card>
    </div>
  );
}
