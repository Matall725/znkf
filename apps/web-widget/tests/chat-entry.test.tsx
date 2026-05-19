import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatEntry } from '../src/ChatEntry';
import { ChatPanel } from '../src/ChatPanel';
import type { ConversationMessage } from '@znkfxt/contracts';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

const apiBaseUrl = 'http://localhost:3000/api';

function mockSuccessfulFetch() {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({
        conversation: {
          id: 'conv-1',
          visitorId: 'visitor-1',
          source: 'web',
          status: 'bot_serving',
          assignedAgentAccountId: null,
          handoffRequestedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          closedAt: null,
        },
        reusedExistingConversation: false,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    ),
  );
}

describe('ChatPanel', () => {
  it('renders welcome message and close button', () => {
    render(
      <ChatPanel
        onClose={() => {}}
        conversationState={{ kind: 'ready', conversation: null as unknown as import('@znkfxt/contracts').Conversation }}
        messages={[]}
        onSend={() => {}}
        sending={false}
      />,
    );
    expect(screen.getByText('智能客服')).toBeInTheDocument();
    expect(screen.getByText('您好，欢迎来到智能客服！')).toBeInTheDocument();
    expect(screen.getByTestId('chat-close-btn')).toBeInTheDocument();
  });

  it('shows input and send button enabled when conversation is ready', () => {
    render(
      <ChatPanel
        onClose={() => {}}
        conversationState={{ kind: 'ready', conversation: null as unknown as import('@znkfxt/contracts').Conversation }}
        messages={[]}
        onSend={() => {}}
        sending={false}
      />,
    );
    const input = screen.getByTestId('chat-input');
    expect(input).toBeEnabled();
    expect(input).toHaveAttribute('placeholder', '输入您的问题...');
    expect(screen.getByText('发送')).toBeEnabled();
  });

  it('calls onSend when send button is clicked', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(
      <ChatPanel
        onClose={() => {}}
        conversationState={{ kind: 'ready', conversation: null as unknown as import('@znkfxt/contracts').Conversation }}
        messages={[]}
        onSend={onSend}
        sending={false}
      />,
    );

    const input = screen.getByTestId('chat-input');
    await user.type(input, '你好');
    await user.click(screen.getByText('发送'));

    expect(onSend).toHaveBeenCalledWith('你好');
  });

  it('calls onSend when Enter key is pressed', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(
      <ChatPanel
        onClose={() => {}}
        conversationState={{ kind: 'ready', conversation: null as unknown as import('@znkfxt/contracts').Conversation }}
        messages={[]}
        onSend={onSend}
        sending={false}
      />,
    );

    const input = screen.getByTestId('chat-input');
    await user.type(input, '测试消息{Enter}');

    expect(onSend).toHaveBeenCalledWith('测试消息');
  });

  it('does not call onSend for empty input', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(
      <ChatPanel
        onClose={() => {}}
        conversationState={{ kind: 'ready', conversation: null as unknown as import('@znkfxt/contracts').Conversation }}
        messages={[]}
        onSend={onSend}
        sending={false}
      />,
    );

    await user.click(screen.getByText('发送'));
    expect(onSend).not.toHaveBeenCalled();

    const input = screen.getByTestId('chat-input');
    await user.type(input, '   {Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('renders visitor and bot messages', () => {
    const messages: ConversationMessage[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderType: 'visitor',
        senderId: 'visitor-1',
        messageType: 'text',
        content: '你好',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderType: 'bot',
        senderId: 'bot-1',
        messageType: 'text',
        content: '您好！有什么可以帮您？',
        createdAt: new Date().toISOString(),
      },
    ];

    render(
      <ChatPanel
        onClose={() => {}}
        conversationState={{ kind: 'ready', conversation: null as unknown as import('@znkfxt/contracts').Conversation }}
        messages={messages}
        onSend={() => {}}
        sending={false}
      />,
    );

    expect(screen.getByText('你好')).toBeInTheDocument();
    expect(screen.getByText('您好！有什么可以帮您？')).toBeInTheDocument();
  });

  it('shows sending indicator when sending is true', () => {
    render(
      <ChatPanel
        onClose={() => {}}
        conversationState={{ kind: 'ready', conversation: null as unknown as import('@znkfxt/contracts').Conversation }}
        messages={[]}
        onSend={() => {}}
        sending={true}
      />,
    );

    expect(screen.getByText('发送中...')).toBeInTheDocument();
  });

  it('renders system messages differently', () => {
    const messages: ConversationMessage[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderType: 'system',
        senderId: null,
        messageType: 'text',
        content: '会话已转接人工',
        createdAt: new Date().toISOString(),
      },
    ];

    render(
      <ChatPanel
        onClose={() => {}}
        conversationState={{ kind: 'ready', conversation: null as unknown as import('@znkfxt/contracts').Conversation }}
        messages={messages}
        onSend={() => {}}
        sending={false}
      />,
    );

    expect(screen.getByText('会话已转接人工')).toBeInTheDocument();
  });

  describe('handoff', () => {
    it('shows handoff button when status is bot_serving and onRequestHandoff is provided', () => {
      render(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'bot_serving' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
          onRequestHandoff={() => {}}
        />,
      );
      expect(screen.getByTestId('handoff-btn')).toBeInTheDocument();
      expect(screen.getByText('转人工')).toBeInTheDocument();
    });

    it('calls onRequestHandoff when handoff button is clicked', async () => {
      const onRequestHandoff = vi.fn();
      const user = userEvent.setup();
      render(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'bot_serving' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
          onRequestHandoff={onRequestHandoff}
        />,
      );
      await user.click(screen.getByTestId('handoff-btn'));
      expect(onRequestHandoff).toHaveBeenCalledTimes(1);
    });

    it('shows waiting status when conversation is waiting_agent', () => {
      render(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'waiting_agent' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
        />,
      );
      expect(screen.getByTestId('handoff-waiting')).toBeInTheDocument();
      expect(screen.getByText('正在为您转接人工坐席，请稍候...')).toBeInTheDocument();
    });

    it('disables handoff button while handoffRequesting is true', () => {
      render(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'bot_serving' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
          onRequestHandoff={() => {}}
          handoffRequesting={true}
        />,
      );
      const btn = screen.getByTestId('handoff-btn');
      expect(btn).toBeDisabled();
      expect(screen.getByText('转接中...')).toBeInTheDocument();
    });

    it('does not show handoff button when onRequestHandoff is not provided', () => {
      render(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'bot_serving' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
        />,
      );
      expect(screen.queryByTestId('handoff-btn')).not.toBeInTheDocument();
    });
  });

  describe('rating', () => {
    it('shows rating buttons when conversation is closed and onSubmitRating is provided', () => {
      render(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'closed' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
          onSubmitRating={() => {}}
        />,
      );
      expect(screen.getByText('请为本次服务评分')).toBeInTheDocument();
      expect(screen.getByLabelText('评分 1')).toBeInTheDocument();
      expect(screen.getByLabelText('评分 5')).toBeInTheDocument();
    });

    it('shows submit button after selecting a score', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'closed' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
          onSubmitRating={() => {}}
        />,
      );
      expect(screen.queryByText('提交评分')).not.toBeInTheDocument();
      await user.click(screen.getByLabelText('评分 4'));
      expect(screen.getByText('提交评分')).toBeInTheDocument();
    });

    it('calls onSubmitRating with score and comment when submit button is clicked', async () => {
      const onSubmitRating = vi.fn();
      const user = userEvent.setup();
      render(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'closed' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
          onSubmitRating={onSubmitRating}
        />,
      );
      await user.click(screen.getByLabelText('评分 5'));
      const textarea = screen.getByPlaceholderText('可选：补充您的意见');
      await user.type(textarea, '非常满意');
      await user.click(screen.getByText('提交评分'));
      expect(onSubmitRating).toHaveBeenCalledWith(5, '非常满意');
    });

    it('shows "感谢您的评价" after rating is submitted', () => {
      render(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'closed' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
          onSubmitRating={() => {}}
          ratingSubmitted={true}
        />,
      );
      expect(screen.getByText('感谢您的评价！')).toBeInTheDocument();
      expect(screen.queryByText('请为本次服务评分')).not.toBeInTheDocument();
    });

    it('does not show rating buttons when onSubmitRating is not provided', () => {
      render(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'closed' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
        />,
      );
      expect(screen.getByText('会话已结束')).toBeInTheDocument();
      expect(screen.queryByText('请为本次服务评分')).not.toBeInTheDocument();
    });

    it('shows "提交中..." on submit button while submittingRating is true', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'closed' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
          onSubmitRating={() => {}}
        />,
      );
      // First select a score
      await user.click(screen.getByLabelText('评分 4'));
      expect(screen.getByText('提交评分')).toBeInTheDocument();

      // Then re-render with submittingRating=true
      rerender(
        <ChatPanel
          onClose={() => {}}
          conversationState={{ kind: 'ready', conversation: { id: 'conv-1', status: 'closed' } as import('@znkfxt/contracts').Conversation }}
          messages={[]}
          onSend={() => {}}
          sending={false}
          onSubmitRating={() => {}}
          submittingRating={true}
        />,
      );
      expect(screen.getByText('提交中...')).toBeInTheDocument();
    });
  });
});

describe('ChatEntry', () => {
  it('renders floating toggle button collapsed by default', () => {
    mockSuccessfulFetch();
    render(<ChatEntry apiBaseUrl={apiBaseUrl} />);
    expect(screen.getByTestId('chat-entry')).toBeInTheDocument();
    const btn = screen.getByTestId('chat-toggle-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', '打开客服');
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
  });

  it('opens panel when button is clicked', async () => {
    mockSuccessfulFetch();
    const user = userEvent.setup();
    render(<ChatEntry apiBaseUrl={apiBaseUrl} />);
    const btn = screen.getByTestId('chat-toggle-btn');

    await user.click(btn);

    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', '关闭客服');
  });

  it('closes panel when close button inside panel is clicked', async () => {
    mockSuccessfulFetch();
    const user = userEvent.setup();
    render(<ChatEntry apiBaseUrl={apiBaseUrl} />);

    // Open first
    await user.click(screen.getByTestId('chat-toggle-btn'));
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();

    // Close via panel close button
    await user.click(screen.getByTestId('chat-close-btn'));
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
  });

  it('toggles panel when button is clicked twice', async () => {
    mockSuccessfulFetch();
    const user = userEvent.setup();
    render(<ChatEntry apiBaseUrl={apiBaseUrl} />);

    await user.click(screen.getByTestId('chat-toggle-btn'));
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();

    await user.click(screen.getByTestId('chat-toggle-btn'));
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
  });
});
