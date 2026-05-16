import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';

function renderInput(overrides: Partial<React.ComponentProps<typeof ChatInput>> = {}) {
  const props = {
    onSend: vi.fn(),
    isLoading: false,
    streamingEnabled: true,
    onToggleStreaming: vi.fn(),
    ...overrides,
  };
  render(<ChatInput {...props} />);
  return props;
}

describe('ChatInput', () => {
  it('renders the textarea and send button', () => {
    renderInput();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('send button is disabled when textarea is empty', () => {
    renderInput();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('send button becomes enabled when text is entered', async () => {
    const user = userEvent.setup();
    renderInput();
    await user.type(screen.getByRole('textbox'), 'Hello');
    expect(screen.getByRole('button', { name: /send/i })).toBeEnabled();
  });

  it('calls onSend with trimmed value when Send is clicked', async () => {
    const user = userEvent.setup();
    const { onSend } = renderInput();
    await user.type(screen.getByRole('textbox'), 'My question');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).toHaveBeenCalledWith('My question');
  });

  it('clears textarea after sending', async () => {
    const user = userEvent.setup();
    renderInput();
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'My question');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(textarea).toHaveValue('');
  });

  it('sends on Enter key', async () => {
    const user = userEvent.setup();
    const { onSend } = renderInput();
    await user.type(screen.getByRole('textbox'), 'Hello{Enter}');
    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('does not send on Shift+Enter', async () => {
    const user = userEvent.setup();
    const { onSend } = renderInput();
    await user.type(screen.getByRole('textbox'), 'Hello{Shift>}{Enter}{/Shift}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables textarea and button while loading', () => {
    renderInput({ isLoading: true });
    expect(screen.getByRole('textbox')).toBeDisabled();
    // Button is also disabled (shows "Thinking")
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows "Thinking" spinner while loading', () => {
    renderInput({ isLoading: true });
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });

  it('streaming checkbox reflects streamingEnabled prop', () => {
    renderInput({ streamingEnabled: false });
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('calls onToggleStreaming when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const { onToggleStreaming } = renderInput({ streamingEnabled: true });
    await user.click(screen.getByRole('checkbox'));
    expect(onToggleStreaming).toHaveBeenCalledWith(false);
  });
});
