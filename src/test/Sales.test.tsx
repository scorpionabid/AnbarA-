import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sales } from '../components/Sales';

// Mock props
const mockUser = {
  uid: 'test-user-id',
  role: 'super_admin',
  storeId: 'test-store-id',
  displayName: 'Test User'
};

describe('Sales Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<Sales user={mockUser} />);
    expect(screen.getByText(/Məhsullar yüklənir/i)).toBeInTheDocument();
  });
});
