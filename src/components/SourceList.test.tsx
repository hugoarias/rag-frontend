import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceList } from './SourceList';
import type { Source } from '../types/chat';

const sources: Source[] = [
  { file: 'docs/guide.md', chunk: 'This is the first chunk of content.' },
  { file: 'docs/api.md', chunk: 'This is the second chunk of content.' },
];

describe('SourceList', () => {
  it('renders nothing when sources array is empty', () => {
    const { container } = render(<SourceList sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the correct source count', () => {
    render(<SourceList sources={sources} />);
    expect(screen.getByRole('button')).toHaveTextContent('2 sources');
  });

  it('shows singular "source" for a single source', () => {
    render(<SourceList sources={[sources[0]]} />);
    expect(screen.getByRole('button')).toHaveTextContent('1 source');
  });

  it('does not show source details before expanding', () => {
    render(<SourceList sources={sources} />);
    expect(screen.queryByText('docs/guide.md')).not.toBeInTheDocument();
  });

  it('shows source details after clicking the toggle button', async () => {
    const user = userEvent.setup();
    render(<SourceList sources={sources} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('docs/guide.md')).toBeInTheDocument();
    expect(screen.getByText('docs/api.md')).toBeInTheDocument();
    expect(screen.getByText('This is the first chunk of content.')).toBeInTheDocument();
  });

  it('hides source details after collapsing', async () => {
    const user = userEvent.setup();
    render(<SourceList sources={sources} />);

    await user.click(screen.getByRole('button')); // expand
    await user.click(screen.getByRole('button')); // collapse

    expect(screen.queryByText('docs/guide.md')).not.toBeInTheDocument();
  });
});
