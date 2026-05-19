import { useEffect, useRef, useState } from 'react';
import { ChatPanel } from './ChatPanel';

export function ChatEntry() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div
      data-testid="chat-entry"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {open && (
        <div ref={panelRef}>
          <ChatPanel onClose={() => setOpen(false)} />
        </div>
      )}
      <button
        ref={buttonRef}
        data-testid="chat-toggle-btn"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: open ? '#e5e7eb' : '#1d4ed8',
          color: open ? '#374151' : '#fff',
          fontSize: 28,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        aria-label={open ? '关闭客服' : '打开客服'}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
