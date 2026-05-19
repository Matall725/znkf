import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatEntry } from '../src/ChatEntry';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('ChatEntry conversation initialization', () => {
  const apiBaseUrl = 'http://localhost:3000/api';

  it('shows loading state when panel opens and conversation is initializing', async () => {
    // Never resolve the fetch so we stay in loading state
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise<Response>(() => {}),
    );

    const user = userEvent.setup();
    render(<ChatEntry apiBaseUrl={apiBaseUrl} />);

    await user.click(screen.getByTestId('chat-toggle-btn'));

    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(screen.getByText('连接中，请稍候...')).toBeInTheDocument();
  });

  it('shows error state when conversation initialization fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const user = userEvent.setup();
    render(<ChatEntry apiBaseUrl={apiBaseUrl} />);

    await user.click(screen.getByTestId('chat-toggle-btn'));

    // Wait for the async operation to settle
    await vi.waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows ready state when conversation is created successfully', async () => {
    const mockConversation = {
      id: 'conv-1',
      visitorId: 'visitor-1',
      source: 'web',
      status: 'bot_serving',
      assignedAgentAccountId: null,
      handoffRequestedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closedAt: null,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ conversation: mockConversation, reusedExistingConversation: false }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const user = userEvent.setup();
    render(<ChatEntry apiBaseUrl={apiBaseUrl} />);

    await user.click(screen.getByTestId('chat-toggle-btn'));

    await vi.waitFor(() => {
      expect(screen.getByText(/开始对话吧/)).toBeInTheDocument();
    });
  });

  it('generates and persists visitor ID to localStorage', async () => {
    let capturedBody: string | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_, init) => {
      if (init && typeof init.body === 'string') {
        capturedBody = init.body;
      }

      return new Response(
        JSON.stringify({
          conversation: {
            id: 'conv-1',
            visitorId: 'test-visitor',
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
      );
    });

    const user = userEvent.setup();
    render(<ChatEntry apiBaseUrl={apiBaseUrl} />);

    await user.click(screen.getByTestId('chat-toggle-btn'));

    await vi.waitFor(() => {
      expect(capturedBody).toBeTruthy();
    });

    const body = JSON.parse(capturedBody!);
    expect(body.visitorId).toBeTruthy();
    expect(body.source).toBe('web');

    // The visitor ID should be in localStorage
    expect(localStorage.getItem('znkfxt_visitor_id')).toBe(body.visitorId);
  });
});
