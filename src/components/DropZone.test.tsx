import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from './DropZone';

describe('DropZone', () => {
  it('renders the drop target with instructional text', () => {
    render(<DropZone onFiles={vi.fn()} />);
    expect(screen.getByText(/drag & drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/click to browse/i)).toBeInTheDocument();
  });

  it('has an accessible role and label', () => {
    render(<DropZone onFiles={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /drop files here or click to browse/i }),
    ).toBeInTheDocument();
  });

  it('calls onFiles when files are selected via the hidden input', async () => {
    const user = userEvent.setup();
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.md', { type: 'text/markdown' });
    await user.upload(input, file);

    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it('calls onFiles for multiple files', async () => {
    const user = userEvent.setup();
    const onFiles = vi.fn();
    render(<DropZone onFiles={onFiles} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const files = [
      new File(['a'], 'a.md', { type: 'text/markdown' }),
      new File(['b'], 'b.txt', { type: 'text/plain' }),
    ];
    await user.upload(input, files);

    expect(onFiles).toHaveBeenCalledWith(files);
  });

  it('applies disabled styling when disabled prop is true', () => {
    render(<DropZone onFiles={vi.fn()} disabled />);
    const zone = screen.getByRole('button', { name: /drop files here or click to browse/i });
    expect(zone.className).toContain('cursor-not-allowed');
  });

  it('zone is present and interactive when rendered', () => {
    render(<DropZone onFiles={vi.fn()} />);
    const zone = screen.getByRole('button', { name: /drop files here or click to browse/i });
    expect(zone).toBeInTheDocument();
    expect(zone).not.toBeDisabled();
  });
});
