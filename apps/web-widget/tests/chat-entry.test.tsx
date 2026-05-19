import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ChatEntry } from '../src/ChatEntry';
import { ChatPanel } from '../src/ChatPanel';

afterEach(cleanup);

describe('ChatPanel', () => {
  it('renders welcome message and close button', () => {
    render(<ChatPanel onClose={() => {}} />);
    expect(screen.getByText('智能客服')).toBeInTheDocument();
    expect(screen.getByText('您好，欢迎来到智能客服！')).toBeInTheDocument();
    expect(screen.getByTestId('chat-close-btn')).toBeInTheDocument();
  });

  it('shows input placeholder and disabled send button', () => {
    render(<ChatPanel onClose={() => {}} />);
    const input = screen.getByTestId('chat-input');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', '输入您的问题...');
    expect(screen.getByText('发送')).toBeDisabled();
  });
});

describe('ChatEntry', () => {
  it('renders floating toggle button collapsed by default', () => {
    render(<ChatEntry />);
    expect(screen.getByTestId('chat-entry')).toBeInTheDocument();
    const btn = screen.getByTestId('chat-toggle-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', '打开客服');
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
  });

  it('opens panel when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatEntry />);
    const btn = screen.getByTestId('chat-toggle-btn');

    await user.click(btn);

    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', '关闭客服');
  });

  it('closes panel when close button inside panel is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatEntry />);

    // Open first
    await user.click(screen.getByTestId('chat-toggle-btn'));
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();

    // Close via panel close button
    await user.click(screen.getByTestId('chat-close-btn'));
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
  });

  it('toggles panel when button is clicked twice', async () => {
    const user = userEvent.setup();
    render(<ChatEntry />);

    await user.click(screen.getByTestId('chat-toggle-btn'));
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();

    await user.click(screen.getByTestId('chat-toggle-btn'));
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
  });
});
