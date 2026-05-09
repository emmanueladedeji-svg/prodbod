import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InviteMemberDialog } from '../InviteMemberDialog';

// Mock the hooks used in the component
vi.mock('@/hooks/useProdbodMembers', () => ({
  DEPARTMENTS: ['Engineering', 'Product', 'QA'],
}));

describe('InviteMemberDialog', () => {
  it('should parse multiple emails correctly and call onInvite', () => {
    const onInvite = vi.fn();
    const emailsInput = 'test1@example.com, test2@example.com\n test3@example.com';
    
    render(
      <InviteMemberDialog
        open={true}
        onOpenChange={() => {}}
        onInvite={onInvite}
        loading={false}
      />
    );

    const textarea = screen.getByLabelText(/Emails/i);
    fireEvent.change(textarea, { target: { value: emailsInput } });

    const submitButton = screen.getByRole('button', { name: /Send Invites/i });
    fireEvent.click(submitButton);

    expect(onInvite).toHaveBeenCalledWith({
      emails: ['test1@example.com', 'test2@example.com', 'test3@example.com'],
      department: undefined,
    });
  });

  it('should handle invalid emails by filtering them out', () => {
    const onInvite = vi.fn();
    const emailsInput = 'valid@example.com, invalid-email, another@valid.com';
    
    render(
      <InviteMemberDialog
        open={true}
        onOpenChange={() => {}}
        onInvite={onInvite}
        loading={false}
      />
    );

    const textarea = screen.getByPlaceholderText(/Enter emails/i);
    fireEvent.change(textarea, { target: { value: emailsInput } });

    const submitButton = screen.getByRole('button', { name: /Send Invites/i });
    fireEvent.click(submitButton);

    expect(onInvite).toHaveBeenCalledWith({
      emails: ['valid@example.com', 'another@valid.com'],
      department: undefined,
    });
  });
});
