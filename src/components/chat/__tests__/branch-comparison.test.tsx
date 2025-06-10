import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BranchComparison } from '../branch-comparison';
import type { Message } from '@/types';

describe('BranchComparison', () => {
  const createMessage = (
    id: string,
    role: 'user' | 'assistant',
    content: string,
    parentId?: string
  ): Message => ({
    id,
    conversationId: 'test-conv',
    role,
    content,
    model: 'test-model',
    createdAt: new Date(),
    parentId,
  });

  const mockMessages: Message[] = [
    createMessage('1', 'user', 'Hello'),
    createMessage('2', 'assistant', 'Hi there!', '1'),
    createMessage('3', 'assistant', 'Hello! How can I help?', '1'), // Branch
    createMessage('4', 'user', 'Tell me a joke', '2'),
    createMessage('5', 'assistant', 'Why did the chicken cross the road?', '4'),
    createMessage('6', 'user', 'I need help', '3'),
    createMessage('7', 'assistant', 'What do you need help with?', '6'),
  ];

  it('should render branch comparison view', () => {
    render(<BranchComparison messages={mockMessages} onClose={() => {}} />);

    expect(screen.getByText('Branch Comparison')).toBeInTheDocument();
  });

  it('should auto-select first two branches', async () => {
    render(<BranchComparison messages={mockMessages} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('2 branches selected')).toBeInTheDocument();
    });
  });

  it('should show branch selector dropdown', () => {
    render(<BranchComparison messages={mockMessages} onClose={() => {}} />);

    const selectorButton = screen.getByText(/branches selected/);
    fireEvent.click(selectorButton);

    expect(screen.getByText('Select branches to compare')).toBeInTheDocument();
    expect(screen.getByText('Main conversation')).toBeInTheDocument();
    expect(screen.getByText('Alternative 1')).toBeInTheDocument();
  });

  it('should highlight divergent messages', async () => {
    render(<BranchComparison messages={mockMessages} onClose={() => {}} />);

    await waitFor(() => {
      // Should show divergence information
      const divergentLabels = screen.getAllByText('Divergent');
      expect(divergentLabels.length).toBeGreaterThan(0);
    });
  });

  it('should show shared message count', async () => {
    render(<BranchComparison messages={mockMessages} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Shared messages:/)).toBeInTheDocument();
    });
  });

  it('should close when X button is clicked', () => {
    const mockClose = vi.fn();
    render(<BranchComparison messages={mockMessages} onClose={mockClose} />);

    const closeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(closeButton);

    expect(mockClose).toHaveBeenCalled();
  });

  it('should handle branch selection toggle', async () => {
    render(<BranchComparison messages={mockMessages} onClose={() => {}} />);

    // Open selector
    const selectorButton = screen.getByText(/branches selected/);
    fireEvent.click(selectorButton);

    // Find a branch button (should have check mark initially)
    const branchButtons = screen.getAllByRole('button');
    const mainBranchButton = branchButtons.find((btn) =>
      btn.textContent?.includes('Main conversation')
    );

    expect(mainBranchButton).toBeDefined();

    // Click to deselect
    if (mainBranchButton) {
      fireEvent.click(mainBranchButton);

      await waitFor(() => {
        expect(screen.getByText('1 branches selected')).toBeInTheDocument();
      });
    }
  });

  it('should show message when only one branch selected', async () => {
    render(<BranchComparison messages={[mockMessages[0], mockMessages[1]]} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Select at least one more branch to compare')).toBeInTheDocument();
    });
  });

  it('should show message when no branches selected', () => {
    render(<BranchComparison messages={[]} onClose={() => {}} />);

    expect(screen.getByText('Select branches to compare')).toBeInTheDocument();
  });
});
