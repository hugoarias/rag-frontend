import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatWindow } from './ChatWindow';
import type { Message } from '../types/chat';

function makeMessage(id: string, role: Message['role'], content: string): Message {
  return { id, role, content, sources: [], streaming: false };
}

describe('ChatWindow', () => {
  it('shows an empty-state prompt when there are no messages', () => {
    render(<ChatWindow messages={[]} />);
    expect(screen.getByText(/ask a question to get started/i)).toBeInTheDocument();
  });

  it('does not show empty-state when messages are present', () => {
    const messages = [makeMessage('1', 'user', 'Hello')];
    render(<ChatWindow messages={messages} />);
    expect(screen.queryByText(/ask a question to get started/i)).not.toBeInTheDocument();
  });

  it('renders all messages', () => {
    const messages = [
      makeMessage('1', 'user', 'Hi there'),
      makeMessage('2', 'assistant', 'Hello back'),
    ];
    render(<ChatWindow messages={messages} />);
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(screen.getByText('Hello back')).toBeInTheDocument();
  });

  it('renders the correct number of message bubbles', () => {
    const messages = [
      makeMessage('1', 'user', 'First'),
      makeMessage('2', 'assistant', 'Second'),
      makeMessage('3', 'user', 'Third'),
    ];
    render(<ChatWindow messages={messages} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });
});
