import { useCallback, useRef, useState } from 'react';
import type { Conversation, ConversationMessage, CreateSatisfactionRatingRequest } from '@znkfxt/contracts';
import { ApiClient } from '../api-client';
import { getOrCreateVisitorId } from '../visitor-id';

export type ConversationState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; conversation: Conversation }
  | { kind: 'error'; message: string };

export interface UseConversationOptions {
  apiBaseUrl: string;
}

export function useConversation({ apiBaseUrl }: UseConversationOptions) {
  const [state, setState] = useState<ConversationState>({ kind: 'idle' });
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [handoffRequesting, setHandoffRequesting] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const clientRef = useRef<ApiClient | null>(null);
  const visitorIdRef = useRef<string | null>(null);

  if (!clientRef.current) {
    clientRef.current = new ApiClient({ baseUrl: apiBaseUrl });
  }

  if (!visitorIdRef.current) {
    visitorIdRef.current = getOrCreateVisitorId();
  }

  const initialize = useCallback(async () => {
    const client = clientRef.current;
    const visitorId = visitorIdRef.current;

    if (!client || !visitorId) {
      return;
    }

    setState({ kind: 'loading' });

    try {
      const response = await client.createOrReuseConversation(visitorId);

      setState({
        kind: 'ready',
        conversation: response.conversation,
      });

      // Load existing messages after initialization
      try {
        const history = await client.listMessages(response.conversation.id);
        setMessages(history.messages);
      } catch {
        // Silently fail — messages are not critical
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to initialize conversation.';

      setState({ kind: 'error', message });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ kind: 'idle' });
    setMessages([]);
  }, []);

  const loadHistory = useCallback(async () => {
    const client = clientRef.current;
    const currentState = state;

    if (!client || currentState.kind !== 'ready') {
      return;
    }

    try {
      const result = await client.listMessages(currentState.conversation.id);
      setMessages(result.messages);
    } catch (error) {
      // Silently fail — messages are not critical for initial render
      if (error instanceof Error) {
        console.error('Failed to load conversation history:', error.message);
      }
    }
  }, [state]);

  const sendMessage = useCallback(async (content: string) => {
    const client = clientRef.current;
    const currentState = state;

    if (!client || currentState.kind !== 'ready') {
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;

    setSending(true);

    try {
      const response = await client.sendMessage(
        currentState.conversation.id,
        { content: trimmed },
      );

      setMessages((prev) => [...prev, response.visitorMessage]);

      const botMsg = response.botMessage;
      if (botMsg) {
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send message.';
      setState({ kind: 'error', message });
    } finally {
      setSending(false);
    }
  }, [state]);

  const requestHandoff = useCallback(async () => {
    const client = clientRef.current;
    const currentState = state;

    if (!client || currentState.kind !== 'ready' || handoffRequesting) {
      return;
    }

    setHandoffRequesting(true);

    try {
      const response = await client.requestHandoff(currentState.conversation.id);

      setState({
        kind: 'ready',
        conversation: response.conversation,
      });

      setMessages((prev) => [...prev, response.systemMessage]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to request handoff.';
      setState({ kind: 'error', message });
    } finally {
      setHandoffRequesting(false);
    }
  }, [state, handoffRequesting]);

  const submitRating = useCallback(async (score: number, comment?: string) => {
    const client = clientRef.current;
    const currentState = state;

    if (!client || currentState.kind !== 'ready' || submittingRating || ratingSubmitted) {
      return;
    }

    setSubmittingRating(true);

    try {
      await client.createRating(currentState.conversation.id, { score: score as 1|2|3|4|5, comment });
      setRatingSubmitted(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to submit rating.';
      setState({ kind: 'error', message });
    } finally {
      setSubmittingRating(false);
    }
  }, [state, submittingRating, ratingSubmitted]);

  return { state, initialize, reset, visitorId: visitorIdRef.current, messages, sendMessage, sending, loadHistory, requestHandoff, handoffRequesting, submitRating, submittingRating, ratingSubmitted };
}
