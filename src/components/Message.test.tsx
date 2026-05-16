import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Message } from './Message';
import type { Message as MessageType } from '../types/chat';

function makeMessage(overrides: Partial<MessageType> = {}): MessageType {
  return {
    id: '1',
    role: 'assistant',
    content: 'Hello world',
    sources: [],
    streaming: false,
    ...overrides,
  };
}

describe('Message', () => {
  it('renders the message content', () => {
    render(<Message message={makeMessage({ content: 'Test content' })} />);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('shows the streaming cursor when streaming is true', () => {
    const { container } = render(<Message message={makeMessage({ streaming: true })} />);
    expect(container.querySelector('.cursor-blink')).toBeInTheDocument();
  });

  it('does not show the streaming cursor when streaming is false', () => {
    const { container } = render(<Message message={makeMessage({ streaming: false })} />);
    expect(container.querySelector('.cursor-blink')).not.toBeInTheDocument();
  });

  it('renders SourceList for an assistant message with sources', () => {
    const sources = [{ file: 'a.md', chunk: 'ctx' }];
    render(<Message message={makeMessage({ role: 'assistant', sources })} />);
    expect(screen.getByRole('button', { name: /source/i })).toBeInTheDocument();
  });

  it('does not render SourceList for a user message', () => {
    const sources = [{ file: 'a.md', chunk: 'ctx' }];
    render(<Message message={makeMessage({ role: 'user', sources })} />);
    expect(screen.queryByRole('button', { name: /source/i })).not.toBeInTheDocument();
  });

  it('aligns user messages to the right', () => {
    const { container } = render(<Message message={makeMessage({ role: 'user' })} />);
    expect(container.firstChild).toHaveClass('justify-end');
  });

  it('aligns assistant messages to the left', () => {
    const { container } = render(<Message message={makeMessage({ role: 'assistant' })} />);
    expect(container.firstChild).toHaveClass('justify-start');
  });
});
