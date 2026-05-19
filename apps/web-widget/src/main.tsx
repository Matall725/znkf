import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatEntry } from './ChatEntry';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ChatEntry apiBaseUrl={import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'} />
    </StrictMode>,
  );
}
